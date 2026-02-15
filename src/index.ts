/**
 * Food Court Ordering System API
 * Cloudflare Workers Entry Point
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// API Routes
import { foodCourtRoutes } from './api/food-courts';
import { stallRoutes } from './api/stalls';
import { dishRoutes } from './api/dishes';
import { cartRoutes } from './api/cart';
import { orderRoutes } from './api/orders';
import { userRoutes } from './api/users';
import { reviewRoutes } from './api/reviews';
import { promotionRoutes } from './api/promotions';
import { i18nRoutes } from './api/i18n';
import { searchRoutes } from './api/search';
import { webhookRoutes } from './api/webhooks';

// Config
import { config } from './config';

// Types
import { Env } from './types';

const app = new Hono<{ env: Env }>();

// ==================== CORS Configuration ====================

const getCorsOrigin = (): string[] => {
  // 生产环境允许的域名
  if (config.env === 'production') {
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      // 用户可以添加自己的前端域名
    ];
  }
  // 开发环境允许所有
  return ['*'];
};

// ==================== Middleware ====================

// CORS
app.use('/*', cors({
  origin: getCorsOrigin(),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  credentials: true,
}));

// Logger
app.use('/*', logger());

// Language Detection
app.use('/*', async (c, next) => {
  const lang = c.req.header('Accept-Language')?.split(',')[0] || config.languages.default;
  c.set('lang', lang);
  await next();
});

// ==================== Health Check ====================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ==================== API Routes ====================

app.route('/api/v1/food-courts', foodCourtRoutes);
app.route('/api/v1/stalls', stallRoutes);
app.route('/api/v1/dishes', dishRoutes);
app.route('/api/v1/cart', cartRoutes);
app.route('/api/v1/orders', orderRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1/reviews', reviewRoutes);
app.route('/api/v1/promotions', promotionRoutes);
app.route('/api/v1/i18n', i18nRoutes);
app.route('/api/v1/search', searchRoutes);
app.route('/api/v1/webhooks', webhookRoutes);

// ==================== Error Handler ====================

app.onError((err, c) => {
  console.error('Error:', err.message);
  return c.json({
    code: 50001,
    message: err.message || 'Internal Server Error',
  }, 500);
});

// ==================== 404 Handler ====================

app.notFound((c) => {
  return c.json({
    code: 40401,
    message: 'Resource not found',
  }, 404);
});

// ==================== Export ====================

export default {
  fetch: app.fetch,
};
