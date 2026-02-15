/**
 * Dishes API - 菜品管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from '../types';
import { response } from '../utils/response';
import { TranslationService } from '../services/translation';

// Validation Schemas
const createDishSchema = z.object({
  stall_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  name_en: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  category_id: z.string().uuid().optional(),
  price: z.number().positive(),
  original_price: z.number().positive().optional(),
  cost_price: z.number().positive().optional(),
  image_url: z.string().url().optional(),
  unit: z.string().default('份'),
  portion_size: z.string().optional(),
  has_inventory: z.boolean().default(false),
  total_stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).default(10),
  is_spicy: z.boolean().default(false),
  spicy_level: z.number().min(1).max(5).optional(),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  allergens: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  dietary_tags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  is_recommended: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
});

const updateDishSchema = createDishSchema.partial();

const batchStockSchema = z.object({
  dishes: z.array(z.object({
    dish_id: z.string().uuid(),
    quantity: z.number().int(),
  })),
});

export const dishRoutes = new Hono<Context<any>>();

// ==================== List Dishes ====================

dishRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const lang = c.get('lang') || 'en';
  
  // Query params
  const stallId = c.req.query('stall_id');
  const category = c.req.query('category');
  const available = c.req.query('available') === 'true';
  const recommended = c.req.query('recommended') === 'true';
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      d.*,
      s.name as stall_name,
      c.name as category_name
    FROM dish d
    LEFT JOIN stall s ON d.stall_id = s.id
    LEFT JOIN dish_category c ON d.category_id = c.id
    WHERE d.deleted_at IS NULL
  `;
  
  const bindings: any[] = [];
  
  if (stallId) {
    query += ` AND d.stall_id = ?`;
    bindings.push(stallId);
  }
  
  if (category) {
    query += ` AND d.category_id = ?`;
    bindings.push(category);
  }
  
  if (available) {
    query += ` AND d.is_available = 1 AND d.is_sold_out = 0`;
  }
  
  if (recommended) {
    query += ` AND d.is_recommended = 1`;
  }
  
  query += ` ORDER BY d.sort_order ASC, d.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  // Get total count
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM dish d
    WHERE d.deleted_at IS NULL
    ${stallId ? 'AND d.stall_id = ?' : ''}
  `).bind(stallId || '').first();
  
  // Translate dish names based on language
  const translatedResults = await Promise.all(
    result.results.map(async (dish: any) => {
      if (lang !== 'zh-CN' && dish.name_en) {
        return { ...dish, display_name: dish.name_en };
      }
      return { ...dish, display_name: dish.name };
    })
  );
  
  return c.json(response({
    data: translatedResults,
    meta: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
      hasNext: page * limit < (countResult?.total || 0),
      hasPrev: page > 1,
    },
  }));
});

// ==================== Get Dish ====================

dishRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const lang = c.get('lang') || 'en';
  const id = c.req.param('id');
  
  const result = await db.prepare(`
    SELECT 
      d.*,
      s.name as stall_name,
      c.name as category_name
    FROM dish d
    LEFT JOIN stall s ON d.stall_id = s.id
    LEFT JOIN dish_category c ON d.category_id = c.id
    WHERE d.id = ? AND d.deleted_at IS NULL
  `).bind(id).first();
  
  if (!result) {
    return c.json(response(null, 40401, 'Dish not found'), 404);
  }
  
  // Translate based on language
  const displayName = lang !== 'zh-CN' && result.name_en ? result.name_en : result.name;
  const displayDescription = lang !== 'zh-CN' && result.description_en ? result.description_en : result.description;
  
  return c.json(response({
    ...result,
    display_name: displayName,
    display_description: displayDescription,
  }));
});

// ==================== Get Recommended Dishes ====================

dishRoutes.get('/recommended', async (c) => {
  const db = c.env.DB;
  const lang = c.get('lang') || 'en';
  const foodCourtId = c.req.query('food_court_id');
  const limit = parseInt(c.req.query('limit') || '10');
  
  let query = `
    SELECT 
      d.*,
      s.name as stall_name,
      COUNT(DISTINCT oi.id) as recent_orders
    FROM dish d
    LEFT JOIN stall s ON d.stall_id = s.id
    LEFT JOIN order_item oi ON d.id = oi.dish_id
    LEFT JOIN user_order uo ON oi.order_id = uo.id
    WHERE d.deleted_at IS NULL 
      AND d.status = 'active'
      AND d.is_available = 1
      AND d.is_recommended = 1
      AND d.is_sold_out = 0
  `;
  
  const bindings: any[] = [];
  
  if (foodCourtId) {
    query += ` AND s.food_court_id = ?`;
    bindings.push(foodCourtId);
  }
  
  query += `
    GROUP BY d.id
    ORDER BY d.avg_rating DESC, recent_orders DESC, d.total_sold DESC
    LIMIT ?
  `;
  bindings.push(limit);
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  return c.json(response(result));
});

// ==================== Search Dishes ====================

dishRoutes.get('/search', async (c) => {
  const db = c.env.DB;
  const lang = c.get('lang') || 'en';
  const q = c.req.query('q');
  const foodCourtId = c.req.query('food_court_id');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  if (!q || q.length < 2) {
    return c.json(response({
      data: [],
      meta: { page, limit, total: 0 },
    }));
  }
  
  let query = `
    SELECT 
      d.*,
      s.name as stall_name,
      MATCH(d.name, d.name_en, d.description, d.description_en) AGAINST(? IN BOOLEAN MODE) as relevance
    FROM dish d
    LEFT JOIN stall s ON d.stall_id = s.id
    WHERE d.deleted_at IS NULL 
      AND d.status = 'active'
      AND d.is_available = 1
      AND (
        d.name LIKE ? OR d.name_en LIKE ? OR d.description LIKE ?
        OR d.description_en LIKE ?
      )
  `;
  
  const searchTerm = `%${q}%`;
  const bindings = [q, searchTerm, searchTerm, searchTerm, searchTerm];
  
  if (foodCourtId) {
    query += ` AND s.food_court_id = ?`;
    bindings.push(foodCourtId);
  }
  
  query += ` ORDER BY relevance DESC, d.avg_rating DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  return c.json(response({
    data: result.results,
    meta: { page, limit, total: result.results?.length || 0 },
  }));
});

// ==================== Create Dish ====================

dishRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const lang = c.get('lang') || 'en';
  const body = await c.req.json();
  
  // Validate
  const validation = createDishSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  
  // Insert
  const result = await db.prepare(`
    INSERT INTO dish (
      stall_id, name, name_en, description, description_en,
      category_id, price, original_price, cost_price,
      image_url, unit, portion_size,
      has_inventory, total_stock, remaining_stock, low_stock_threshold,
      is_spicy, spicy_level, is_vegetarian, is_vegan,
      allergens, ingredients, dietary_tags,
      tags, is_recommended, sort_order, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.stall_id,
    data.name,
    data.name_en || null,
    data.description || null,
    data.description_en || null,
    data.category_id || null,
    data.price,
    data.original_price || null,
    data.cost_price || null,
    data.image_url || null,
    data.unit,
    data.portion_size || null,
    data.has_inventory,
    data.total_stock || null,
    data.total_stock || null,
    data.low_stock_threshold,
    data.is_spicy,
    data.spicy_level || null,
    data.is_vegetarian,
    data.is_vegan,
    JSON.stringify(data.allergens || []),
    JSON.stringify(data.ingredients || []),
    JSON.stringify(data.dietary_tags || []),
    JSON.stringify(data.tags || []),
    data.is_recommended ? 1 : 0,
    data.sort_order,
    data.status
  ).run();
  
  const dishId = result.meta.last_row_id;
  
  return c.json(response({
    id: dishId,
    ...data,
  }), 201);
});

// ==================== Update Dish ====================

dishRoutes.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const validation = updateDishSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  
  const updates: string[] = [];
  const values: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      if (['allergens', 'ingredients', 'dietary_tags', 'tags'].includes(key)) {
        updates.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
  });
  
  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")');
    values.push(id);
    
    await db.prepare(`
      UPDATE dish SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL
    `).bind(...values).run();
  }
  
  return c.json(response({ success: true }));
});

// ==================== Update Dish Stock ====================

dishRoutes.post('/:id/stock', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { action, quantity, reason } = body; // action: 'restock', 'adjust', 'set'
  
  let query = `SELECT * FROM dish WHERE id = ? AND deleted_at IS NULL`;
  const dish = await db.prepare(query).bind(id).first();
  
  if (!dish) {
    return c.json(response(null, 40401, 'Dish not found'), 404);
  }
  
  let newStock = dish.remaining_stock || 0;
  
  switch (action) {
    case 'restock':
      newStock += quantity;
      break;
    case 'adjust':
      newStock += quantity; // quantity can be negative
      break;
    case 'set':
      newStock = quantity;
      break;
    default:
      return c.json(response(null, 40001, 'Invalid action'), 400);
  }
  
  // Update stock
  await db.prepare(`
    UPDATE dish 
    SET remaining_stock = ?, 
        total_stock = COALESCE(total_stock, 0) + ?,
        is_sold_out = CASE WHEN ? <= 0 THEN 1 ELSE 0 END,
        last_restock_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(newStock, quantity, newStock, id).run();
  
  // Log inventory change
  await db.prepare(`
    INSERT INTO dish_inventory_log (
      dish_id, log_type, change_quantity, previous_stock, new_stock, note
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    action === 'restock' ? 'restock' : 'adjust',
    quantity,
    dish.remaining_stock || 0,
    newStock,
    reason || null
  ).run();
  
  return c.json(response({
    success: true,
    previous_stock: dish.remaining_stock || 0,
    new_stock: newStock,
  }));
});

// ==================== Delete Dish ====================

dishRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  await db.prepare(`
    UPDATE dish SET deleted_at = datetime('now'), status = 'inactive'
    WHERE id = ? AND deleted_at IS NULL
  `).bind(id).run();
  
  return c.json(response({ success: true }));
});
