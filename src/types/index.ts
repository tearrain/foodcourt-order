/**
 * 类型定义
 */

import { D1Database } from '@cloudflare/workers-types';

// ==================== Environment ====================

export interface Env {
  // D1 Database
  DB: D1Database;
  
  // Environment Variables
  ENV: string;
  DEFAULT_LANGUAGE: string;
  SUPPORTED_LANGUAGES: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
}

// ==================== Context ====================

export interface Context<T extends Env = Env> {
  env: T;
  req: {
    header(name: string): string | null;
    json(): Promise<any>;
    parseBody(): Promise<any>;
  };
  set(key: string, value: any): void;
  get(key: string): any;
  json(data: any, status?: number): Response;
  html(html: string, status?: number): Response;
  redirect(url: string, status?: number): Response;
}

// ==================== Common ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface SoftDeleteEntity extends BaseEntity {
  deleted_at: string | null;
}

// ==================== User ====================

export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'banned';

export interface User extends SoftDeleteEntity {
  phone: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  wechat_openid: string | null;
  membership_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  membership_points: number;
  total_spent: number;
  total_orders: number;
  status: UserStatus;
  last_login_at: string | null;
}

// ==================== Food Court ====================

export interface FoodCourt extends SoftDeleteEntity {
  name: string;
  description: string | null;
  address: string | null;
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  contact_phone: string | null;
  currency: string;
  tax_rate: number;
  platform_commission_rate: number;
  status: 'active' | 'inactive' | 'suspended';
}

// ==================== Stall ====================

export interface Stall extends SoftDeleteEntity {
  food_court_id: string;
  name: string;
  description: string | null;
  story: string | null;
  logo_url: string | null;
  cover_image: string | null;
  floor_level: number;
  zone: string | null;
  booth_number: string | null;
  avg_rating: number;
  total_reviews: number;
  total_orders: number;
  is_featured: boolean;
  status: 'active' | 'inactive' | 'suspended';
}

// ==================== Dish ====================

export interface Dish extends SoftDeleteEntity {
  stall_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  cost_price: number | null;
  image_url: string | null;
  has_inventory: boolean;
  remaining_stock: number | null;
  is_sold_out: boolean;
  is_spicy: boolean;
  spicy_level: number | null;
  is_recommended: boolean;
  avg_rating: number;
  total_sold: number;
  status: 'active' | 'inactive' | 'draft';
}

// ==================== Cart ====================

export interface CartItem {
  id: string;
  user_id: string | null;
  session_id: string | null;
  food_court_id: string;
  dish_id: string;
  dish_snapshot: {
    name: string;
    price: number;
    image_url: string | null;
  };
  quantity: number;
  customizations: Record<string, any>[];
  status: 'active' | 'ordered';
  expires_at: string | null;
}

// ==================== Order ====================

export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'completed' 
  | 'cancelled'
  | 'refunded';

export type OrderType = 'dine_in' | 'takeout' | 'delivery';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export interface Order extends BaseEntity {
  user_id: string | null;
  guest_session_id: string | null;
  food_court_id: string;
  order_type: OrderType;
  table_number: string | null;
  item_count: number;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  payment_method: string | null;
  transaction_id: string | null;
}

export interface OrderItem extends BaseEntity {
  order_id: string;
  dish_id: string | null;
  dish_snapshot: {
    name: string;
    image_url: string | null;
    price: number;
  };
  stall_id: string | null;
  stall_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
}

// ==================== Translation ====================

export interface TranslationContent {
  id: string;
  resource_type: string;
  resource_id: string;
  field_name: string;
  lang: string;
  translated_text: string;
  is_auto_translated: boolean;
  quality_score: number | null;
}

// ==================== Review ====================

export interface Review extends BaseEntity {
  order_id: string;
  user_id: string | null;
  stall_id: string | null;
  dish_id: string | null;
  overall_rating: number;
  food_rating: number | null;
  content: string | null;
  content_images: string[];
  status: 'active' | 'hidden';
  moderation_status: 'pending' | 'approved' | 'rejected';
}

// ==================== Promotion ====================

export interface Promotion extends BaseEntity {
  food_court_id: string | null;
  name: string;
  description: string | null;
  promotion_type: 'discount' | 'coupon' | 'flash_sale' | 'bundle' | 'first_order' | 'loyalty';
  start_time: string;
  end_time: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  status: 'draft' | 'active' | 'paused' | 'expired';
}
