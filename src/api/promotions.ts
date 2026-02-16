/**
 * Promotions API - 促销管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppType } from '../types';
import { response } from '../utils/response';
import { generateUUID } from '../utils/db';

// Validation Schemas
const createPromotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  promotion_type: z.enum(['discount', 'coupon', 'flash_sale', 'bundle', 'first_order', 'loyalty']),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive(),
  min_order_amount: z.number().min(0).optional(),
  max_discount_amount: z.number().positive().optional(),
  usage_limit_per_user: z.number().int().min(0).optional(),
  total_usage_limit: z.number().int().min(0).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  applicable_stalls: z.array(z.string().uuid()).optional(),
  applicable_dishes: z.array(z.string().uuid()).optional(),
  code: z.string().optional(),
});

const updatePromotionSchema = createPromotionSchema.partial();

const redeemCouponSchema = z.object({
  code: z.string().min(4).max(20),
  order_id: z.string().uuid().optional(),
});

export const promotionRoutes = new Hono<AppType>();

// ==================== Get Available Promotions ====================

promotionRoutes.get('/available', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const foodCourtId = c.req.query('food_court_id');
  
  let query = `
    SELECT 
      p.*,
      COALESCE(pu.usage_count, 0) as user_usage_count
    FROM promotion p
    LEFT JOIN promotion_usage pu ON p.id = pu.promotion_id AND pu.user_id = ?
    WHERE p.status = 'active'
      AND datetime(p.start_time) <= datetime('now')
      AND datetime(p.end_time) >= datetime('now')
  `;
  const bindings: any[] = [userId || ''];
  
  if (foodCourtId) {
    query += ` AND (p.food_court_id IS NULL OR p.food_court_id = ?)`;
    bindings.push(foodCourtId);
  }
  
  query += ` ORDER BY p.created_at DESC`;
  
  const promotions = await db.prepare(query).bind(...bindings).all();
  
  const availablePromotions = (promotions.results || []).filter((p: any) => {
    // Check user usage limit
    if (p.user_usage_count >= (p.usage_limit_per_user || Infinity)) {
      return false;
    }
    // Check total usage limit
    if (p.total_usage_limit && (p.usage_count || 0) >= p.total_usage_limit) {
      return false;
    }
    return true;
  });
  
  return c.json(response(availablePromotions));
});

// ==================== Get Promotions List (Admin) ====================

promotionRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status');
  const type = c.req.query('type');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM promotion WHERE 1=1`;
  const bindings: any[] = [];
  
  if (status) {
    query += ` AND status = ?`;
    bindings.push(status);
  }
  
  if (type) {
    query += ` AND promotion_type = ?`;
    bindings.push(type);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const promotions = await db.prepare(query).bind(...bindings).all();
  
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM promotion WHERE 1=1
    ${status ? 'AND status = ?' : ''}
    ${type ? 'AND promotion_type = ?' : ''}
  `).bind(...bindings.slice(0, -2)).first();
  
  return c.json(response({
    data: promotions.results || [],
    meta: {
      page,
      limit,
      total: countResult?.total || 0,
      hasNext: page * limit < (countResult?.total || 0),
    },
  }));
});

// ==================== Get Promotion Details ====================

promotionRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const promotion = await db.prepare(`
    SELECT * FROM promotion WHERE id = ?
  `).bind(id).first();
  
  if (!promotion) {
    return c.json(response(null, 40401, 'Promotion not found'), 404);
  }
  
  return c.json(response(promotion));
});

// ==================== Create Promotion (Admin) ====================

promotionRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  
  // Check admin permission
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return c.json(response(null, 40301, 'Permission denied'), 403);
  }
  
  const body = await c.req.json();
  const validation = createPromotionSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const promotionId = generateUUID();
  
  await db.prepare(`
    INSERT INTO promotion (
      id, name, description, promotion_type,
      discount_type, discount_value,
      min_order_amount, max_discount_amount,
      usage_limit_per_user, total_usage_limit,
      start_time, end_time,
      applicable_stalls, applicable_dishes,
      code, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `).bind(
    promotionId,
    data.name,
    data.description || null,
    data.promotion_type,
    data.discount_type,
    data.discount_value,
    data.min_order_amount || null,
    data.max_discount_amount || null,
    data.usage_limit_per_user || null,
    data.total_usage_limit || null,
    data.start_time,
    data.end_time,
    data.applicable_stalls ? JSON.stringify(data.applicable_stalls) : null,
    data.applicable_dishes ? JSON.stringify(data.applicable_dishes) : null,
    data.code || null,
    userId
  ).run();
  
  return c.json(response({
    id: promotionId,
    ...data,
  }), 201);
});

// ==================== Update Promotion (Admin) ====================

promotionRoutes.patch('/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const id = c.req.param('id');
  
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return c.json(response(null, 40301, 'Permission denied'), 403);
  }
  
  const body = await c.req.json();
  const validation = updatePromotionSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const updates: string[] = [];
  const values: any[] = [];
  
  const fieldMapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    promotion_type: 'promotion_type',
    discount_type: 'discount_type',
    discount_value: 'discount_value',
    min_order_amount: 'min_order_amount',
    max_discount_amount: 'max_discount_amount',
    usage_limit_per_user: 'usage_limit_per_user',
    total_usage_limit: 'total_usage_limit',
    start_time: 'start_time',
    end_time: 'end_time',
    code: 'code',
  };
  
  Object.entries(data).forEach(([key, value]) => {
    const dbKey = fieldMapping[key];
    if (dbKey) {
      if (['applicable_stalls', 'applicable_dishes'].includes(key)) {
        updates.push(`${dbKey} = ?`);
        values.push(value ? JSON.stringify(value) : null);
      } else {
        updates.push(`${dbKey} = ?`);
        values.push(value);
      }
    }
  });
  
  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")');
    values.push(id);
    
    await db.prepare(`
      UPDATE promotion SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();
  }
  
  return c.json(response({ success: true }));
});

// ==================== Pause/Resume Promotion (Admin) ====================

promotionRoutes.post('/:id/status', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const id = c.req.param('id');
  
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return c.json(response(null, 40301, 'Permission denied'), 403);
  }
  
  const body = await c.req.json();
  const { status } = body; // 'active' or 'paused'
  
  if (!['active', 'paused'].includes(status)) {
    return c.json(response(null, 40001, 'Invalid status'), 400);
  }
  
  await db.prepare(`
    UPDATE promotion SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, id).run();
  
  return c.json(response({ success: true }));
});

// ==================== Delete Promotion (Admin) ====================

promotionRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const id = c.req.param('id');
  
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return c.json(response(null, 40301, 'Permission denied'), 403);
  }
  
  await db.prepare(`
    UPDATE promotion SET deleted_at = datetime('now'), status = 'draft'
    WHERE id = ?
  `).bind(id).run();
  
  return c.json(response({ success: true }));
});

// ==================== Redeem Coupon ====================

promotionRoutes.post('/redeem', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const body = await c.req.json();
  const validation = redeemCouponSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const { code } = validation.data;
  
  // Find promotion by code
  const promotion = await db.prepare(`
    SELECT * FROM promotion
    WHERE code = ? AND status = 'active'
      AND datetime(start_time) <= datetime('now')
      AND datetime(end_time) >= datetime('now')
  `).bind(code.toUpperCase()).first();
  
  if (!promotion) {
    return c.json(response(null, 40401, 'Invalid or expired coupon'), 404);
  }
  
  // Check if user already has this coupon
  const existingCoupon = await db.prepare(`
    SELECT * FROM user_coupon
    WHERE user_id = ? AND promotion_id = ?
  `).bind(userId, promotion.id).first();
  
  if (existingCoupon && promotion.promotion_type !== 'coupon') {
    // For coupon type, user can have multiple; for others, only one
    return c.json(response(null, 40005, 'You already have this coupon'), 400);
  }
  
  // Check usage limits
  const usageCount = await db.prepare(`
    SELECT COUNT(*) as count FROM promotion_usage
    WHERE promotion_id = ? AND user_id = ?
  `).bind(promotion.id, userId).first();
  
  if (promotion.usage_limit_per_user && (usageCount?.count || 0) >= promotion.usage_limit_per_user) {
    return c.json(response(null, 40005, 'Usage limit reached'), 400);
  }
  
  const totalUsage = await db.prepare(`
    SELECT COUNT(*) as count FROM promotion_usage
    WHERE promotion_id = ?
  `).bind(promotion.id).first();
  
  if (promotion.total_usage_limit && (totalUsage?.count || 0) >= promotion.total_usage_limit) {
    return c.json(response(null, 40005, 'Coupon fully redeemed'), 400);
  }
  
  // Create user coupon
  const userCouponId = generateUUID();
  const expiresAt = new Date(promotion.end_time);
  
  await db.prepare(`
    INSERT INTO user_coupon (
      id, user_id, promotion_id, code,
      status, expires_at, received_at
    ) VALUES (?, ?, ?, ?, 'available', ?, datetime('now'))
  `).bind(
    userCouponId,
    userId,
    promotion.id,
    code.toUpperCase(),
    expiresAt.toISOString()
  ).run();
  
  return c.json(response({
    coupon_id: userCouponId,
    promotion_name: promotion.name,
    discount_type: promotion.discount_type,
    discount_value: promotion.discount_value,
    expires_at: promotion.end_time,
  }), 201);
});

// ==================== Get User Coupons ====================

promotionRoutes.get('/my-coupons', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const status = c.req.query('status'); // available, used, expired
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  let query = `
    SELECT 
      uc.*,
      p.name as promotion_name,
      p.description,
      p.discount_type,
      p.discount_value,
      p.min_order_amount,
      p.max_discount_amount,
      p.start_time,
      p.end_time
    FROM user_coupon uc
    JOIN promotion p ON uc.promotion_id = p.id
    WHERE uc.user_id = ?
  `;
  const bindings: any[] = [userId];
  
  if (status === 'available') {
    query += ` AND uc.status = 'available' AND p.end_time > datetime('now')`;
  } else if (status === 'used') {
    query += ` AND uc.status = 'used'`;
  } else if (status === 'expired') {
    query += ` AND (uc.status = 'expired' OR p.end_time <= datetime('now'))`;
  }
  
  query += ` ORDER BY uc.created_at DESC`;
  
  const coupons = await db.prepare(query).bind(...bindings).all();
  
  return c.json(response(coupons.results || []));
});

// ==================== Validate Coupon for Order ====================

promotionRoutes.post('/validate', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const body = await c.req.json();
  const { code, order_amount } = body;
  
  const promotion = await db.prepare(`
    SELECT * FROM promotion
    WHERE code = ? AND status = 'active'
      AND datetime(start_time) <= datetime('now')
      AND datetime(end_time) >= datetime('now')
  `).bind(code.toUpperCase()).first();
  
  if (!promotion) {
    return c.json(response(null, 40401, 'Invalid or expired coupon'), 404);
  }
  
  // Check minimum order amount
  if (promotion.min_order_amount && order_amount < promotion.min_order_amount) {
    return c.json(response(null, 40005, `Minimum order amount: ${promotion.min_order_amount}`), 400);
  }
  
  // Calculate discount
  let discount = 0;
  if (promotion.discount_type === 'percentage') {
    discount = order_amount * (promotion.discount_value / 100);
    if (promotion.max_discount_amount) {
      discount = Math.min(discount, promotion.max_discount_amount);
    }
  } else {
    discount = Math.min(promotion.discount_value, order_amount);
  }
  
  return c.json(response({
    valid: true,
    discount: Math.round(discount * 100) / 100,
    promotion: {
      id: promotion.id,
      name: promotion.name,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
    },
  }));
});
