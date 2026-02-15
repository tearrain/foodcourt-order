/**
 * Translation Service
 * 可复用的自动翻译组件
 */

import { D1Database } from '@cloudflare/workers-types';
import { KVNamespace } from '@cloudflare/workers-types';
import OpenAI from 'openai';

// 配置
interface TranslationConfig {
  engine: 'openai' | 'google' | 'deepl' | 'mock';
  apiKey: string;
  supportedLanguages: string[];
  defaultSourceLang: string;
  cacheTTL: number; // ms
  budget: {
    monthlyLimit: number;
    alertThreshold: number;
  };
}

interface TranslationItem {
  resourceType: string;
  resourceId: string;
  fieldName: string;
  originalText: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslationResult {
  success: boolean;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  engine: string;
  cost: number;
  cached: boolean;
  error?: string;
}

export class TranslationService {
  private db: D1Database;
  private cache: KVNamespace;
  private config: TranslationConfig;
  private openai: OpenAI | null = null;

  constructor(db: D1Database, cache: KVNamespace, config: Partial<TranslationConfig> = {}) {
    this.db = db;
    this.cache = cache;
    this.config = {
      engine: config.engine || 'openai',
      apiKey: config.apiKey || '',
      supportedLanguages: config.supportedLanguages || ['en', 'zh-CN', 'ms', 'id', 'th', 'ja', 'ko'],
      defaultSourceLang: config.defaultSourceLang || 'zh-CN',
      cacheTTL: config.cacheTTL || 24 * 60 * 60 * 1000,
      budget: {
        monthlyLimit: config.budget?.monthlyLimit || 100,
        alertThreshold: config.budget?.alertThreshold || 0.8,
      },
    };

    // 初始化 OpenAI
    if (this.config.engine === 'openai' && this.config.apiKey) {
      this.openai = new OpenAI({ apiKey: this.config.apiKey });
    }
  }

  // ==================== 翻译单条文本 ====================

  async translate(
    text: string,
    targetLang: string,
    options?: {
      sourceLang?: string;
      force?: boolean;
    }
  ): Promise<TranslationResult> {
    const sourceLang = options?.sourceLang || this.config.defaultSourceLang;

    // 1. 检查缓存
    if (!options?.force) {
      const cached = await this.getCache(text, sourceLang, targetLang);
      if (cached) {
        return {
          success: true,
          translatedText: cached,
          sourceLang,
          targetLang,
          engine: 'cache',
          cost: 0,
          cached: true,
        };
      }
    }

    // 2. 检查数据库翻译表
    const dbTranslation = await this.getFromDatabase(text, sourceLang, targetLang);
    if (dbTranslation && !options?.force) {
      await this.setCache(text, sourceLang, targetLang, dbTranslation);
      return {
        success: true,
        translatedText: dbTranslation,
        sourceLang,
        targetLang,
        engine: 'database',
        cost: 0,
        cached: true,
      };
    }

    // 3. 调用翻译引擎
    try {
      const translated = await this.callEngine(text, sourceLang, targetLang);
      
      // 4. 保存到缓存和数据库
      await this.setCache(text, sourceLang, targetLang, translated);
      await this.saveToDatabase(text, translated, sourceLang, targetLang);

      return {
        success: true,
        translatedText: translated,
        sourceLang,
        targetLang,
        engine: this.config.engine,
        cost: this.estimateCost(text),
        cached: false,
      };
    } catch (error) {
      return {
        success: false,
        translatedText: text, // 失败返回原文
        sourceLang,
        targetLang,
        engine: this.config.engine,
        cost: 0,
        cached: false,
        error: (error as Error).message,
      };
    }
  }

  // ==================== 批量翻译 ====================

  async translateBatch(
    items: TranslationItem[],
    options?: {
      parallel?: boolean;
    }
  ): Promise<Map<string, TranslationResult>> {
    const results = new Map<string, TranslationResult>();
    const parallel = options?.parallel !== false;

    const processItem = async (item: TranslationItem) => {
      const key = `${item.resourceType}:${item.resourceId}:${item.fieldName}:${item.targetLang}`;
      const result = await this.translate(
        item.originalText,
        item.targetLang,
        { sourceLang: item.sourceLang }
      );
      results.set(key, result);

      // 保存到翻译表
      if (result.success) {
        await this.saveTranslationRecord(item, result);
      }
    };

    if (parallel) {
      await Promise.all(items.map(processItem));
    } else {
      for (const item of items) {
        await processItem(item);
      }
    }

    return results;
  }

  // ==================== 智能翻译 ====================

  async smartTranslate(
    text: string,
    userLang: string
  ): Promise<string> {
    const sourceLang = this.detectLanguage(text);
    
    // 如果用户语言和原文语言相同，直接返回
    if (sourceLang === userLang) {
      return text;
    }

    // 如果支持的语言列表中不包含用户语言，使用英文
    const targetLang = this.config.supportedLanguages.includes(userLang)
      ? userLang
      : 'en';

    const result = await this.translate(text, targetLang, { sourceLang });
    return result.success ? result.translatedText : text;
  }

  // ==================== 队列处理 ====================

