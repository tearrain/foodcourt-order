/**
 * Users API
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';

export const userRoutes = new Hono<Context<any>>();

// ==================== Get Current User ====================

userRoutes.get('/me', async (c) => {
  // TODO: 获取当前用户
  return c.json(response(null));
});

// ==================== Update Current User ====================

userRoutes.patch('/me', async (c) => {
  // TODO: 更新用户
  return c.json(response({}));
});

// ==================== Get Addresses ====================

userRoutes.get('/me/addresses', async (c) => {
  // TODO: 获取地址列表
  return c.json(response([]));
});

// ==================== Add Address ====================

userRoutes.post('/me/addresses', async (c) => {
  // TODO: 添加地址
  return c.json(response({}), 201);
});

// ==================== Get Coupons ====================

userRoutes.get('/me/coupons', async (c) => {
  // TODO: 获取优惠券
  return c.json(response([]));
});

// ==================== Get Orders ====================

userRoutes.get('/me/orders', async (c) => {
  // TODO: 获取订单历史
  return c.json(response([]));
});
