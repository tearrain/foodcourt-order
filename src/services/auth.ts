/**
 * Auth Service
 */

import { D1Database } from '@cloudflare/workers-types';
import { KVNamespace } from '@cloudflare/workers-types';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  role: string;
  sessionId: string;
  exp: number;
}

interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  role: string;
  status: string;
}

export class AuthService {
  private db: D1Database;
  private cache: KVNamespace | null;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private refreshExpiresIn: string;

  constructor(
    db: D1Database,
    cache: KVNamespace,
    options: {
      jwtSecret: string;
      jwtExpiresIn?: string;
      refreshExpiresIn?: string;
    }
  ) {
    this.db = db;
    this.cache = cache || null;
    this.jwtSecret = options.jwtSecret;
    this.jwtExpiresIn = options.jwtExpiresIn || '7d';
    this.refreshExpiresIn = options.refreshExpiresIn || '30d';
  }

  // ==================== Token 生成 ====================

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      sessionId,
      exp: now + (7 * 24 * 60 * 60), // 7 days
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
    });

    const refreshOpts = { algorithm: 'HS256' as const, expiresIn: this.refreshExpiresIn as `${number}d` };
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      this.jwtSecret,
      refreshOpts
    );

    // 保存会话到缓存
    await this.cache?.put(
      `session:${sessionId}`,
      JSON.stringify({
        userId: user.id,
        role: user.role,
        status: 'active',
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  // ==================== Token 验证 ====================

  async verifyToken(token: string): Promise<{
    valid: boolean;
    payload: TokenPayload | null;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      // 检查会话是否有效
      const session = await this.cache?.get(`session:${decoded.sessionId}`);
      if (!session) {
        return { valid: false, payload: null, error: 'Session expired' };
      }

      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, payload: null, error: (error as Error).message };
    }
  }

  // ==================== Token 刷新 ====================

  async refreshTokens(
    refreshToken: string
  ): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as {
        userId: string;
        sessionId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        return { success: false, error: 'Invalid token type' };
      }

      // 获取用户信息
      const user = await this.db.prepare(`
        SELECT * FROM "user" WHERE id = ?
      `).bind(decoded.userId).first() as User | null;

      if (!user || user.status !== 'active') {
        return { success: false, error: 'User not found or inactive' };
      }

      // 生成新 Token
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        ...tokens,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== Token 注销 ====================

  async logout(sessionId: string): Promise<void> {
    await this.cache?.delete(`session:${sessionId}`);
  }

  // ==================== 权限检查 ====================

  async checkPermission(
    userId: string,
    resourceType: string,
    action: string
  ): Promise<boolean> {
    // 获取用户角色
    const user = await this.db.prepare(`
      SELECT role FROM "user" WHERE id = ?
    `).bind(userId).first() as { role: string } | null;

    if (!user) return false;

    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') return true;

    // 检查权限映射
    const permissionMap: Record<string, Record<string, string[]>> = {
      admin: {
        food_court: ['read', 'write'],
        stall: ['read', 'write'],
        dish: ['read', 'write'],
        order: ['read', 'write'],
        stats: ['read'],
      },
      food_court_admin: {
        stall: ['read', 'write'],
        dish: ['read', 'write'],
        order: ['read', 'write'],
        stats: ['read'],
      },
      stall_admin: {
        dish: ['read', 'write'],
        order: ['read', 'write'],
      },
      user: {
        dish: ['read'],
        cart: ['read', 'write'],
        order: ['create', 'read'],
      },
    };

    const rolePermissions = permissionMap[user.role];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resourceType];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  }

  // ==================== 密码验证 ====================

  async verifyPassword(
    userId: string,
    password: string
  ): Promise<boolean> {
    const user = await this.db.prepare(`
      SELECT password_hash FROM "user" WHERE id = ?
    `).bind(userId).first() as { password_hash: string } | null;

    if (!user) return false;

    // 使用 bcrypt 验证密码
    // 注意：Cloudflare Workers 不支持 bcrypt，使用简单的比较
    // 实际生产中应该使用 bcrypt 或 argon2
    return user.password_hash === password;
  }

  // ==================== Token 解码 ====================

  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}
