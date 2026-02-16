/**
 * Webhooks API - 支付和其他回调
 */

import { Hono } from 'hono';
import { Context } from '../types';
import { response } from '../utils/response';
import { generateUUID } from '../utils/db';

export const webhookRoutes = new Hono<Context<any>>();

// ==================== Payment Webhook ====================

webhookRoutes.post('/payment', async (c) => {
  const db = c.env.DB;
  const body = await c.req.text();
  const signature = c.req.header('X-Payment-Signature');
  const provider = c.req.header('X-Payment-Provider') || 'unknown';
  
  console.log(`[Webhook] Received payment webhook from ${provider}`);
  console.log(`[Webhook] Signature: ${signature}`);
  console.log(`[Webhook] Body: ${body.substring(0, 500)}`);
  
  try {
    const payload = JSON.parse(body);
    
    // Extract payment info based on provider
    let orderId: string | null = null;
    let paymentId: string | null = null;
    let status: string = 'unknown';
    let transactionId: string | null = null;
    
    if (provider === 'stripe') {
      // Stripe webhook payload
      paymentId = payload.data?.object?.id || payload.id;
      orderId = payload.data?.object?.metadata?.order_id || payload.data?.object?.metadata?.orderId;
      status = payload.type === 'checkout.session.completed' ? 'paid' : 
               payload.type === 'payment_intent.payment_failed' ? 'failed' : 'processing';
      transactionId = payload.data?.object?.payment_intent;
    } else if (provider === 'grabpay') {
      // GrabPay webhook
      paymentId = payload.paymentID;
      orderId = payload.merchantReferenceID;
      status = payload.status === 'SUCCESS' ? 'paid' : 
               payload.status === 'FAILED' ? 'failed' : 'processing';
      transactionId = payload.externalPaymentID;
    } else if (provider === 'mock') {
      // Mock webhook (for testing)
      paymentId = payload.paymentId || payload.payment_id;
      orderId = payload.orderId || payload.order_id;
      status = payload.status || 'paid';
      transactionId = payload.transactionId || payload.transaction_id;
    } else {
      // Generic webhook format
      paymentId = payload.paymentId || payload.payment_id;
      orderId = payload.orderId || payload.order_id;
      status = payload.status || 'processing';
      transactionId = payload.transactionId || payload.transaction_id;
    }
    
    if (!orderId) {
      console.error('[Webhook] Missing order ID');
      return c.json(response({ error: 'Missing order ID' }), 400);
    }
    
    // Find order
    const order = await db.prepare(`
      SELECT * FROM user_order WHERE id = ? OR order_no = ?
    `).bind(orderId, orderId).first();
    
    if (!order) {
      console.error(`[Webhook] Order not found: ${orderId}`);
      return c.json(response({ error: 'Order not found' }), 404);
    }
    
    // Update order based on payment status
    if (status === 'paid') {
      await db.prepare(`
        UPDATE user_order SET
          payment_status = 'paid',
          status = 'confirmed',
          transaction_id = ?,
          paid_amount = total_amount,
          paid_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(transactionId, order.id).run();
      
      // Update order items status
      await db.prepare(`
        UPDATE order_item SET status = 'confirmed', updated_at = datetime('now')
        WHERE order_id = ?
      `).bind(order.id).run();
      
      console.log(`[Webhook] Order ${order.order_no} marked as paid`);
      
    } else if (status === 'failed') {
      await db.prepare(`
        UPDATE user_order SET
          payment_status = 'failed',
          status = 'cancelled',
          cancel_reason = 'Payment failed',
          cancelled_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(order.id).run();
      
      // Restore inventory
      const items = await db.prepare(`
        SELECT * FROM order_item WHERE order_id = ?
      `).bind(order.id).all();
      
      for (const item of (items.results || [])) {
        if (item.dish_id) {
          await db.prepare(`
            UPDATE dish SET
              remaining_stock = COALESCE(remaining_stock, 0) + ?,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(item.quantity, item.dish_id).run();
        }
      }
      
      console.log(`[Webhook] Order ${order.order_no} payment failed, inventory restored`);
    }
    
    // Record payment webhook log
    await db.prepare(`
      INSERT INTO webhook_log (
        id, webhook_type, provider, payload, order_id, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      generateUUID(),
      'payment',
      provider,
      body.substring(0, 2000),
      order.id,
      status
    ).run();
    
    return c.json(response({ received: true }));
    
  } catch (error: any) {
    console.error('[Webhook] Error processing payment webhook:', error);
    
    // Log failed webhook
    await db.prepare(`
      INSERT INTO webhook_log (
        id, webhook_type, provider, payload, status, error_message
      ) VALUES (?, ?, ?, ?, 'failed', ?)
    `).bind(
      generateUUID(),
      'payment',
      provider,
      body.substring(0, 2000),
      error.message
    ).run();
    
    return c.json(response({ error: error.message }), 500);
  }
});

// ==================== Payment Webhook (Stripe) ====================

webhookRoutes.post('/payment/stripe', async (c) => {
  const db = c.env.DB;
  const body = await c.req.text();
  const signature = c.req.header('Stripe-Signature');
  
  console.log(`[Stripe Webhook] Received`);
  
  try {
    // In production, verify signature:
    // const event = stripe.webhooks.constructEvent(
    //   body, signature, env.STRIPE_WEBHOOK_SECRET
    // );
    
    const payload = JSON.parse(body);
    const eventType = payload.type;
    
    if (eventType === 'checkout.session.completed') {
      const session = payload.data.object;
      const orderId = session.metadata?.order_id;
      
      if (orderId) {
        await db.prepare(`
          UPDATE user_order SET
            payment_status = 'paid',
            status = 'confirmed',
            transaction_id = ?,
            paid_amount = total_amount,
            paid_at = datetime('now'),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(session.payment_intent, orderId).run();
        
        console.log(`[Stripe Webhook] Order ${orderId} paid`);
      }
    }
    
    // Log webhook
    await db.prepare(`
      INSERT INTO webhook_log (id, webhook_type, provider, payload, status)
      VALUES (?, 'payment', 'stripe', ?, 'received')
    `).bind(generateUUID(), body.substring(0, 2000)).run();
    
    return c.json(response({ received: true }));
    
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return c.json(response({ error: error.message }), 500);
  }
});

// ==================== Payment Webhook (GrabPay) ====================

webhookRoutes.post('/payment/grabpay', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  console.log(`[GrabPay Webhook] Received:`, body);
  
  try {
    const { paymentID, merchantReferenceID, status, externalPaymentID } = body;
    
    if (status === 'SUCCESS') {
      await db.prepare(`
        UPDATE user_order SET
          payment_status = 'paid',
          status = 'confirmed',
          transaction_id = ?,
          paid_amount = total_amount,
          paid_at = datetime('now'),
          updated_at = datetime('now')
        WHERE order_no = ?
      `).bind(externalPaymentID, merchantReferenceID).run();
      
      console.log(`[GrabPay Webhook] Order ${merchantReferenceID} paid`);
    }
    
    return c.json(response({ received: true }));
    
  } catch (error: any) {
    console.error('[GrabPay Webhook] Error:', error);
    return c.json(response({ error: error.message }), 500);
  }
});

// ==================== Translation Webhook ====================

webhookRoutes.post('/translation', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  console.log(`[Translation Webhook] Received`);
  
  try {
    const { translationId, status, result, error } = body;
    
    if (translationId) {
      await db.prepare(`
        UPDATE translation_request SET
          status = ?,
          result = ?,
          completed_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        status === 'completed' ? 'completed' : 'failed',
        result ? JSON.stringify(result) : null,
        translationId
      ).run();
    }
    
    return c.json(response({ received: true }));
    
  } catch (error: any) {
    console.error('[Translation Webhook] Error:', error);
    return c.json(response({ error: error.message }), 500);
  }
});

// ==================== Health Check Webhook ====================

webhookRoutes.get('/health', async (c) => {
  return c.json(response({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'webhooks',
  }));
});

// ==================== Webhook Logs (Admin) ====================

webhookRoutes.get('/logs', async (c) => {
  const db = c.env.DB;
  const provider = c.req.query('provider');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM webhook_log WHERE 1=1`;
  const bindings: any[] = [];
  
  if (provider) {
    query += ` AND provider = ?`;
    bindings.push(provider);
  }
  
  if (status) {
    query += ` AND status = ?`;
    bindings.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);
  
  const logs = await db.prepare(query).bind(...bindings).all();
  
  return c.json(response({
    data: logs.results || [],
    meta: { page, limit },
  }));
});

// ==================== Retry Webhook (Admin) ====================

webhookRoutes.post('/logs/:id/retry', async (c) => {
  const db = c.env.DB;
  const logId = c.req.param('id');
  
  const log = await db.prepare(`
    SELECT * FROM webhook_log WHERE id = ?
  `).bind(logId).first();
  
  if (!log) {
    return c.json(response(null, 40401, 'Webhook log not found'), 404);
  }
  
  // Re-process the webhook (simplified - in production, would call appropriate handler)
  console.log(`[Retry Webhook] Re-processing log ${logId}`);
  
  await db.prepare(`
    UPDATE webhook_log SET
      retry_count = COALESCE(retry_count, 0) + 1,
      last_retry_at = datetime('now'),
      status = 'retrying'
    WHERE id = ?
  `).bind(logId).run();
  
  return c.json(response({ success: true }));
});
