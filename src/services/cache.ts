/**
 * Cache Service
 */

import { KVNamespace } from '@cloudflare/workers-types';

export class CacheService {
  private cache: KVNamespace;
  private defaultTTL: number;

  constructor(cache: KVNamespace, defaultTTL: number = 3600) {
    this.cache = cache;
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.cache.put(key, serialized, {
      expirationTtl: ttl || this.defaultTTL,
    });
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    // Cloudflare KV doesn't support delete by pattern
    // This is a placeholder
    console.warn('deletePattern not supported in Cloudflare KV');
  }

  // 购物车缓存
  async getCart(userId: string, cartId: string): Promise<any | null> {
    const key = `cart:${userId}:${cartId}`;
    return this.get(key);
  }

  async setCart(userId: string, cartId: string, data: any): Promise<void> {
    const key = `cart:${userId}:${cartId}`;
    // 购物车 24 小时过期
    await this.set(key, data, 24 * 60 * 60);
  }

  // 菜品缓存
  async getDish(dishId: string): Promise<any | null> {
    return this.get(`dish:${dishId}`);
  }

  async setDish(dishId: string, data: any): Promise<void> {
    // 菜品信息 1 小时过期
    await this.set(`dish:${dishId}`, data, 60 * 60);
  }

  // 翻译缓存
  async getTranslation(key: string): Promise<string | null> {
    return this.cache.get(`trans:${key}`);
  }

  async setTranslation(key: string, value: string, ttl?: number): Promise<void> {
    // 翻译 24 小时过期
    await this.cache.put(`trans:${key}`, value, {
      expirationTtl: ttl || 24 * 60 * 60,
    });
  }

  // 会话缓存
  async getSession(sessionId: string): Promise<any | null> {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId: string, data: any): Promise<void> {
    // 会话 7 天过期
    await this.set(`session:${sessionId}`, data, 7 * 24 * 60 * 60);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  }
}
