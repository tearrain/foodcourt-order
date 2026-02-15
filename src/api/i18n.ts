/**
 * i18n API
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';

export const i18nRoutes = new Hono<Context<any>>();

// ==================== Get Translations ====================

i18nRoutes.get('/:langCode', async (c) => {
  const langCode = c.req.param('langCode');
  
  // TODO: 从数据库获取翻译
  return c.json(response({
    lang: langCode,
    translations: {},
  }));
});

// ==================== Get Resource Translations ====================

i18nRoutes.get('/:langCode/:resourceType/:resourceId', async (c) => {
  const { langCode, resourceType, resourceId } = c.req.param();
  
  // TODO: 获取特定资源翻译
  return c.json(response(null));
});

// ==================== Update Translation ====================

i18nRoutes.put('/:langCode/:resourceType/:resourceId', async (c) => {
  const body = await c.req.json();
  
  // TODO: 更新翻译
  return c.json(response({}));
});

// ==================== Sync Translations ====================

i18nRoutes.post('/sync', async (c) => {
  // TODO: 同步翻译
  return c.json(response({}));
});
