-- ============================================================
-- 食阁扫码点单系统 - 补充 Schema
-- 添加用户、评价、促销等功能所需的表
-- ============================================================

-- ============================================================
-- 用户地址表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_address (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  is_default INTEGER DEFAULT 0,
  latitude REAL,
  longitude REAL,
  deleted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_address_user ON user_address(user_id);
CREATE INDEX IF NOT EXISTS idx_user_address_default ON user_address(user_id, is_default);

-- ============================================================
-- 评价举报表
-- ============================================================
CREATE TABLE IF NOT EXISTS review_report (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('spam', 'inappropriate', 'fake', 'other')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigated', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_report_review ON review_report(review_id);
CREATE INDEX IF NOT EXISTS idx_review_report_status ON review_report(status);

-- ============================================================
-- 促销使用记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS promotion_usage (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  order_id TEXT,
  discount_amount REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (promotion_id) REFERENCES promotion(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_promo ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user ON promotion_usage(user_id);

-- ============================================================
-- Webhook 日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_log (
  id TEXT PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  payload TEXT,
  order_id TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'failed', 'retrying')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  last_retry_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_type ON webhook_log(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_log_order ON webhook_log(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_status ON webhook_log(status);
CREATE INDEX IF NOT EXISTS idx_webhook_log_created ON webhook_log(created_at);

-- ============================================================
-- 订单评价表 (补充 review 表)
-- ============================================================
ALTER TABLE review ADD COLUMN overall_rating INTEGER;
ALTER TABLE review ADD COLUMN food_rating INTEGER;
ALTER TABLE review ADD COLUMN moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- ============================================================
-- 优惠券表补充字段
-- ============================================================
ALTER TABLE coupon ADD COLUMN food_court_id TEXT;
ALTER TABLE coupon ADD COLUMN applicable_stalls TEXT;
ALTER TABLE coupon ADD COLUMN applicable_dishes TEXT;
ALTER TABLE coupon ADD COLUMN promotion_type TEXT DEFAULT 'coupon' CHECK (promotion_type IN ('discount', 'coupon', 'flash_sale', 'bundle', 'first_order', 'loyalty'));

-- ============================================================
-- 促销表补充字段
-- ============================================================
ALTER TABLE promotion ADD COLUMN code TEXT;
ALTER TABLE promotion ADD COLUMN usage_limit_per_user INTEGER;
ALTER TABLE promotion ADD COLUMN total_usage_limit INTEGER;
ALTER TABLE promotion ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE promotion ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'expired'));
ALTER TABLE promotion ADD COLUMN created_by TEXT;
ALTER TABLE promotion ADD COLUMN deleted_at TEXT;

-- ============================================================
-- 用户优惠券表补充字段
-- ============================================================
ALTER TABLE user_coupon ADD COLUMN code TEXT;
ALTER TABLE user_coupon ADD COLUMN promotion_id TEXT;
ALTER TABLE user_coupon ADD COLUMN expires_at TEXT;
ALTER TABLE user_coupon ADD COLUMN received_at TEXT;

-- ============================================================
-- 翻译请求表 (补充)
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_request (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  source_text TEXT NOT NULL,
  source_lang TEXT DEFAULT 'zh-CN',
  target_langs TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_translation_request_status ON translation_request(status);
CREATE INDEX IF NOT EXISTS idx_translation_request_resource ON translation_request(resource_type, resource_id);

-- ============================================================
-- 菜品库存日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS dish_inventory_log (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL,
  log_type TEXT CHECK (log_type IN ('restock', 'adjust', 'sale', 'return', 'expired')),
  change_quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  order_id TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (dish_id) REFERENCES dish(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dish_inventory_log_dish ON dish_inventory_log(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_inventory_log_time ON dish_inventory_log(created_at);

-- ============================================================
-- 支付记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_record (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_channel TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'MYR',
  transaction_id TEXT,
  payment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  paid_at TEXT,
  refunded_at TEXT,
  refund_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES user_order(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_record_order ON payment_record(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_record_status ON payment_record(status);
CREATE INDEX IF NOT EXISTS idx_payment_record_transaction ON payment_record(transaction_id);
