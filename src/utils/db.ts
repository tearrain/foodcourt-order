/**
 * Database utilities
 */

import { D1Database } from '@cloudflare/workers-types';

export class DB {
  constructor(private db: D1Database) {}

  async query<T>(sql: string, ...bindings: any[]): Promise<T[]> {
    const result = await this.db.prepare(sql).bind(...bindings).all();
    return result.results as T[];
  }

  async first<T>(sql: string, ...bindings: any[]): Promise<T | null> {
    const result = await this.db.prepare(sql).bind(...bindings).first();
    return result as T | null;
  }

  async run(sql: string, ...bindings: any[]): Promise<{ success: boolean; meta: any }> {
    return await this.db.prepare(sql).bind(...bindings).run();
  }

  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    // D1 doesn't support transactions in the same way
    // This is a placeholder for future implementation
    return await callback(new Transaction(this.db));
  }
}

export class Transaction {
  constructor(private db: D1Database) {}

  async query<T>(sql: string, ...bindings: any[]): Promise<T[]> {
    const result = await this.db.prepare(sql).bind(...bindings).all();
    return result.results as T[];
  }

  async run(sql: string, ...bindings: any[]): Promise<{ success: boolean }> {
    return await this.db.prepare(sql).bind(...bindings).run();
  }
}

// Helper to generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to format date
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Helper to calculate distance between two coordinates (km)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
