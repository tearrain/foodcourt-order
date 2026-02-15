/**
 * Webhooks API
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';

export const webhookRoutes = new Hono<Context<any>>();

// ==================== Payment Webhook ====================

webhookRoutes.post('/payment', async (c) => {
  const body = await c.req.json();
  const signature = c.req.header('X-Payment-Signature');
  
  // TODO: 处理支付回调
  // 1. 验证签名
  // 2. 更新订单状态
  // 3. 发送通知
  
  return c.json(response({ received: true }));
});

// ==================== Translation Webhook ====================

webhookRoutes.post('/translation', async (c) => {
  const body = await c.req.json();
  
  // TODO: 处理翻译回调
  return c.json(response({ received: true }));
});

// ==================== Health Check Webhook ====================

webhookRoutes.get('/health', async (c) => {
  return c.json(response({ status: 'ok' }));
});
