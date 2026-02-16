/**
 * Reviews API - 评价管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppType } from '../types';
import { response } from '../utils/response';
import { generateUUID } from '../utils/db';

// Validation Schemas
const createReviewSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  food_rating: z.number().min(1).max(5).optional(),
  content: z.string().min(10).max(2000),
  content_images: z.array(z.string().url()).max(9).optional(),
});

const queryReviewsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  rating: z.number().min(1).max(5).optional(),
});

export const reviewRoutes = new Hono<AppType>();

// ==================== Submit Review ====================

reviewRoutes.post('/orders/:id/review', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const orderId = c.req.param('id');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  // Check order exists and belongs to user
  const order = await db.prepare(`
    SELECT * FROM user_order
    WHERE id = ? AND user_id = ?
  `).bind(orderId, userId).first();
  
  if (!order) {
    return c.json(response(null, 40401, 'Order not found'), 404);
  }
  
  // Check if order is completed
  if (order.status !== 'completed') {
    return c.json(response(null, 40005, 'Can only review completed orders'), 400);
  }
  
  // Check if already reviewed
  const existingReview = await db.prepare(`
    SELECT * FROM review
    WHERE order_id = ? AND user_id = ?
  `).bind(orderId, userId).first();
  
  if (existingReview) {
    return c.json(response(null, 40005, 'Order already reviewed'), 400);
  }
  
  const body = await c.req.json();
  const validation = createReviewSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const reviewId = generateUUID();
  
  // Get order items to determine stall and dish
  const orderItems = await db.prepare(`
    SELECT * FROM order_item WHERE order_id = ?
  `).bind(orderId).all();
  
  const firstItem = orderItems.results?.[0];
  
  // Create review
  await db.prepare(`
    INSERT INTO review (
      id, order_id, user_id, stall_id, dish_id,
      overall_rating, food_rating, content, content_images,
      status, moderation_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'pending', datetime('now'))
  `).bind(
    reviewId,
    orderId,
    userId,
    firstItem?.stall_id || null,
    firstItem?.dish_id || null,
    data.overall_rating,
    data.food_rating || null,
    data.content,
    JSON.stringify(data.content_images || [])
  ).run();
  
  // Update order has_review flag
  await db.prepare(`
    UPDATE user_order SET has_review = 1, updated_at = datetime('now')
    WHERE id = ?
  `).bind(orderId).run();
  
  // Update stall rating
  if (firstItem?.stall_id) {
    await db.prepare(`
      UPDATE stall SET
        total_reviews = COALESCE(total_reviews, 0) + 1,
        avg_rating = (
          SELECT AVG(overall_rating) FROM review
          WHERE stall_id = ? AND status = 'active'
        ),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(firstItem.stall_id, firstItem.stall_id).run();
  }
  
  return c.json(response({
    id: reviewId,
    order_id: orderId,
    overall_rating: data.overall_rating,
    content: data.content,
  }), 201);
});

// ==================== Get Stall Reviews ====================

reviewRoutes.get('/stalls/:id/reviews', async (c) => {
  const db = c.env.DB;
  const stallId = c.req.param('id');
  const lang = c.get('lang') || 'en';
  
  const query = queryReviewsSchema.safeParse(c.req.query());
  if (!query.success) {
    return c.json(response(null, 40001, 'Invalid query params'), 400);
  }
  
  const { page, limit, rating } = query.data;
  const offset = (page - 1) * limit;
  
  let reviewQuery = `
    SELECT 
      r.*,
      u.name as user_name,
      u.avatar_url as user_avatar
    FROM review r
    LEFT JOIN user u ON r.user_id = u.id
    WHERE r.stall_id = ? AND r.status = 'active'
  `;
  const bindings: any[] = [stallId];
  
  if (rating) {
    reviewQuery += ` AND r.overall_rating = ?`;
    bindings.push(rating);
  }
  
  reviewQuery += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const reviews = await db.prepare(reviewQuery).bind(...bindings).all();
  
  // Get rating distribution
  const distribution = await db.prepare(`
    SELECT overall_rating, COUNT(*) as count
    FROM review
    WHERE stall_id = ? AND status = 'active'
    GROUP BY overall_rating
  `).bind(stallId).all();
  
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM review
    WHERE stall_id = ? AND status = 'active'
  `).bind(stallId).first();
  
  // Get average ratings
  const avgRatings = await db.prepare(`
    SELECT
      AVG(overall_rating) as avg_overall,
      AVG(food_rating) as avg_food,
      COUNT(*) as total
    FROM review
    WHERE stall_id = ? AND status = 'active'
  `).bind(stallId).first();
  
  return c.json(response({
    data: reviews.results || [],
    meta: {
      page,
      limit,
      total: countResult?.total || 0,
      hasNext: page * limit < (countResult?.total || 0),
    },
    stats: {
      average_rating: avgRatings?.avg_overall || 0,
      average_food_rating: avgRatings?.avg_food || 0,
      total_reviews: avgRatings?.total || 0,
      distribution: distribution.results || [],
    },
  }));
});

// ==================== Get Dish Reviews ====================

reviewRoutes.get('/dishes/:id/reviews', async (c) => {
  const db = c.env.DB;
  const dishId = c.req.param('id');
  
  const query = queryReviewsSchema.safeParse(c.req.query());
  if (!query.success) {
    return c.json(response(null, 40001, 'Invalid query params'), 400);
  }
  
  const { page, limit, rating } = query.data;
  const offset = (page - 1) * limit;
  
  let reviewQuery = `
    SELECT 
      r.*,
      u.name as user_name,
      u.avatar_url as user_avatar
    FROM review r
    LEFT JOIN user u ON r.user_id = u.id
    WHERE r.dish_id = ? AND r.status = 'active'
  `;
  const bindings: any[] = [dishId];
  
  if (rating) {
    reviewQuery += ` AND r.overall_rating = ?`;
    bindings.push(rating);
  }
  
  reviewQuery += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const reviews = await db.prepare(reviewQuery).bind(...bindings).all();
  
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM review
    WHERE dish_id = ? AND status = 'active'
  `).bind(dishId).first();
  
  const avgRating = await db.prepare(`
    SELECT AVG(overall_rating) as avg, COUNT(*) as total
    FROM review
    WHERE dish_id = ? AND status = 'active'
  `).bind(dishId).first();
  
  return c.json(response({
    data: reviews.results || [],
    meta: {
      page,
      limit,
      total: countResult?.total || 0,
      hasNext: page * limit < (countResult?.total || 0),
    },
    stats: {
      average_rating: avgRating?.avg || 0,
      total_reviews: avgRating?.total || 0,
    },
  }));
});

// ==================== Get Order Review ====================

reviewRoutes.get('/orders/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const orderId = c.req.param('id');
  
  const review = await db.prepare(`
    SELECT * FROM review WHERE order_id = ?
  `).bind(orderId).first();
  
  if (!review) {
    return c.json(response(null, 40401, 'Review not found'), 404);
  }
  
  return c.json(response(review));
});

// ==================== Update Review (User) ====================

reviewRoutes.patch('/orders/:id/review', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const orderId = c.req.param('id');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const review = await db.prepare(`
    SELECT * FROM review WHERE order_id = ? AND user_id = ?
  `).bind(orderId, userId).first();
  
  if (!review) {
    return c.json(response(null, 40401, 'Review not found'), 404);
  }
  
  // Check if review is still pending moderation or recently submitted (within 24h)
  const createdAt = new Date(review.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  if (review.moderation_status === 'approved' || hoursSinceCreation > 24) {
    return c.json(response(null, 40005, 'Cannot update review after approval or 24h'), 400);
  }
  
  const body = await c.req.json();
  const validation = createReviewSchema.partial().safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.overall_rating) {
    updates.push('overall_rating = ?');
    values.push(data.overall_rating);
  }
  
  if (data.food_rating !== undefined) {
    updates.push('food_rating = ?');
    values.push(data.food_rating);
  }
  
  if (data.content) {
    updates.push('content = ?');
    values.push(data.content);
  }
  
  if (data.content_images) {
    updates.push('content_images = ?');
    values.push(JSON.stringify(data.content_images));
  }
  
  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")');
    values.push(orderId);
    
    await db.prepare(`
      UPDATE review SET ${updates.join(', ')} WHERE order_id = ?
    `).bind(...values).run();
  }
  
  return c.json(response({ success: true }));
});

// ==================== Delete Review ====================

reviewRoutes.delete('/orders/:id/review', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const orderId = c.req.param('id');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const review = await db.prepare(`
    SELECT * FROM review WHERE order_id = ? AND user_id = ?
  `).bind(orderId, userId).first();
  
  if (!review) {
    return c.json(response(null, 40401, 'Review not found'), 404);
  }
  
  // Soft delete
  await db.prepare(`
    UPDATE review SET deleted_at = datetime('now'), status = 'hidden'
    WHERE id = ?
  `).bind(review.id).run();
  
  return c.json(response({ success: true }));
});

// ==================== Report Review ====================

reviewRoutes.post('/orders/:id/review/report', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const orderId = c.req.param('id');
  
  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  const body = await c.req.json();
  const { reason } = body;
  
  const review = await db.prepare(`
    SELECT * FROM review WHERE order_id = ?
  `).bind(orderId).first();
  
  if (!review) {
    return c.json(response(null, 40401, 'Review not found'), 404);
  }
  
  await db.prepare(`
    INSERT INTO review_report (
      id, review_id, reporter_id, reason, status
    ) VALUES (?, ?, ?, ?, 'pending')
  `).bind(
    generateUUID(),
    review.id,
    userId,
    reason || 'Inappropriate content'
  ).run();
  
  return c.json(response({ success: true }));
});
