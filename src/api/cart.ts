/**
 * Cart API - 购物车管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppType } from '../types';
import { response } from '../utils/response';

// Validation Schemas
const addToCartSchema = z.object({
  food_court_id: z.string().uuid(),
  dish_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  customizations: z.array(z.object({
    group: z.string(),
    option: z.string(),
    price_modifier: z.number().default(0),
  })).default([]),
});

const batchAddToCartSchema = z.object({
  food_court_id: z.string().uuid(),
  items: z.array(z.object({
    dish_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    customizations: z.array(z.object({
      group: z.string(),
      option: z.string(),
      price_modifier: z.number().default(0),
    })).default([]),
  })),
});

export const cartRoutes = new Hono<AppType>();

// ==================== Get Cart ====================

cartRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId');
  const lang = c.get('lang') || 'en';
  
  if (!userId && !sessionId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  // Get cart items
  const result = await db.prepare(`
    SELECT 
      c.*,
      d.name as dish_name,
      d.name_en as dish_name_en,
      d.image_url as dish_image,
      d.price as dish_price,
      d.is_available as dish_available,
      d.is_sold_out as dish_sold_out,
      s.name as stall_name,
      s.id as stall_id
    FROM cart c
    JOIN dish d ON c.dish_id = d.id
    JOIN stall s ON d.stall_id = s.id
    WHERE c.status = 'active'
      AND (c.user_id = ? OR c.session_id = ?)
      AND c.expires_at > datetime('now')
    ORDER BY c.created_at DESC
  `).bind(userId || '', sessionId || '').all();
  
  // Group by stall
  const stalls = new Map();
  let itemCount = 0;
  let subtotal = 0;
  
  for (const item of (result.results || [])) {
    if (!stalls.has(item.stall_id)) {
      stalls.set(item.stall_id, {
        stall_id: item.stall_id,
        stall_name: item.stall_name,
        items: [],
        subtotal: 0,
      });
    }
    
    const stall = stalls.get(item.stall_id);
    const itemSubtotal = (item.dish_price + 
      item.customizations.reduce((sum: number, c: any) => sum + c.price_modifier, 0)) * item.quantity;
    
    stall.items.push({
      id: item.id,
      dish_id: item.dish_id,
      dish_name: lang !== 'zh-CN' && item.dish_name_en ? item.dish_name_en : item.dish_name,
      dish_image: item.dish_image,
      dish_price: item.dish_price,
      dish_available: item.dish_available,
      dish_sold_out: item.dish_sold_out,
      quantity: item.quantity,
      customizations: item.customizations,
      unit_price: item.dish_price,
      subtotal: itemSubtotal,
    });
    
    stall.subtotal += itemSubtotal;
    itemCount += item.quantity;
    subtotal += itemSubtotal;
  }
  
  return c.json(response({
    items: Array.from(stalls.values()),
    item_count: itemCount,
    subtotal,
    total: subtotal, // 暂无优惠
  }));
});

// ==================== Add to Cart ====================

cartRoutes.post('/items', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId') || crypto.randomUUID();
  const lang = c.get('lang') || 'en';
  
  const body = await c.req.json();
  
  const validation = addToCartSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  
  // Check dish availability
  const dish = await db.prepare(`
    SELECT * FROM dish 
    WHERE id = ? AND deleted_at IS NULL
  `).bind(data.dish_id).first();
  
  if (!dish) {
    return c.json(response(null, 40401, 'Dish not found'), 404);
  }
  
  if (!dish.is_available || dish.is_sold_out) {
    return c.json(response(null, 40402, 'Dish sold out or unavailable'), 400);
  }
  
  // Check if item already in cart
  const existing = await db.prepare(`
    SELECT * FROM cart
    WHERE status = 'active'
      AND (user_id = ? OR session_id = ?)
      AND dish_id = ?
      AND customizations = ?
  `).bind(
    userId || '',
    sessionId,
    data.dish_id,
    JSON.stringify(data.customizations)
  ).first();
  
  let result;
  if (existing) {
    // Update quantity
    const newQuantity = existing.quantity + data.quantity;
    
    // Check max per order
    if (newQuantity > dish.max_per_order) {
      return c.json(response(null, 40005, `Maximum ${dish.max_per_order} per order`), 400);
    }
    
    await db.prepare(`
      UPDATE cart 
      SET quantity = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newQuantity, existing.id).run();
    
    result = { id: existing.id, quantity: newQuantity };
  } else {
    // Insert new item
    const price = dish.price + data.customizations.reduce((sum, c) => sum + c.price_modifier, 0);
    
    result = await db.prepare(`
      INSERT INTO cart (
        user_id, session_id, food_court_id, dish_id, quantity,
        customizations, dish_snapshot, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))
    `).bind(
      userId || null,
      sessionId,
      data.food_court_id,
      data.dish_id,
      data.quantity,
      JSON.stringify(data.customizations),
      JSON.stringify({
        name: lang !== 'zh-CN' && dish.name_en ? dish.name_en : dish.name,
        price: dish.price,
        image_url: dish.image_url,
      })
    ).run();
    
    result = { id: result.meta.last_row_id, quantity: data.quantity };
  }
  
  return c.json(response(result), 201);
});

// ==================== Batch Add to Cart ====================

cartRoutes.post('/batch', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId') || crypto.randomUUID();
  const lang = c.get('lang') || 'en';
  
  const body = await c.req.json();
  
  const validation = batchAddToCartSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const { food_court_id, items } = validation.data;
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (const item of items) {
    try {
      // Check dish
      const dish = await db.prepare(`
        SELECT * FROM dish WHERE id = ? AND deleted_at IS NULL
      `).bind(item.dish_id).first();
      
      if (!dish || !dish.is_available || dish.is_sold_out) {
        errors.push({ dish_id: item.dish_id, error: 'Unavailable' });
        continue;
      }
      
      const price = dish.price + item.customizations.reduce((sum, c) => sum + c.price_modifier, 0);
      
      // Insert
      const result = await db.prepare(`
        INSERT INTO cart (
          user_id, session_id, food_court_id, dish_id, quantity,
          customizations, dish_snapshot, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))
      `).bind(
        userId || null,
        sessionId,
        food_court_id,
        item.dish_id,
        item.quantity,
        JSON.stringify(item.customizations),
        JSON.stringify({
          name: lang !== 'zh-CN' && dish.name_en ? dish.name_en : dish.name,
          price: dish.price,
          image_url: dish.image_url,
        })
      ).run();
      
      results.push({ dish_id: item.dish_id, id: result.meta.last_row_id });
    } catch (error) {
      errors.push({ dish_id: item.dish_id, error: 'Failed to add' });
    }
  }
  
  return c.json(response({
    added: results,
    errors: errors.length > 0 ? errors : undefined,
    total_added: results.length,
  }), errors.length === 0 ? 201 : 207);
});

// ==================== Update Cart Item ====================

cartRoutes.patch('/items/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { quantity } = body;
  
  if (!quantity || quantity < 1) {
    return c.json(response(null, 40001, 'Invalid quantity'), 400);
  }
  
  // Check ownership
  const cart = await db.prepare(`
    SELECT * FROM cart
    WHERE id = ? AND status = 'active'
      AND (user_id = ? OR session_id = ?)
  `).bind(id, userId || '', sessionId || '').first();
  
  if (!cart) {
    return c.json(response(null, 40401, 'Cart item not found'), 404);
  }
  
  // Check max limit
  const dish = await db.prepare(`
    SELECT max_per_order FROM dish WHERE id = ?
  `).bind(cart.dish_id).first();
  
  if (quantity > (dish?.max_per_order || 99)) {
    return c.json(response(null, 40005, `Maximum ${dish?.max_per_order || 99} per order`), 400);
  }
  
  await db.prepare(`
    UPDATE cart SET quantity = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(quantity, id).run();
  
  return c.json(response({ success: true }));
});

// ==================== Delete Cart Item ====================

cartRoutes.delete('/items/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId');
  const id = c.req.param('id');
  
  await db.prepare(`
    UPDATE cart SET status = 'deleted', updated_at = datetime('now')
    WHERE id = ? AND status = 'active'
      AND (user_id = ? OR session_id = ?)
  `).bind(id, userId || '', sessionId || '').run();
  
  return c.json(response({ success: true }));
});

// ==================== Clear Cart ====================

cartRoutes.delete('/', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId');
  
  await db.prepare(`
    UPDATE cart SET status = 'deleted', updated_at = datetime('now')
    WHERE status = 'active'
      AND (user_id = ? OR session_id = ?)
  `).bind(userId || '', sessionId || '').run();
  
  return c.json(response({ success: true }));
});
