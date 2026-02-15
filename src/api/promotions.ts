/**
 * Promotions API
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';

export const promotionRoutes = new Hono<Context<any>>();

// ==================== Get Available Promotions ====================

promotionRoutes.get('/available', async (c) => {
  // TODO: 获取可用优惠
  return c.json(response([]));
});

// ==================== Redeem Coupon ====================

promotionRoutes.post('/redeem', async (c) => {
  // TODO: 兑换优惠券
  return c.json(response({}));
});

// ==================== Get Promotions List ====================

promotionRoutes.get('/', async (c) => {
  // TODO: 获取营销活动列表（管理端）
  return c.json(response([]));
});

// ==================== Create Promotion ====================

promotionRoutes.post('/', async (c) => {
  // TODO: 创建营销活动（管理端）
  return c.json(response({}), 201);
});
