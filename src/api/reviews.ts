/**
 * Reviews API
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';

export const reviewRoutes = new Hono<Context<any>>();

// ==================== Submit Review ====================

reviewRoutes.post('/orders/:id/review', async (c) => {
  // TODO: 提交评价
  return c.json(response({}), 201);
});

// ==================== Get Stall Reviews ====================

reviewRoutes.get('/stalls/:id/reviews', async (c) => {
  // TODO: 获取档口评价
  return c.json(response([]));
});

// ==================== Get Dish Reviews ====================

reviewRoutes.get('/dishes/:id/reviews', async (c) => {
  // TODO: 获取菜品评价
  return c.json(response([]));
});
