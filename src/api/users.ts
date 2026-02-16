/**
 * Users API - 用户管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppType } from '../types';
import { response } from '../utils/response';
import { generateUUID } from '../utils/db';

// Validation Schemas
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const createAddressSchema = z.object({
  label: z.string().min(1).max(50),
  receiver_name: z.string().min(1).max(100),
  receiver_phone: z.string().min(1).max(20),
  address: z.string().min(1).max(500),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  is_default: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

export const userRoutes = new Hono<AppType>();

// ==================== Get Current User ====================

userRoutes.get('/me', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId');
  
  if (!userId && !sessionId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  let query = 'SELECT * FROM user WHERE 1=1';
  const bindings: any[] = [];
  
  if (userId) {
    query += ' AND id = ?';
    bindings.push(userId);
  } else if (sessionId) {
    query += ' AND guest_session_id = ?';
    bindings.push(sessionId);
  }
  
  const user = await db.prepare(query).bind(...bindings).first();
  
  if (!user) {
    return c.json(response(null, 40401, 'User not found'), 404);
  }
  
  return c.json(response({
    id: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    membership_level: user.membership_level,
    membership_points: user.membership_points,
    total_orders: user.total_orders,
    total_spent: user.total_spent,
    created_at: user.created_at,
  }));
});

// ==================== Update Current User ====================

userRoutes.patch('/me', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const body = await c.req.json();
  const validation = updateUserSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const updates: string[] = [];
  const values: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")');
    values.push(userId);
    
    await db.prepare(`
      UPDATE user SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();
  }
  
  return c.json(response({ success: true }));
});

// ==================== Get User Addresses ====================

userRoutes.get('/me/addresses', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const addresses = await db.prepare(`
    SELECT * FROM user_address
    WHERE user_id = ? AND deleted_at IS NULL
    ORDER BY is_default DESC, created_at DESC
  `).bind(userId).all();
  
  return c.json(response(addresses.results || []));
});

// ==================== Add Address ====================

userRoutes.post('/me/addresses', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const body = await c.req.json();
  const validation = createAddressSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const addressId = generateUUID();
  
  // If setting as default, clear other defaults
  if (data.is_default) {
    await db.prepare(`
      UPDATE user_address SET is_default = 0, updated_at = datetime('now')
      WHERE user_id = ?
    `).bind(userId).run();
  }
  
  await db.prepare(`
    INSERT INTO user_address (
      id, user_id, label, receiver_name, receiver_phone,
      address, city, district, postal_code,
      is_default, latitude, longitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    addressId,
    userId,
    data.label,
    data.receiver_name,
    data.receiver_phone,
    data.address,
    data.city || null,
    data.district || null,
    data.postal_code || null,
    data.is_default ? 1 : 0,
    data.latitude || null,
    data.longitude || null
  ).run();
  
  return c.json(response({
    id: addressId,
    ...data,
  }), 201);
});

// ==================== Update Address ====================

userRoutes.patch('/me/addresses/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const addressId = c.req.param('id');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const body = await c.req.json();
  const validation = updateAddressSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  
  // Check address exists
  const address = await db.prepare(`
    SELECT * FROM user_address
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(addressId, userId).first();
  
  if (!address) {
    return c.json(response(null, 40401, 'Address not found'), 404);
  }
  
  // If setting as default, clear other defaults
  if (data.is_default) {
    await db.prepare(`
      UPDATE user_address SET is_default = 0, updated_at = datetime('now')
      WHERE user_id = ? AND id != ?
    `).bind(userId, addressId).run();
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(key === 'is_default' ? (value ? 1 : 0) : value);
    }
  });
  
  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")');
    values.push(addressId);
    
    await db.prepare(`
      UPDATE user_address SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();
  }
  
  return c.json(response({ success: true }));
});

// ==================== Delete Address ====================

userRoutes.delete('/me/addresses/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const addressId = c.req.param('id');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  await db.prepare(`
    UPDATE user_address SET deleted_at = datetime('now'), is_default = 0
    WHERE id = ? AND user_id = ?
  `).bind(addressId, userId).run();
  
  return c.json(response({ success: true }));
});

// ==================== Get User Coupons ====================

userRoutes.get('/me/coupons', async (c) => {
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
      p.description as promotion_description,
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

// ==================== Get User Orders ====================

userRoutes.get('/me/orders', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  let query = `SELECT * FROM user_order WHERE user_id = ?`;
  const bindings: any[] = [userId];
  
  if (status) {
    query += ` AND status = ?`;
    bindings.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const orders = await db.prepare(query).bind(...bindings).all();
  
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM user_order WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json(response({
    data: orders.results || [],
    meta: {
      page,
      limit,
      total: countResult?.total || 0,
      hasNext: page * limit < (countResult?.total || 0),
    },
  }));
});

// ==================== Get User Statistics ====================

userRoutes.get('/me/stats', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const stats = await db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent,
      COALESCE(SUM(membership_points), 0) as total_points
    FROM user_order
    WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json(response({
    total_orders: stats?.total_orders || 0,
    completed_orders: stats?.completed_orders || 0,
    total_spent: stats?.total_spent || 0,
    total_points: stats?.total_points || 0,
  }));
});
