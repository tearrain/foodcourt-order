/**
 * Orders API - 订单管理
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from '../types';
import { response } from '../utils/response';
import { generateUUID } from '../utils/db';

// Validation Schemas
const createOrderSchema = z.object({
  food_court_id: z.string().uuid(),
  order_type: z.enum(['dine_in', 'takeout', 'delivery']).default('dine_in'),
  table_number: z.string().optional(),
  cart_id: z.string().uuid().optional(),
  items: z.array(z.object({
    dish_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    customizations: z.array(z.object({
      group: z.string(),
      option: z.string(),
      price_modifier: z.number().default(0),
    })).default([]),
  })).optional(),
  coupon_code: z.string().optional(),
  user_remark: z.string().optional(),
  delivery_address_id: z.string().uuid().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(1),
});

export const orderRoutes = new Hono<Context<any>>();

// ==================== List Orders ====================

orderRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  if (!userId) {
    return c.json(response(null, 40101, 'Not authenticated'), 401);
  }
  
  let query = `
    SELECT * FROM user_order
    WHERE user_id = ?
  `;
  const bindings: any[] = [userId];
  
  if (status) {
    query += ` AND status = ?`;
    bindings.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const result = await db.prepare(query).bind(...bindings).all();

  return c.json(response(result.results || []));
});

// ==================== Get Order ====================

orderRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const order = await db.prepare(`
    SELECT * FROM user_order WHERE id = ? AND (user_id = ? OR ? = 'admin')
  `).bind(id, userId, userId).first();
  
  if (!order) {
    return c.json(response(null, 40401, 'Order not found'), 404);
  }
  
  // Get order items
  const items = await db.prepare(`
    SELECT * FROM order_item WHERE order_id = ?
  `).bind(id).all();
  
  return c.json(response({
    ...order,
    items: items.results,
  }));
});

// ==================== Create Order ====================

orderRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const sessionId = c.get('sessionId');
  const lang = c.get('lang') || 'en';
  
  const body = await c.req.json();
  
  const validation = createOrderSchema.safeParse(body);
  if (!validation.success) {
    return c.json(response(null, 40001, 'Validation error', {
      errors: validation.error.errors,
    }), 400);
  }
  
  const data = validation.data;
  const orderId = generateUUID();
  const orderNo = `FOOD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now() % 100000).padStart(5, '0')}`;
  
  // Validate items and calculate totals
  let itemCount = 0;
  let subtotal = 0;
  const orderItems: any[] = [];
  
  const itemsToProcess = data.items || [];
  
  for (const item of itemsToProcess) {
    const dish = await db.prepare(`
      SELECT d.*, s.name as stall_name
      FROM dish d
      JOIN stall s ON d.stall_id = s.id
      WHERE d.id = ? AND d.deleted_at IS NULL
    `).bind(item.dish_id).first();
    
    if (!dish) {
      return c.json(response(null, 40401, `Dish not found: ${item.dish_id}`), 404);
    }
    
    if (!dish.is_available || dish.is_sold_out) {
      return c.json(response(null, 40402, `Dish sold out: ${dish.name}`), 400);
    }
    
    const unitPrice = dish.price + item.customizations.reduce((sum, c) => sum + c.price_modifier, 0);
    const itemSubtotal = unitPrice * item.quantity;
    
    itemCount += item.quantity;
    subtotal += itemSubtotal;
    
    orderItems.push({
      dish_id: item.dish_id,
      dish_snapshot: JSON.stringify({
        name: lang !== 'zh-CN' && dish.name_en ? dish.name_en : dish.name,
        image_url: dish.image_url,
        price: dish.price,
      }),
      stall_id: dish.stall_id,
      stall_name: dish.stall_name,
      quantity: item.quantity,
      unit_price: unitPrice,
      original_price: dish.price,
      subtotal_amount: itemSubtotal,
      customization_details: JSON.stringify(item.customizations),
      status: 'pending',
    });
    
    // Update dish sold count
    await db.prepare(`
      UPDATE dish SET total_sold = COALESCE(total_sold, 0) + ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(item.quantity, item.dish_id).run();
  }
  
  // Calculate totals
  const taxRate = 0.06; // 6% tax
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  
  // Create order
  await db.prepare(`
    INSERT INTO user_order (
      id, order_no, user_id, guest_session_id, food_court_id,
      order_type, table_number,
      item_count, subtotal_amount, tax_amount, total_amount,
      payment_status, status, user_remark,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, datetime('now'))
  `).bind(
    orderId,
    orderNo,
    userId || null,
    sessionId || null,
    data.food_court_id,
    data.order_type,
    data.table_number || null,
    itemCount,
    subtotal,
    taxAmount,
    totalAmount,
    data.user_remark || null
  ).run();
  
  // Create order items
  for (const item of orderItems) {
    await db.prepare(`
      INSERT INTO order_item (
        order_id, dish_id, dish_snapshot, stall_id, stall_name,
        quantity, unit_price, original_price, subtotal_amount,
        customization_details, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      orderId,
      item.dish_id,
      item.dish_snapshot,
      item.stall_id,
      item.stall_name,
      item.quantity,
      item.unit_price,
      item.original_price,
      item.subtotal_amount,
      item.customization_details
    ).run();
  }
  
  // Clear cart if using cart
  if (data.cart_id) {
    await db.prepare(`
      UPDATE cart SET status = 'ordered', updated_at = datetime('now')
      WHERE id = ?
    `).bind(data.cart_id).run();
  }
  
  return c.json(response({
    order_id: orderId,
    order_no: orderNo,
    total_amount: totalAmount,
    item_count: itemCount,
  }), 201);
});

// ==================== Cancel Order ====================

orderRoutes.post('/:id/cancel', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const body = await c.req.json();
  const { reason } = body;
  
  const order = await db.prepare(`
    SELECT * FROM user_order 
    WHERE id = ? AND (user_id = ? OR ? = 'admin')
  `).bind(id, userId, userId).first();
  
  if (!order) {
    return c.json(response(null, 40401, 'Order not found'), 404);
  }
  
  if (!['pending', 'paid'].includes(order.status)) {
    return c.json(response(null, 40005, 'Order cannot be cancelled'), 400);
  }
  
  // Restore inventory
  const items = await db.prepare(`
    SELECT * FROM order_item WHERE order_id = ?
  `).bind(id).all();
  
  for (const item of (items.results || [])) {
    if (item.dish_id) {
      await db.prepare(`
        UPDATE dish 
        SET remaining_stock = COALESCE(remaining_stock, 0) + ?,
            total_sold = COALESCE(total_sold, 0) - ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(item.quantity, item.quantity, item.dish_id).run();
    }
  }
  
  // Update order status
  await db.prepare(`
    UPDATE user_order 
    SET status = 'cancelled',
        cancel_reason = ?,
        cancelled_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(reason, id).run();
  
  // Update order items
  await db.prepare(`
    UPDATE order_item SET status = 'cancelled', cancelled_at = datetime('now')
    WHERE order_id = ?
  `).bind(id).run();
  
  return c.json(response({ success: true }));
});

// ==================== Complete Order ====================

orderRoutes.post('/:id/complete', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  await db.prepare(`
    UPDATE user_order 
    SET status = 'completed',
        completed_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ? AND status = 'ready'
  `).bind(id).run();
  
  return c.json(response({ success: true }));
});

// ==================== Create Payment ====================

orderRoutes.post('/:id/payment', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { payment_method, payment_channel } = body;
  
  const order = await db.prepare(`
    SELECT * FROM user_order 
    WHERE id = ? AND user_id = ?
  `).bind(id, userId).first();
  
  if (!order) {
    return c.json(response(null, 40401, 'Order not found'), 404);
  }
  
  if (order.payment_status !== 'pending') {
    return c.json(response(null, 40005, 'Order already paid'), 400);
  }
  
  // In real implementation, this would call payment gateway
  // For now, we'll create a mock payment URL
  
  const paymentUrl = `https://payment.example.com/pay/${order.order_no}`;
  
  return c.json(response({
    order_id: id,
    order_no: order.order_no,
    amount: order.total_amount,
    payment_url: paymentUrl,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
  }));
});

// ==================== Apply Refund ====================

orderRoutes.post('/:id/refund', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { reason, refund_amount } = body;
  
  const order = await db.prepare(`
    SELECT * FROM user_order 
    WHERE id = ? AND (user_id = ? OR ? = 'admin')
  `).bind(id, userId, userId).first();
  
  if (!order) {
    return c.json(response(null, 40401, 'Order not found'), 404);
  }
  
  // Calculate refund amount
  const refund = refund_amount || order.total_amount;
  
  await db.prepare(`
    UPDATE user_order 
    SET status = 'refunded',
        refund_amount = ?,
        refund_reason = ?,
        refund_time = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(refund, reason, id).run();
  
  return c.json(response({
    success: true,
    refund_amount: refund,
  }));
});
