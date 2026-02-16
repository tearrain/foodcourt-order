/**
 * Food Courts API
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppType } from '../types';
import { DB } from '../utils/db';
import { response } from '../utils/response';

// Validation Schemas
const createFoodCourtSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  logo_url: z.string().url().optional(),
  contact_phone: z.string().optional(),
  currency: z.string().length(3).default('MYR'),
  tax_rate: z.number().min(0).max(100).default(6.00),
  platform_commission_rate: z.number().min(0).max(100).default(10.00),
});

const updateFoodCourtSchema = createFoodCourtSchema.partial();

export const foodCourtRoutes = new Hono<AppType>();

// ==================== List Food Courts ====================

foodCourtRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const lang = c.get('lang') || 'en';
  
  // Pagination
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  // Location filter
  const lat = parseFloat(c.req.query('lat') || '0');
  const lng = parseFloat(c.req.query('lng') || '0');
  const radius = 50; // km
  
  // Query
  let query = `
    SELECT 
      fc.*,
      COUNT(DISTINCT s.id) as stall_count,
      COALESCE(AVG(s.avg_rating), 0) as avg_rating
    FROM food_court fc
    LEFT JOIN stall s ON s.food_court_id = fc.id AND s.deleted_at IS NULL
    WHERE fc.deleted_at IS NULL AND fc.status = 'active'
  `;
  
  const bindings: any[] = [];
  
  // Location filter (approximate bounding box for SQLite)
  if (lat && lng) {
    const latDelta = radius / 111.0;
    const lngDelta = radius / (111.0 * Math.cos(lat * Math.PI / 180));
    query += `
      AND (
        fc.latitude IS NULL
        OR (
          fc.latitude BETWEEN ? AND ?
          AND fc.longitude BETWEEN ? AND ?
        )
      )
    `;
    bindings.push(lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta);
  }
  
  query += ` GROUP BY fc.id ORDER BY fc.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const result = await db.prepare(query).bind(...bindings).all();

  return c.json(response(result.results || []));
});

// ==================== Get Food Court ====================

foodCourtRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const lang = c.get('lang') || 'en';
  
  const result = await db.prepare(`
    SELECT 
      fc.*,
      COUNT(DISTINCT s.id) as stall_count,
      COALESCE(AVG(s.avg_rating), 0) as avg_rating
    FROM food_court fc
    LEFT JOIN stall s ON s.food_court_id = fc.id AND s.deleted_at IS NULL
    WHERE fc.id = ? AND fc.deleted_at IS NULL
    GROUP BY fc.id
  `).bind(id).first();
  
  if (!result) {
    return c.json(response(null, 40401, 'Food court not found'), 404);
  }
  
  return c.json(response(result));
});

// ==================== Create Food Court ====================

foodCourtRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Validate
  const validation = createFoodCourtSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  
  // Insert
  const result = await db.prepare(`
    INSERT INTO food_court (
      name, description, address, city, latitude, longitude,
      logo_url, contact_phone, currency, tax_rate, platform_commission_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.name,
    data.description || null,
    data.address || null,
    data.city || null,
    data.latitude || null,
    data.longitude || null,
    data.logo_url || null,
    data.contact_phone || null,
    data.currency,
    data.tax_rate,
    data.platform_commission_rate
  ).run();
  
  return c.json(response({
    id: result.meta.last_row_id,
    ...data,
  }), 201);
});

// ==================== Update Food Court ====================

foodCourtRoutes.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  // Validate
  const validation = updateFoodCourtSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  
  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updates.length === 0) {
    return c.json(response(null, 40001, 'No fields to update'), 400);
  }
  
  updates.push('updated_at = datetime("now")');
  values.push(id);
  
  await db.prepare(`
    UPDATE food_court SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL
  `).bind(...values).run();
  
  return c.json(response({ success: true }));
});

// ==================== Delete Food Court ====================

foodCourtRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  await db.prepare(`
    UPDATE food_court SET deleted_at = datetime("now"), status = 'inactive'
    WHERE id = ? AND deleted_at IS NULL
  `).bind(id).run();
  
  return c.json(response({ success: true }));
});
