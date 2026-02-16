/**
 * Stalls API - 档口管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppType } from '../types';
import { response } from '../utils/response';

const createStallSchema = z.object({
  food_court_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  name_en: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  cuisine_type: z.string().optional(),
  cuisine_type_en: z.string().optional(),
  logo_url: z.string().url().optional(),
  cover_image_url: z.string().url().optional(),
  contact_phone: z.string().optional(),
  opening_hours: z.string().optional(),
  sort_order: z.number().int().default(0),
});

export const stallRoutes = new Hono<AppType>();

// ==================== List Stalls ====================

stallRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const foodCourtId = c.req.query('food_court_id');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      s.*,
      COUNT(DISTINCT d.id) as dish_count,
      COALESCE(AVG(d.avg_rating), 0) as avg_rating
    FROM stall s
    LEFT JOIN dish d ON s.id = d.stall_id AND d.deleted_at IS NULL
    WHERE s.deleted_at IS NULL AND s.is_active = 1
  `;
  
  const bindings: any[] = [];
  
  if (foodCourtId) {
    query += ` AND s.food_court_id = ?`;
    bindings.push(foodCourtId);
  }
  
  query += ` GROUP BY s.id ORDER BY s.sort_order ASC, s.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const result = await db.prepare(query).bind(...bindings).all();

  return c.json(response(result.results || []));
});

// ==================== Get Stall ====================

stallRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare(`
    SELECT 
      s.*,
      COUNT(DISTINCT d.id) as dish_count,
      COALESCE(AVG(d.avg_rating), 0) as avg_rating
    FROM stall s
    LEFT JOIN dish d ON s.id = d.stall_id AND d.deleted_at IS NULL
    WHERE s.id = ? AND s.deleted_at IS NULL
    GROUP BY s.id
  `).bind(id).first();
  
  if (!result) {
    return c.json(response(null, 40401, 'Stall not found'), 404);
  }
  
  return c.json(response(result));
});

// ==================== Get Stall Dishes ====================

stallRoutes.get('/:id/dishes', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const lang = c.get('lang') || 'en';
  const categoryId = c.req.query('category_id');
  
  let query = `
    SELECT 
      d.*,
      c.name as category_name
    FROM dish d
    LEFT JOIN dish_category c ON d.category_id = c.id
    WHERE d.stall_id = ? AND d.deleted_at IS NULL AND d.status = 'active'
  `;
  
  const bindings: any[] = [id];
  
  if (categoryId) {
    query += ` AND d.category_id = ?`;
    bindings.push(categoryId);
  }
  
  query += ` ORDER BY d.sort_order ASC, d.created_at DESC`;
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  return c.json(response(result.results || []));
});

// ==================== Create Stall ====================

stallRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const validation = createStallSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const result = await db.prepare(`
    INSERT INTO stall (
      food_court_id, name, name_en, description, description_en,
      cuisine_type, cuisine_type_en, logo_url, cover_image_url,
      contact_phone, opening_hours, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.food_court_id,
    data.name,
    data.name_en || null,
    data.description || null,
    data.description_en || null,
    data.cuisine_type || null,
    data.cuisine_type_en || null,
    data.logo_url || null,
    data.cover_image_url || null,
    data.contact_phone || null,
    data.opening_hours || null,
    data.sort_order
  ).run();
  
  return c.json(response({
    id: result.meta.last_row_id,
    ...data,
  }), 201);
});

// ==================== Update Stall ====================

stallRoutes.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const allowedFields = [
    'name', 'name_en', 'description', 'description_en',
    'cuisine_type', 'cuisine_type_en', 'logo_url', 'cover_image_url',
    'contact_phone', 'opening_hours', 'sort_order', 'is_active'
  ];
  
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  });
  
  if (updates.length === 0) {
    return c.json(response(null, 40001, 'No fields to update'), 400);
  }
  
  updates.push('updated_at = datetime("now")');
  values.push(id);
  
  await db.prepare(`
    UPDATE stall SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL
  `).bind(...values).run();
  
  return c.json(response({ success: true }));
});

// ==================== Delete Stall ====================

stallRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  await db.prepare(`
    UPDATE stall SET deleted_at = datetime('now'), is_active = 0
    WHERE id = ? AND deleted_at IS NULL
  `).bind(id).run();
  
  return c.json(response({ success: true }));
});
