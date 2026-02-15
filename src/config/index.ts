/**
 * 应用配置
 */

import { getEnv } from '../utils/env';

export const config = {
  // 环境
  env: getEnv('ENV', 'development'),
  
  // 应用信息
  app: {
    name: 'Food Court Ordering System',
    version: '0.1.0',
    apiPrefix: '/api/v1',
  },
  
  // 语言配置
  languages: {
    default: getEnv('DEFAULT_LANGUAGE', 'en'),
    supported: ['en', 'zh-CN', 'zh-TW', 'ms', 'id', 'th', 'ja', 'ko'],
    priority: {
      'en': 0,
      'zh-CN': 1,
      'zh-TW': 2,
      'ms': 3,
      'id': 4,
      'th': 5,
      'ja': 6,
      'ko': 7,
    },
  },
  
  // JWT
  jwt: {
    secret: getEnv('JWT_SECRET', 'your-secret-key'),
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  
  // 分账配置
  commission: {
    defaultRate: 10.00,
  },
  
  // 支付配置
  payment: {
    currency: 'MYR',
  },
  
  // 翻译配置
  translation: {
    engine: getEnv('TRANSLATION_ENGINE', 'mock'),
    apiKey: getEnv('OPENAI_API_KEY', ''),
    budget: {
      monthlyLimit: 100,
      alertThreshold: 0.8,
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000,
    },
  },
  
  // 购物车配置
  cart: {
    expiresIn: 24 * 60 * 60 * 1000,
    maxItems: 50,
  },
  
  // 订单配置
  order: {
    autoConfirmTimeout: 5 * 60 * 1000,
    cancelTimeout: 30 * 60 * 1000,
  },
} as const;

export type Config = typeof config;
