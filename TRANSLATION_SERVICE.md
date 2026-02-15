# 🍜 食阁扫码点单系统 - 自动翻译组件设计

**创建时间：** 2026-02-15
**目标：** 可复用的多语言翻译组件

---

## 一、核心需求分析

### 1.1 问题场景

```
用户上传商品（中文）
        │
        ▼
系统自动翻译成 7 种语言
        │
        ▼
用户根据浏览器语言自动显示
```

### 1.2 技术挑战

| 挑战 | 解决方案 |
|------|----------|
| 翻译成本高 | 缓存 + 按需翻译 |
| 翻译质量 | 多种翻译引擎可选 |
| 实时翻译延迟 | 预翻译 + 后台异步 |
| 多语言管理 | 统一翻译表 |
| 可复用性 | 抽象成独立服务 |

---

## 二、架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        翻译服务架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │  翻译引擎   │    │  翻译缓存   │    │  翻译队列   │         │
│   │  Adapter   │    │   Cache     │    │   Queue     │         │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│          │                  │                  │                  │
│          └────────────────┼──────────────────┘                  │
│                           │                                       │
│                    ┌──────┴──────┐                               │
│                    │   翻译服务   │                               │
│                    │  Translation │                               │
│                    │   Service    │                               │
│                    └──────┬──────┘                               │
│                           │                                       │
│          ┌───────────────┼───────────────┐                       │
│          │               │               │                       │
│          ▼               ▼               ▼                       │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐                 │
│   │  食阁项目  │   │  商城项目  │   │  其他项目  │                 │
│   └───────────┘   └───────────┘   └───────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、核心组件设计

### 3.1 翻译引擎抽象

```typescript
// 翻译引擎接口
interface TranslationEngine {
  name: string;
  translate(text: string, targetLang: string): Promise<TranslationResult>;
  translateBatch(texts: string[], targetLang: string[]): Promise<TranslationResult[]>;
  getSupportedLanguages(): Language[];
  estimateCost(text: string): number;
}

// 支持的翻译引擎
type EngineType = 'openai' | 'google' | 'deepl' | 'azure' | 'mock';

// 翻译结果
interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  engine: string;
  cost: number;
  cached: boolean;
  timestamp: Date;
}
```

### 3.2 翻译服务核心

```typescript
class TranslationService {
  constructor(
    private engine: TranslationEngine,
    private cache: TranslationCache,
    private queue: TranslationQueue
  ) {}

  // 翻译单条文本
  async translate(
    text: string,
    targetLang: string,
    options?: {
      sourceLang?: string;
      force?: boolean;     // 强制重新翻译
      priority?: number;    // 优先级
    }
  ): Promise<string>;

  // 批量翻译
  async translateBatch(
    texts: TranslationItem[],
    targetLangs: string[]
  ): Promise<Map<string, string>>;

  // 智能翻译（检测是否需要翻译）
  async smartTranslate(
    text: string,
    userLang: string,
    fallbackLang: string = 'en'
  ): Promise<string>;
}
```

### 3.3 缓存策略

```typescript
// 三级缓存
interface TranslationCache {
  // L1: 内存缓存（进程内）
  memory: Map<string, string>;
  
  // L2: Redis/D1 缓存
  async get(key: string): Promise<string | null>;
  async set(key: string, value: string, ttl: number): Promise<void>;
  
  // L3: 翻译表缓存（数据库）
  database: TranslationDatabase;
}

// 缓存键设计
function generateCacheKey(
  text: string,
  sourceLang: string,
  targetLang: string,
  projectId: string
): string {
  return `t:${projectId}:${sourceLang}:${targetLang}:${hash(text)}`;
}
```

### 3.4 自动触发机制

```typescript
// 商品保存时自动翻译
class AutoTranslationTrigger {
  constructor(
    private translationService: TranslationService,
    private translationQueue: TranslationQueue
  ) {}

  // 监听商品创建/更新
  async onProductSave(product: Product): Promise<void> {
    const targetLangs = this.getSupportedLanguages();
    
    // 立即翻译用户的首选语言
    await this.translateImmediately(product, targetLangs[0]);
    
    // 其他语言加入队列异步翻译
    for (const lang of targetLangs.slice(1)) {
      await this.queue.add({
        type: 'translate',
        resource: 'product',
        resourceId: product.id,
        text: product.name,
        sourceLang: product.originalLang,
        targetLang: lang,
        priority: lang === 'zh-CN' ? 'high' : 'normal'
      });
    }
  }

  // 监听翻译内容更新
  async onTranslationSave(translation: TranslationContent): Promise<void> {
    // 更新所有关联资源的翻译
    await this.syncTranslation(translation);
  }
}
```

