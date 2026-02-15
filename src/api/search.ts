/**
 * Search API
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';

export const searchRoutes = new Hono<Context<any>>();

// ==================== Global Search ====================

searchRoutes.get('/', async (c) => {
  const q = c.req.query('q');
  const type = c.req.query('type');
  const foodCourtId = c.req.query('food_court_id');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  
  // TODO: 实现全局搜索
  return c.json(response({
    data: {
      dishes: [],
      stalls: [],
      food_courts: [],
    },
    meta: { page, limit, total: 0 },
  }));
});

// ==================== Search Suggestions ====================

searchRoutes.get('/suggestions', async (c) => {
  const q = c.req.query('q');
  const limit = parseInt(c.req.query('limit') || '10');
  
  // TODO: 返回搜索建议
  return c.json(response([]));
});
