/**
 * Payment API - 支付接口
 */

import { Hono } from 'hono';
import { response } from '../utils/response';
import { AppType } from '../types';
import { z } from 'zod';
import { PaymentService, PaymentProvider } from '../services/payment';

const paymentRoutes = new Hono<AppType>();

// 创建支付
const createPaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('SGD'),
  provider: z.enum(['stripe', 'grabpay', 'wechat', 'alipay', 'mock']).default('mock'),
});

paymentRoutes.post('/create', async (c) => {
  const body = await c.req.json();
  const validation = createPaymentSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json(response(null, 40001, 'Invalid request'), 400);
  }

  const { orderId, amount, currency, provider } = validation.data;
  
  // 验证订单存在
  const order = await c.env.DB.prepare(`
    SELECT id, total_amount, payment_status 
    FROM user_order 
    WHERE id = ? AND status != 'cancelled'
  `).bind(orderId).first();

  if (!order) {
    return c.json(response(null, 40401, 'Order not found'), 404);
  }

  if (order.payment_status === 'paid') {
    return c.json(response(null, 40002, 'Order already paid'), 400);
  }

  // 创建支付
  const paymentService = new PaymentService(c.env);
  const result = await paymentService.createPayment({
    orderId,
    amount: order.total_amount || amount,
    currency,
    provider: provider as PaymentProvider,
  });

  if (!result.success) {
    return c.json(response(null, 50001, result.error || 'Payment failed'), 500);
  }

  return c.json(response({
    paymentId: result.paymentId,
    checkoutUrl: result.checkoutUrl,
    provider,
  }));
});

// 查询支付状态
paymentRoutes.get('/status/:paymentId', async (c) => {
  const paymentId = c.req.param('paymentId');
  const provider = (c.req.query('provider') || 'mock') as PaymentProvider;

  const paymentService = new PaymentService(c.env);
  const status = await paymentService.getPaymentStatus(paymentId, provider);

  return c.json(response({ paymentId, status }));
});

// Webhook 回调
paymentRoutes.post('/webhook/:provider', async (c) => {
  const provider = c.req.param('provider') as PaymentProvider;
  const body = await c.req.json();

  try {
    const paymentService = new PaymentService(c.env);
    const webhook = await paymentService.handleWebhook(provider, body);

    // 更新订单状态
    if (webhook.status === 'paid' && webhook.orderId) {
      await c.env.DB.prepare(`
        UPDATE user_order 
        SET payment_status = 'paid',
            status = 'confirmed',
            paid_amount = (SELECT total_amount FROM user_order WHERE id = ?),
            transaction_id = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(webhook.orderId, webhook.transactionId, webhook.orderId).run();
    }

    return c.json(response({ received: true }));
  } catch (error: any) {
    console.error('Webhook error:', error);
    return c.json(response(null, 50001, error.message), 500);
  }
});

// 模拟支付（测试用）
paymentRoutes.post('/mock/pay/:paymentId', async (c) => {
  const paymentId = c.req.param('paymentId');
  
  // 直接标记为已支付
  const paymentService = new PaymentService(c.env);
  const webhook = await paymentService.handleWebhook('mock', {
    paymentId,
    status: 'paid',
    orderId: paymentId.split('_')[1] || 'unknown',
  });

  return c.json(response({
    success: true,
    paymentId,
    status: 'paid',
  }));
});

export { paymentRoutes };
