-- ============================================================
-- 食阁扫码点单系统 - 数据库 Schema
-- Database: Cloudflare D1 (SQLite compatible)
-- Created: 2026-02-15
-- ============================================================

-- ============================================================
-- 1. 食阁信息表
-- ============================================================
CREATE TABLE IF NOT EXISTS food_court (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Malaysia',
  latitude REAL,
  longitude REAL,
  opening_hours TEXT,  -- JSON format
  contact_phone TEXT,
  contact_email TEXT,
  image_url TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'MYR',
  tax_rate REAL DEFAULT 6.00,
  platform_commission_rate REAL DEFAULT 10.00,
  avg_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  stall_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_food_court_location ON food_court(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_food_court_active ON food_court(is_active);
CREATE INDEX IF NOT EXISTS idx_food_court_status ON food_court(status);
CREATE INDEX IF NOT EXISTS idx_food_court_deleted ON food_court(deleted_at);

-- ============================================================
-- 2. 档口表
-- ============================================================
CREATE TABLE IF NOT EXISTS stall (
  id TEXT PRIMARY KEY,
  food_court_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  cuisine_type TEXT,
  cuisine_type_en TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  contact_phone TEXT,
  opening_hours TEXT,
  avg_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (food_court_id) REFERENCES food_court(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stall_food_court ON stall(food_court_id);
CREATE INDEX IF NOT EXISTS idx_stall_cuisine ON stall(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_stall_active ON stall(is_active);
CREATE INDEX IF NOT EXISTS idx_stall_deleted ON stall(deleted_at);

-- ============================================================
-- 3. 菜品分类表
-- ============================================================
CREATE TABLE IF NOT EXISTS dish_category (
  id TEXT PRIMARY KEY,
  stall_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (stall_id) REFERENCES stall(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dish_category_stall ON dish_category(stall_id);

-- ============================================================
-- 4. 菜品表
-- ============================================================
CREATE TABLE IF NOT EXISTS dish (
  id TEXT PRIMARY KEY,
  stall_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  price REAL NOT NULL,
  original_price REAL,
  cost_price REAL,
  image_url TEXT,
  unit TEXT DEFAULT '份',
  portion_size TEXT,
  
  -- 库存管理
  has_inventory INTEGER DEFAULT 0,
  total_stock INTEGER DEFAULT 0,
  remaining_stock INTEGER,
  low_stock_threshold INTEGER DEFAULT 10,
  is_sold_out INTEGER DEFAULT 0,
  
  -- 辣度与素食
  is_spicy INTEGER DEFAULT 0,
  spicy_level INTEGER CHECK (spicy_level >= 1 AND spicy_level <= 5),
  is_vegetarian INTEGER DEFAULT 0,
  is_vegan INTEGER DEFAULT 0,
  
  -- 配料信息
  allergens TEXT,  -- JSON array
  ingredients TEXT,
  dietary_tags TEXT,
  tags TEXT,
  
  -- 营销
  is_recommended INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 99,
  sort_order INTEGER DEFAULT 0,
  
  -- 状态
  is_available INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  
  -- 统计
  avg_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,

  -- 时间戳
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  last_restock_at TEXT,
  
  FOREIGN KEY (stall_id) REFERENCES stall(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES dish_category(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dish_stall ON dish(stall_id);
CREATE INDEX IF NOT EXISTS idx_dish_category ON dish(category_id);
CREATE INDEX IF NOT EXISTS idx_dish_status ON dish(status, is_available, is_sold_out);
CREATE INDEX IF NOT EXISTS idx_dish_recommended ON dish(is_recommended, is_available);
CREATE INDEX IF NOT EXISTS idx_dish_deleted ON dish(deleted_at);

-- ============================================================
-- 5. 菜品库存变动日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS dish_inventory_log (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL,
  log_type TEXT CHECK (log_type IN ('restock', 'sale', 'waste', 'adjustment', 'return', 'transfer')),
  change_quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  note TEXT,
  operator_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (dish_id) REFERENCES dish(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dish_inventory_log_dish ON dish_inventory_log(dish_id);

-- ============================================================
-- 6. 购物车表
-- ============================================================
CREATE TABLE IF NOT EXISTS cart (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  food_court_id TEXT NOT NULL,
  dish_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  customizations TEXT,  -- JSON
  dish_snapshot TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ordered', 'deleted')),
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (food_court_id) REFERENCES food_court(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dish(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_status ON cart(status, expires_at);

-- ============================================================
-- 7. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  nickname TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'stall_admin', 'food_court_admin', 'super_admin')),
  membership_level TEXT DEFAULT 'bronze' CHECK (membership_level IN ('bronze', 'silver', 'gold', 'platinum')),
  membership_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_phone ON "user"(phone);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- ============================================================
-- 8. 用户地址表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_address (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  receiver_name TEXT,
  receiver_phone TEXT,
  address TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Malaysia',
  latitude REAL,
  longitude REAL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_address_user ON user_address(user_id);

-- ============================================================
-- 9. 订单表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_order (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  user_id TEXT,
  guest_session_id TEXT,
  food_court_id TEXT NOT NULL,
  
  -- 订单类型
  order_type TEXT CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
  table_number TEXT,
  
  -- 金额
  item_count INTEGER DEFAULT 0,
  subtotal_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  delivery_fee REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  cost_price_total REAL DEFAULT 0,
  
  -- 支付
  payment_method TEXT,
  payment_channel TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_id TEXT,
  transaction_id TEXT,
  paid_amount REAL DEFAULT 0,
  paid_at TEXT,
  
  -- 状态
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded')),
  confirmed_at TEXT,
  preparing_at TEXT,
  ready_at TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  
  -- 备注
  user_remark TEXT,
  admin_remark TEXT,
  cancel_reason TEXT,
  
  -- 配送信息
  delivery_address_id TEXT,
  delivery_address_snapshot TEXT,
  estimated_delivery_time TEXT,
  actual_delivery_time TEXT,
  
  -- 评价
  has_review INTEGER DEFAULT 0,

  -- 退款
  refund_amount REAL DEFAULT 0,
  refund_reason TEXT,
  refund_time TEXT,
  
  -- 时间戳
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL,
  FOREIGN KEY (food_court_id) REFERENCES food_court(id) ON DELETE RESTRICT,
  FOREIGN KEY (delivery_address_id) REFERENCES user_address(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_user ON user_order(user_id);
CREATE INDEX IF NOT EXISTS idx_order_food_court ON user_order(food_court_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON user_order(status);
CREATE INDEX IF NOT EXISTS idx_order_created ON user_order(created_at);
CREATE INDEX IF NOT EXISTS idx_order_no ON user_order(order_no);

-- ============================================================
-- 10. 订单项表
-- ============================================================
CREATE TABLE IF NOT EXISTS order_item (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  dish_id TEXT,
  dish_snapshot TEXT,
  stall_id TEXT NOT NULL,
  stall_name TEXT,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  original_price REAL,
  subtotal_amount REAL NOT NULL,
  customization_details TEXT,
  
  -- 状态
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  served_at TEXT,
  cancelled_at TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dish(id) ON DELETE SET NULL,
  FOREIGN KEY (stall_id) REFERENCES stall(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_dish ON order_item(dish_id);

-- ============================================================
-- 11. 评价表
-- ============================================================
CREATE TABLE IF NOT EXISTS review (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  food_court_id TEXT,
  stall_id TEXT,
  dish_id TEXT,
  order_id TEXT NOT NULL,
  order_item_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  content TEXT,
  content_en TEXT,
  image_urls TEXT,
  content_images TEXT,
  is_public INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  admin_reply TEXT,
  admin_replied_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (food_court_id) REFERENCES food_court(id) ON DELETE CASCADE,
  FOREIGN KEY (stall_id) REFERENCES stall(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_user ON review(user_id);
CREATE INDEX IF NOT EXISTS idx_review_food_court ON review(food_court_id);
CREATE INDEX IF NOT EXISTS idx_review_stall ON review(stall_id);
CREATE INDEX IF NOT EXISTS idx_review_order ON review(order_id);

-- ============================================================
-- 12. 优惠券表
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value REAL NOT NULL,
  min_order_amount REAL DEFAULT 0,
  max_discount_amount REAL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  user_usage_limit INTEGER DEFAULT 1,
  valid_from TEXT,
  valid_until TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_coupon_code ON coupon(code);
CREATE INDEX IF NOT EXISTS idx_coupon_active ON coupon(is_active, valid_from, valid_until);

-- ============================================================
-- 13. 用户优惠券表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_coupon (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  coupon_id TEXT NOT NULL,
  order_id TEXT,
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (coupon_id) REFERENCES coupon(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_coupon_user ON user_coupon(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_status ON user_coupon(status);

-- ============================================================
-- 14. 促销活动表
-- ============================================================
CREATE TABLE IF NOT EXISTS promotion (
  id TEXT PRIMARY KEY,
  food_court_id TEXT,
  stall_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT CHECK (promotion_type IN ('discount', 'coupon', 'flash_sale', 'bundle', 'first_order', 'loyalty')),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y')),
  discount_value REAL,
  buy_quantity INTEGER,
  get_quantity INTEGER,
  min_item_count INTEGER,
  min_order_amount REAL DEFAULT 0,
  max_discount_amount REAL,
  usage_limit_per_user INTEGER,
  total_usage_limit INTEGER,
  applicable_items TEXT,
  applicable_stalls TEXT,
  applicable_dishes TEXT,
  code TEXT,
  start_time TEXT,
  end_time TEXT,
  is_active INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (food_court_id) REFERENCES food_court(id) ON DELETE CASCADE,
  FOREIGN KEY (stall_id) REFERENCES stall(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_promotion_active ON promotion(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_promotion_status ON promotion(status);
CREATE INDEX IF NOT EXISTS idx_promotion_code ON promotion(code);

-- ============================================================
-- 15. 翻译资源表
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_resource (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,  -- 'dish', 'stall', 'food_court', 'category', 'promotion'
  resource_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  source_text TEXT NOT NULL,
  source_lang TEXT DEFAULT 'zh-CN',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(resource_type, resource_id, field_name, source_lang)
);

CREATE INDEX IF NOT EXISTS idx_translation_resource_lookup ON translation_resource(resource_type, resource_id);

-- ============================================================
-- 16. 翻译内容表
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_content (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated_text TEXT,
  provider TEXT,
  cost REAL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'translating', 'completed', 'failed')),
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (resource_id) REFERENCES translation_resource(id) ON DELETE CASCADE,
  UNIQUE(resource_id, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translation_content_resource ON translation_content(resource_id);
CREATE INDEX IF NOT EXISTS idx_translation_content_lang ON translation_content(target_lang);

-- ============================================================
-- 17. 翻译任务队列表
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_queue (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  target_langs TEXT NOT NULL,  -- JSON array
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (resource_id) REFERENCES translation_resource(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_translation_queue_status ON translation_queue(status, priority);

-- ============================================================
-- 18. Webhook日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_log (
  id TEXT PRIMARY KEY,
  webhook_type TEXT,
  provider TEXT,
  payload TEXT,
  order_id TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processing', 'success', 'failed', 'retrying')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_order ON webhook_log(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_status ON webhook_log(status);

-- ============================================================
-- 19. 评论举报表
-- ============================================================
CREATE TABLE IF NOT EXISTS review_report (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  reporter_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_report_review ON review_report(review_id);

-- ============================================================
-- 20. 促销使用记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS promotion_usage (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL,
  user_id TEXT,
  order_id TEXT,
  usage_count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (promotion_id) REFERENCES promotion(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user ON promotion_usage(user_id);

-- ============================================================
-- 21. 系统配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- 初始化系统配置
-- ============================================================
INSERT INTO system_config (id, config_key, config_value, description) VALUES
('1', 'supported_languages', 'en,zh-CN,zh-TW,ms,id,th,ja,ko', '支持的语言列表'),
('2', 'default_language', 'zh-CN', '默认语言'),
('3', 'tax_rate', '0.06', '默认税率'),
('4', 'delivery_fee_base', '2.00', '基础配送费'),
('5', 'min_order_amount', '5.00', '起送金额')
ON CONFLICT(config_key) DO UPDATE SET 
  config_value = excluded.config_value,
  updated_at = datetime('now');
