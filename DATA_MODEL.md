# 🍜 食阁扫码点单系统 - 数据模型设计（V2）

**创建时间：** 2026-02-15
**更新：** 2026-02-15（增加库存、营销、业务字段）
**状态：** 待实施

---

## 一、核心实体

```
┌─────────────────────────────────────────────────────────────┐
│                      核心实体关系                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   FoodCourt (食阁)                                          │
│       │                                                    │
│       ├── 1:N ──► Stall (档口)                            │
│       │               │                                    │
│       │               ├── 1:N ──► Dish (菜品)              │
│       │               │       │                            │
│       │               │       └── 1:N ──► DishInventory (库存) │
│       │               │                                        │
│       │               └── 1:N ──► StallBusinessHours (营业时间) │
│       │                                                    │
│       └── 1:N ──► UserOrder (用户订单)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、数据表设计（完整版）

### 1. food_court（食阁）

```sql
CREATE TABLE food_court (
  -- 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,           -- 食阁名称
  description TEXT,                       -- 描述
  address TEXT,                           -- 地址
  country VARCHAR(100) DEFAULT 'Malaysia',-- 国家
  city VARCHAR(100),                      -- 城市
  latitude DECIMAL(10,8),                -- 纬度
  longitude DECIMAL(11,8),               -- 经度
  logo_url VARCHAR(500),                  -- Logo URL
  
  -- 营业信息
  timezone VARCHAR(50) DEFAULT 'Asia/Kuala_Lumpur',
  default_open_time TIME DEFAULT '10:00:00',
  default_close_time TIME DEFAULT '22:00:00',
  timezone_offset INTEGER DEFAULT 8,     -- 时区偏移
  
  -- 联系方式
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  website_url VARCHAR(500),
  
  -- 支付配置
  currency VARCHAR(3) DEFAULT 'MYR',     -- 货币：MYR, CNY, SGD
  tax_rate DECIMAL(5,2) DEFAULT 6.00,   -- 税率 %
  service_fee_rate DECIMAL(5,2) DEFAULT 0, -- 服务费 %
  
  -- 分账配置
  platform_commission_rate DECIMAL(5,2) DEFAULT 10.00, -- 平台抽成 %
  settlement_cycle VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, monthly
  
  -- 业务配置
  min_order_amount DECIMAL(10,2) DEFAULT 0, -- 最低起订金额
  max_order_per_user INTEGER DEFAULT 10,   -- 单用户单日最大订单数
  auto_confirm_order BOOLEAN DEFAULT TRUE, -- 是否自动确认订单
  
  -- 状态
  owner_id UUID,                          -- 所属商户/运营商
  status VARCHAR(20) DEFAULT 'active',    -- active, inactive, suspended, maintenance
  
  -- 扩展配置 (JSON)
  settings JSONB DEFAULT '{}',           
  -- {
  --   "features": {
  --     "reservation": true,
  --     "delivery": false,
  --     "pickup": true,
  --     "pre_order": false
  --   },
  --   "payment_methods": ["wechat", "alipay", "card"],
  --   "custom_branding": {
  --     "primary_color": "#FF6B35"
  --   }
  -- }
  
  -- SEO / 分享
  seo_title VARCHAR(255),
  seo_description TEXT,
  share_image_url VARCHAR(500),
  
  -- 软删除
  deleted_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_food_court_owner ON food_court(owner_id);
CREATE INDEX idx_food_court_status ON food_court(status);
CREATE INDEX idx_food_court_location ON food_court(latitude, longitude);
```

---

### 2. stall（档口）

```sql
CREATE TABLE stall (
  -- 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_court_id UUID NOT NULL REFERENCES food_court(id) ON DELETE CASCADE,
  
  -- 档口信息
  name VARCHAR(255) NOT NULL,           -- 档口名称
  description TEXT,                       -- 简介
  story TEXT,                            -- 档口故事
  logo_url VARCHAR(500),                  -- Logo
  cover_image VARCHAR(500),              -- 封面图
  banner_images TEXT[],                  -- 轮播图
  
  -- 联系信息
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  
  -- 位置
  floor_level INTEGER DEFAULT 1,         -- 楼层
  zone VARCHAR(50),                      -- 区域：A区、B区
  booth_number VARCHAR(20),              -- 摊位号
  
  -- 评分统计
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- 排序
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,     -- 是否推荐档口
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',  -- active, inactive, suspended
  verification_status VARCHAR(20) DEFAULT 'verified',
  
  -- 扩展配置
  settings JSONB DEFAULT '{}',
  -- {
  --   "prep_time_avg": 15,
  --   "peak_hours": ["12:00-14:00", "18:00-20:00"]
  -- }
  
  -- 软删除
  deleted_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stall_food_court ON stall(food_court_id);
CREATE INDEX idx_stall_status ON stall(status);
CREATE INDEX idx_stall_zone ON stall(zone, floor_level);
```

---

### 3. dish（菜品）- 完整版

```sql
CREATE TABLE dish (
  -- 基础信息
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID NOT NULL REFERENCES stall(id) ON DELETE CASCADE,
  
  -- 基本信息
  name VARCHAR(255) NOT NULL,            -- 菜品名称
  name_en VARCHAR(255),                   -- 英文名称
  description TEXT,                        -- 描述
  description_en TEXT,                    -- 英文描述
  
  -- 分类
  category_id UUID,
  category_name VARCHAR(100),             -- 冗余分类名称
  
  -- 价格
  price DECIMAL(10,2) NOT NULL,          -- 销售价
  original_price DECIMAL(10,2),            -- 原价
  cost_price DECIMAL(10,2),               -- 成本价
  
  -- 图片/媒体
  image_url VARCHAR(500),                  -- 主图
  image_urls TEXT[],                      -- 多图
  video_url VARCHAR(500),                  -- 视频
  
  -- 规格
  unit VARCHAR(20) DEFAULT '份',          -- 计量单位
  portion_size VARCHAR(50),               -- 份量：小、中、大
  
  -- === 库存管理（新增） ===
  has_inventory BOOLEAN DEFAULT FALSE,     -- 是否启用库存管理
  total_stock INTEGER,                     -- 总库存
  remaining_stock INTEGER,                -- 剩余库存
  low_stock_threshold INTEGER DEFAULT 10, -- 低库存阈值
  is_sold_out BOOLEAN DEFAULT FALSE,      -- 是否售罄
  max_per_order INTEGER DEFAULT 99,       -- 单次最大购买数
  last_restock_at TIMESTAMP,
  stock_updated_at TIMESTAMP,
  
  -- 上下架
  is_available BOOLEAN DEFAULT TRUE,      -- 是否可售
  publish_time TIMESTAMP,                -- 定时上架
  unpublish_time TIMESTAMP,              -- 定时下架
  
  -- 口味/属性
  is_spicy BOOLEAN DEFAULT FALSE,
  spicy_level INTEGER CHECK (spicy_level BETWEEN 1 AND 5),
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  allergens TEXT[],                      -- 过敏原
  ingredients TEXT[],                     -- 主要成分
  dietary_tags TEXT[],                   -- 饮食标签：halal, kosher
  
  -- 标签
  tags TEXT[],                           -- 标签：招牌、辣、素食、新品
  is_recommended BOOLEAN DEFAULT FALSE,  -- 是否推荐
  sort_order INTEGER DEFAULT 0,
  
  -- 评分统计
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_sold INTEGER DEFAULT 0,          -- 累计销量
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',   -- active, inactive, draft
  
  -- 扩展配置
  settings JSONB DEFAULT '{}',
  -- {
  --   "customizations": [  -- 自定义选项组
  --     {
  --       "name": "辣度",
  --       "required": true,
  --       "options": [
  --         {"name": "不辣", "price_modifier": 0},
  --         {"name": "微辣", "price_modifier": 0}
  --       ]
  --     }
  --   ],
  --   "preparation_time": 15
  -- }
  
  -- SEO
  seo_keywords VARCHAR(255),
  
  -- 软删除
  deleted_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dish_stall ON dish(stall_id);
CREATE INDEX idx_dish_status ON dish(status);
CREATE INDEX idx_dish_available ON dish(stall_id, is_available, is_sold_out);
CREATE INDEX idx_dish_recommended ON dish(is_recommended, sort_order);
```

---

### 3.1 dish_inventory（菜品库存）

```sql
CREATE TABLE dish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES dish(id) ON DELETE CASCADE,
  
  inventory_date DATE NOT NULL,          -- 日期
  
  opening_stock INTEGER NOT NULL DEFAULT 0,  -- 开盘库存
  remaining_stock INTEGER NOT NULL,           -- 当前库存
  total_restock INTEGER DEFAULT 0,           -- 补货总数
  total_sold INTEGER DEFAULT 0,              -- 销售总数
  total_waste INTEGER DEFAULT 0,            -- 损耗数
  
  low_stock_alerted BOOLEAN DEFAULT FALSE,
  sold_out_alerted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(dish_id, inventory_date)
);

CREATE INDEX idx_inventory_dish ON dish_inventory(dish_id, inventory_date);
```

---

### 3.2 dish_inventory_log（库存变动日志）

```sql
CREATE TABLE dish_inventory_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES dish(id) ON DELETE CASCADE,
  
  log_type VARCHAR(20) NOT NULL,           -- restock, sale, waste, adjustment
  
  change_quantity INTEGER NOT NULL,         -- 变动数量
  previous_stock INTEGER NOT NULL,          -- 变动前库存
  new_stock INTEGER NOT NULL,              -- 变动后库存
  
  order_id UUID,                           -- 销售关联订单
  reference_id VARCHAR(100),                -- 外部引用
  
  note TEXT,
  operator_id UUID,
  operator_type VARCHAR(20),               -- system, staff, admin
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_log_dish ON dish_inventory_log(dish_id, created_at);
```

---

### 4. user（用户）- 完整版

```sql
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 登录方式
  phone VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  
  -- 第三方登录
  wechat_openid VARCHAR(100) UNIQUE,
  wechat_unionid VARCHAR(100),
  
  apple_id VARCHAR(100) UNIQUE,
  
  -- 用户信息
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  
  -- 会员信息
  membership_level VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold
  membership_points INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  
  -- 统计
  total_orders INTEGER DEFAULT 0,
  
  -- 用户画像
  preferences JSONB DEFAULT '{}',
  -- {
  --   "allergens": ["花生"],
  --   "spicy_level_preference": 2
  -- }
  
  -- 通知偏好
  notification_settings JSONB DEFAULT '{}',
  -- {
  --   "order_updates": true,
  --   "promotions": true
  -- }
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMP,
  
  -- 软删除
  deleted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_phone ON "user"(phone);
CREATE INDEX idx_user_wechat ON "user"(wechat_openid);
```

---

### 5. user_order（用户订单）- 完整版

```sql
CREATE TABLE user_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,  -- 订单号
  
  -- 用户
  user_id UUID REFERENCES "user"(id),
  guest_session_id VARCHAR(100),
  
  -- 食阁
  food_court_id UUID REFERENCES food_court(id),
  
  -- 订单类型
  order_type VARCHAR(20) DEFAULT 'dine_in',
  
  -- 用餐信息
  table_number VARCHAR(50),
  dine_in_time TIMESTAMP,
  dine_in_persons INTEGER DEFAULT 2,
  
  -- 金额明细
  item_count INTEGER NOT NULL DEFAULT 0,
  subtotal_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  service_fee_amount DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  packaging_fee DECIMAL(10,2) DEFAULT 0,
  
  -- 优惠券
  coupon_id UUID,
  coupon_discount DECIMAL(10,2) DEFAULT 0,
  
  -- 实付金额
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 支付信息
  payment_method VARCHAR(50),
  payment_channel VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_time TIMESTAMP,
  transaction_id VARCHAR(200),
  
  -- 订单状态
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, paid, confirmed, preparing, ready, completed, cancelled
  
  -- 各阶段时间
  paid_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  preparing_at TIMESTAMP,
  ready_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- 取消信息
  cancel_reason VARCHAR(500),
  
  -- 退款
  refund_reason TEXT,
  refund_time TIMESTAMP,
  
  -- 用户备注
  user_remark VARCHAR(500),
  
  -- 发票
  invoice_type VARCHAR(20),
  invoice_title VARCHAR(255),
  invoice_tax_number VARCHAR(50),
  
  -- 评价
  has_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMP,
  
  -- 营销归因
  source VARCHAR(50),
  utm_source VARCHAR(100),
  
  -- 扩展
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_user ON user_order(user_id);
CREATE INDEX idx_order_food_court ON user_order(food_court_id);
CREATE INDEX idx_order_status ON user_order(status);
CREATE INDEX idx_order_created_at ON user_order(created_at DESC);
```

---

### 6. order_item（订单明细）

```sql
CREATE TABLE order_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES user_order(id) ON DELETE CASCADE,
  
  -- 菜品信息（冗余快照）
  dish_id UUID REFERENCES dish(id),
  dish_snapshot JSONB NOT NULL,
  -- {
  --   "name": "椰浆饭",
  --   "image_url": "https://xxx.jpg",
  --   "price": 15.00
  -- }
  
  -- 档口快照
  stall_id UUID,
  stall_name VARCHAR(255),
  
  -- 数量和价格
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal_amount DECIMAL(10,2) NOT NULL,
  
  -- 自定义选项
  customization_details JSONB DEFAULT '[]',
  
  -- 状态
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, confirmed, preparing, ready, served, cancelled
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_status ON order_item(status);
```

---

### 7. settlement（结算记录）

```sql
CREATE TABLE settlement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES user_order(id),
  stall_id UUID NOT NULL REFERENCES stall(id),
  
  item_count INTEGER NOT NULL,
  subtotal_amount DECIMAL(10,2) NOT NULL,
  
  platform_commission_rate DECIMAL(5,2) DEFAULT 10.00,
  platform_commission_amount DECIMAL(10,2),
  
  gross_settlement_amount DECIMAL(10,2),
  net_settlement_amount DECIMAL(10,2),
  
  status VARCHAR(20) DEFAULT 'pending',
  settled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_settlement_order ON settlement(order_id);
CREATE INDEX idx_settlement_stall ON settlement(stall_id, status);
```

---

### 8. cart（购物车）

```sql
CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES "user"(id),
  session_id VARCHAR(100),
  food_court_id UUID REFERENCES food_court(id),
  
  dish_id UUID REFERENCES dish(id),
  dish_snapshot JSONB,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  customizations JSONB DEFAULT '[]',
  
  status VARCHAR(20) DEFAULT 'active',
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, dish_id, customizations)
);

CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_session ON cart(session_id);
```

---

### 9. review（评价）

```sql
CREATE TABLE review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  order_id UUID NOT NULL REFERENCES user_order(id),
  user_id UUID REFERENCES "user"(id),
  dish_id UUID REFERENCES dish(id),
  stall_id UUID REFERENCES stall(id),
  
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
  
  content TEXT,
  content_images TEXT[],
  tags TEXT[],
  
  is_anonymous BOOLEAN DEFAULT FALSE,
  merchant_reply TEXT,
  merchant_reply_at TIMESTAMP,
  
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_stall ON review(stall_id);
CREATE INDEX idx_review_rating ON review(overall_rating);
```

---

### 10. promotion（营销活动）

```sql
CREATE TABLE promotion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_court_id UUID REFERENCES food_court(id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  promotion_type VARCHAR(50) NOT NULL,  -- discount, coupon, flash_sale, bundle
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  
  discount_type VARCHAR(20),             -- percentage, fixed
  discount_value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2),
  
  usage_limit_per_user INTEGER,
  total_usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'draft',
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 三、枚举值

```sql
CREATE TYPE order_status AS ENUM (
  'pending', 'paid', 'confirmed', 'preparing', 
  'ready', 'completed', 'cancelled', 'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'paid', 'failed', 'refunded'
);

CREATE TYPE inventory_log_type AS ENUM (
  'restock', 'sale', 'waste', 'adjustment', 'return'
);
```

---

## 四、核心功能说明

### 库存管理流程

```
1. 上架菜品时启用库存管理
2. 订单创建时扣减库存（预扣）
3. 订单支付后确认扣减
4. 订单取消/退款恢复库存
5. 售罄自动标记 is_sold_out
6. 低库存自动告警
```

### 推荐功能

```
1. 推荐菜品 = is_recommended + 高销量 + 高评分
2. 推荐档口 = is_featured + 高评分
3. 协同过滤 = 基于用户历史订单
```

---

## 五、数据模型统计

| 表名 | 字段数 | 说明 |
|------|--------|------|
| food_court | 25 | 食阁（含配置、位置、支付、SEO） |
| stall | 22 | 档口（含营业时间、审核、扩展配置） |
| dish | 35 | 菜品（含库存、自定义选项、SEO） |
| dish_inventory | 10 | 库存管理 |
| dish_inventory_log | 10 | 库存日志 |
| user | 25 | 用户（含画像、会员、通知） |
| user_order | 50 | 订单（完整状态机） |
| order_item | 15 | 订单明细 |
| settlement | 12 | 结算 |
| cart | 12 | 购物车 |
| review | 15 | 评价 |
| promotion | 18 | 营销 |

**总计：12张表，约247个字段**