  async processQueue(limit: number = 100): Promise<{
    processed: number;
    success: number;
    failed: number;
  }> {
    // 获取待处理任务
    const tasks = await this.db.prepare(`
      SELECT * FROM translation_queue
      WHERE status = 'pending'
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT ?
    `).bind(limit).all();

    let processed = 0;
    let success = 0;
    let failed = 0;

    for (const task of (tasks.results as any[])) {
      processed++;
      
      try {
        const result = await this.translate(
          task.original_text,
          task.target_lang,
          { sourceLang: task.source_lang }
        );

        if (result.success) {
          // 更新任务状态
          await this.db.prepare(`
            UPDATE translation_queue
            SET status = 'completed',
                translated_text = ?,
                completed_at = datetime('now')
            WHERE id = ?
          `).bind(result.translatedText, task.id).run();

          // 保存翻译记录
          await this.saveTranslationRecord(
            {
              resourceType: task.resource_type,
              resourceId: task.resource_id,
              fieldName: task.field_name,
              originalText: task.original_text,
              sourceLang: task.source_lang,
              targetLang: task.target_lang,
            },
            result
          );

          success++;
        } else {
          await this.markTaskFailed(task.id, result.error || 'Unknown error');
          failed++;
        }
      } catch (error) {
        await this.markTaskFailed(task.id, (error as Error).message);
        failed++;
      }
    }

    return { processed, success, failed };
  }

  // ==================== 辅助方法 ====================

  private async callEngine(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    if (this.config.engine === 'mock') {
      return `[${targetLang}] ${text}`;
    }

    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only output the translated text, no explanations.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || text;
  }

  private async getCache(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null> {
    const key = this.generateCacheKey(text, sourceLang, targetLang);
    const cached = await this.cache.get(key);
    return cached;
  }

  private async setCache(
    text: string,
    sourceLang: string,
    targetLang: string,
    translated: string
  ): Promise<void> {
    const key = this.generateCacheKey(text, sourceLang, targetLang);
    await this.cache.put(key, translated, { expirationTtl: Math.floor(this.config.cacheTTL / 1000) });
  }

  private async getFromDatabase(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null> {
    // 检查翻译内容表
    const result = await this.db.prepare(`
      SELECT translated_text FROM translation_content
      WHERE resource_id IN (
        SELECT id FROM translation_resource
        WHERE original_text = ? AND original_lang = ?
      )
      AND lang = ?
      AND is_auto_translated = 1
      ORDER BY quality_score DESC
      LIMIT 1
    `).bind(text, sourceLang, targetLang).first();

    return result?.translated_text || null;
  }

  private async saveToDatabase(
    text: string,
    translated: string,
    sourceLang: string,
    targetLang: string
  ): Promise<void> {
    // 检查是否已存在资源记录
    const existing = await this.db.prepare(`
      SELECT id FROM translation_resource
      WHERE original_text = ? AND original_lang = ?
    `).bind(text, sourceLang).first();

    let resourceId: string;

    if (existing) {
      resourceId = existing.id;
    } else {
      // 创建新资源记录
      const insert = await this.db.prepare(`
        INSERT INTO translation_resource (original_text, original_lang)
        VALUES (?, ?)
      `).bind(text, sourceLang).run();
      resourceId = insert.meta.last_row_id;
    }

    // 保存翻译内容
    await this.db.prepare(`
      INSERT OR REPLACE INTO translation_content (resource_id, lang, translated_text, engine, is_auto_translated)
      VALUES (?, ?, ?, ?, 1)
    `).bind(resourceId, targetLang, translated, this.config.engine).run();
  }

  private async saveTranslationRecord(
    item: TranslationItem,
    result: TranslationResult
  ): Promise<void> {
    // 保存到翻译内容表
    await this.db.prepare(`
      INSERT OR IGNORE INTO translation_content (
        resource_id, lang, translated_text, engine, is_auto_translated, quality_score
      ) VALUES (
        (SELECT id FROM translation_resource 
         WHERE resource_type = ? AND resource_id = ? AND field_name = ? AND original_lang = ?),
        ?, ?, ?, 1, NULL
      )
    `).bind(
      item.resourceType,
      item.resourceId,
      item.fieldName,
      item.sourceLang,
      item.targetLang,
      result.translatedText,
      result.engine
    ).run();

    // 更新资源表的翻译状态
    await this.db.prepare(`
      UPDATE translation_resource
      SET status = 'completed',
          translated_count = translated_count + 1
      WHERE resource_type = ? AND resource_id = ? AND field_name = ?
    `).bind(item.resourceType, item.resourceId, item.fieldName).run();
  }

  private async markTaskFailed(taskId: string, error: string): Promise<void> {
    await this.db.prepare(`
      UPDATE translation_queue
      SET status = 'failed',
          error_message = ?,
          retry_count = retry_count + 1
      WHERE id = ?
    `).bind(error, taskId).run();
  }

  private async generateCacheKey(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    const hash = await this.hashText(text);
    return `t:${sourceLang}:${targetLang}:${hash}`;
  }

  private async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private detectLanguage(text: string): string {
    // 简单的语言检测
    // 实际应该使用专业语言检测库
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const malayRegex = /[a-zA-Z]+/;
    
    if (chineseRegex.test(text)) {
      return 'zh-CN';
    }
    
    return this.config.defaultSourceLang;
  }

  private estimateCost(text: string): number {
    // 估算 OpenAI 成本（大约 0.001 美元 / 1000 tokens）
    const tokens = text.length / 4;
    return tokens * 0.001 / 1000;
  }
}