---

## 四、翻译表设计

### 4.1 翻译资源表

```sql
-- 翻译资源表
CREATE TABLE translation_resource (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 资源标识
  resource_type VARCHAR(50) NOT NULL,  -- product, category, stall, food_court
  resource_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,  -- name, description, title
  
  -- 原文
  original_text TEXT NOT NULL,
  original_lang VARCHAR(10) NOT NULL,  -- zh-CN, en, ms
  
  -- 翻译状态
  status VARCHAR(20) DEFAULT 'pending',  -- pending, translating, completed, failed
  translated_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  
  -- 元数据
  project_id VARCHAR(100) NOT NULL,
  created_by UUID,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(resource_type, resource_id, field_name, original_lang)
);

CREATE INDEX idx_trans_resource ON translation_resource(resource_type, resource_id);
CREATE INDEX idx_trans_status ON translation_resource(status);
CREATE INDEX idx_trans_project ON translation_resource(project_id);
```

### 4.2 翻译内容表

```sql
-- 翻译内容表
CREATE TABLE translation_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联资源
  resource_id UUID NOT NULL REFERENCES translation_resource(id) ON DELETE CASCADE,
  
  -- 目标语言
  lang VARCHAR(10) NOT NULL,
  
  -- 翻译内容
  translated_text TEXT NOT NULL,
  
  -- 翻译信息
  engine VARCHAR(50),                    -- 翻译引擎
  is_auto_translated BOOLEAN DEFAULT TRUE,  -- 是否自动翻译
  is_manually_edited BOOLEAN DEFAULT FALSE, -- 是否人工校对
  edited_by UUID,
  edited_at TIMESTAMP,
  
  -- 质量分数
  quality_score DECIMAL(3, 2),          -- 0-1.0
  
  -- 使用统计
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(resource_id, lang)
);

CREATE INDEX idx_trans_content_lang ON translation_content(lang);
CREATE INDEX idx_trans_content_resource ON translation_content(resource_id);
CREATE INDEX idx_trans_content_score ON translation_content(quality_score);
```

### 4.3 翻译队列表

```sql
-- 翻译任务队列
CREATE TABLE translation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 任务信息
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  
  -- 翻译信息
  original_text TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
  priority INTEGER DEFAULT 0,  -- 数值越大优先级越高
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- 结果
  translated_text TEXT,
  error_message TEXT,
  
  -- 元数据
  project_id VARCHAR(100) NOT NULL,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(resource_type, resource_id, field_name, source_lang, target_lang)
);

CREATE INDEX idx_queue_status ON translation_queue(status, priority);
CREATE INDEX idx_queue_project ON translation_queue(project_id);
CREATE INDEX idx_queue_scheduled ON translation_queue(scheduled_at);
```

---

## 五、使用流程

### 5.1 商品保存时

```
1. 用户保存商品（中文）
        │
        ▼
2. 系统生成翻译资源记录
   - original_text = "椰浆饭"
   - original_lang = "zh-CN"
   - status = "pending"
        │
        ▼
3. 立即翻译用户首选语言（假设是英文）
   - 检查缓存
   - 调用翻译引擎
   - 保存翻译内容
        │
        ▼
4. 其他语言加入队列
   - target: en, ms, id, th, ja, ko, zh-TW
   - priority = 0 (低优先级)
        │
        ▼
5. 后台异步翻译
   - 定时任务处理队列
   - 翻译完成更新状态
```

### 5.2 用户访问时

```
1. 用户访问商品页
        │
        ▼
2. 获取用户语言 (Accept-Language)
        │
        ▼
3. 尝试获取翻译
   - 缓存优先
   - 翻译表次之
   - 原文兜底
        │
        ▼
4. 返回翻译内容
```

---

## 六、API 设计

### 6.1 翻译管理 API

```
POST /translations/translate
  // 触发翻译

GET /translations/{resourceType}/{resourceId}
  // 获取资源的所有翻译

PUT /translations/{id}
  // 更新翻译（人工校对）

POST /translations/batch-sync
  // 批量同步翻译状态
```

### 6.2 翻译队列 API

```
GET /translations/queue/stats
  // 队列统计

POST /translations/queue/process
  // 手动触发队列处理

DELETE /translations/queue/{id}
  // 取消翻译任务
```

---

## 七、成本优化策略

### 7.1 缓存策略

| 层级 | 策略 | TTL |
|------|------|-----|
| 内存 | LRU 缓存 | 进程生命周期 |
| Redis | 热点数据 | 24小时 |
| 数据库 | 翻译结果 | 永不过期 |

### 7.2 预翻译策略

```typescript
// 根据用户分布预翻译
const languagePriority = {
  'en': 1,      // 英文用户最多，第一优先级
  'zh-CN': 2,
  'ms': 3,      // 马来西亚
  'id': 4,      // 印尼
  'th': 5,      // 泰国
  'zh-TW': 6,
  'ja': 7,
  'ko': 8
};
```

### 7.3 成本控制

```typescript
// 预算控制
const MONTHLY_BUDGET = 100; // 美元

// 监控成本
async function monitorCost(projectId: string) {
  const used = await getMonthlyCost(projectId);
  const remaining = MONTHLY_BUDGET - used;
  
  if (remaining < 10) {
    // 触发告警
    await sendAlert(`翻译预算仅剩 $${remaining}`);
    
    // 降级策略：仅保留高优先级语言
    await updateLanguagePriority(projectId, ['en', 'zh-CN']);
  }
}
```

---

## 八、质量保证

### 8.1 多引擎对比

```typescript
class TranslationQualityChecker {
  async checkQuality(
    text: string,
    translations: Record<string, string>
  ): Promise<QualityReport> {
    // 使用多个引擎翻译相同内容
    const results = await Promise.all([
      this.openai.translate(text, targetLang),
      this.deepl.translate(text, targetLang),
      this.google.translate(text, targetLang)
    ]);
    
    // 计算相似度
    const similarity = this.calculateSimilarity(results);
    
    // 选择最佳翻译
    const best = this.selectBestTranslation(results, similarity);
    
    return {
      translations: results,
      similarity,
      recommended: best.engine,
      quality: this.estimateQuality(similarity)
    };
  }
}
```

### 8.2 人工校对流程

```
1. 低质量翻译自动标记
        │
        ▼
2. 加入校对队列
        │
        ▼
3. 管理员收到通知
        │
        ▼
4. 人工校对更新
        │
        ▼
5. 质量分数提升
```

---

## 九、可复用设计

### 9.1 独立 npm 包

```bash
npm install @claude/translation-service
```

### 9.2 配置化使用

```typescript
// 初始化翻译服务
const translationService = new TranslationService({
  engine: 'openai',
  cache: {
    type: 'redis',
    host: 'localhost',
    port: 6379
  },
  queue: {
    type: 'database',
    batchSize: 100,
    interval: 60000 // 1分钟
  },
  languages: ['en', 'zh-CN', 'zh-TW', 'ms', 'id', 'th', 'ja', 'ko'],
  budget: {
    monthlyLimit: 100,
    alertThreshold: 0.1
  }
});
```

### 9.3 框架集成

```typescript
// Cloudflare Workers 集成
export default {
  async fetch(request: Request) {
    const translationService = getTranslationService();
    // ...
  }
};

// Express 集成
const translationRouter = express.Router();
translationRouter.post('/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  const result = await translationService.translate(text, targetLang);
  res.json(result);
});
```

---

## 十、监控与运维

### 10.1 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| 翻译成功率 | 成功数/总数 | < 95% |
| 平均延迟 | 翻译耗时 P95 | > 5秒 |
| 队列积压 | 待翻译任务数 | > 10000 |
| 月度成本 | 翻译花费 | > 预算 80% |
| 缓存命中率 | 命中/请求 | < 70% |

### 10.2 告警配置

```typescript
const alertRules = [
  {
    name: 'high_cost',
    condition: 'cost > monthly_budget * 0.8',
    channel: ['slack', 'email'],
    message: '翻译成本告警'
  },
  {
    name: 'queue_backlog',
    condition: 'pending_tasks > 10000',
    channel: ['slack'],
    message: '翻译队列积压'
  }
];
```

---

## 十一、下一步

- [ ] 抽象翻译引擎接口
- [ ] 实现 OpenAI/Google 适配器
- [ ] 实现缓存层
- [ ] 实现队列处理
- [ ] 编写测试用例
- [ ] 发布 npm 包
