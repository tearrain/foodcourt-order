# 🍜 食阁扫码点单系统 - API 接口设计

**创建时间：** 2026-02-15
**更新：** 2026-02-15（添加国际化 + 管理后台 API）
**版本：** v1
**状态：** 待实施

---

## 零、国际化 (i18n)

### 0.1 语言检测

**前端检测逻辑：**
```javascript
// 优先级：
// 1. URL 参数 ?lang=zh-CN
// 2. LocalStorage 保存的语言
// 3. 浏览器语言 (navigator.language)
// 4. 默认语言 (en)
```

### 0.2 支持语言

| 语言代码 | 语言名称 | 地区 | 优先级 |
|----------|----------|------|--------|
| en | English | 默认 | 0 |
| zh-CN | 简体中文 | 中国 | 1 |
| zh-TW | 繁體中文 | 台湾 | 2 |
| ms | Bahasa Melayu | 马来西亚 | 3 |
| id | Bahasa Indonesia | 印尼 | 4 |
| th | ภาษาไทย | 泰国 | 5 |
| ja | 日本語 | 日本 | 6 |
| ko | 한국어 | 韩国 | 7 |

### 0.3 国际化内容表

```sql
-- 国际化内容表
CREATE TABLE i18n_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 资源标识
  resource_type VARCHAR(50) NOT NULL,  -- dish, stall, food_court, promotion, common
  resource_id UUID,                     -- 关联资源ID（可为NULL表示通用文本）
  key VARCHAR(100) NOT NULL,             -- 文本键名
  
  -- 多语言内容
  translations JSONB NOT NULL,
  -- {
  --   "en": "Nasi Lemak",
  --   "zh-CN": "椰浆饭",
  --   "zh-TW": "椰漿飯",
  --   "ms": "Nasi Lemak"
  -- }
  
  -- 元数据
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(resource_type, resource_id, key)
);

-- 索引
CREATE INDEX idx_i18n_resource ON i18n_content(resource_type, resource_id);
CREATE INDEX idx_i18n_key ON i18n_content(key);
```

### 0.4 国际化 API

#### 获取翻译

```
GET /i18n/{langCode}
```

**响应：**
```json
{
  "data": {
    "lang": "zh-CN",
    "translations": {
      "common": {
        "add_to_cart": "加入购物车",
        "checkout": "去结算",
        "loading": "加载中..."
      },
      "dish": {
        "sold_out": "已售罄",
        "recommended": "推荐"
      }
    }
  }
}
```

#### 获取单个资源翻译

```
GET /i18n/{langCode}/{resourceType}/{resourceId}
```

---

## 一、API 概述

### 基础信息

| 项目 | 值 |
|------|------|
| Base URL | `/api/v1` |
| 认证方式 | JWT Token (Header: `Authorization: Bearer <token>`) |
| 响应格式 | JSON |
| 字符编码 | UTF-8 |
| 时区 | UTC |

### 通用响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-02-15T10:00:00Z"
  }
}
```

### 错误响应

```json
{
  "code": 40001,
  "message": "参数错误",
  "details": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-02-15T10:00:00Z"
  }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

---

## 二、API 列表

### 1. 食阁相关

#### 1.1 获取食阁详情

```
GET /food-courts/{id}
```

**响应：**
```json
{
  "data": {
    "id": "uuid",
    "name": "KLCC Food Court",
    "description": "吉隆坡市中心最大美食广场",
    "address": "Jalan Ampang, Kuala Lumpur",
    "latitude": 3.158069,
    "longitude": 101.711549,
    "logo_url": "https://...",
    "open_time": "10:00:00",
    "close_time": "22:00:00",
    "currency": "MYR",
    "settings": {
      "features": {
        "reservation": true,
        "delivery": false
      }
    },
    "stall_count": 12,
    "avg_rating": 4.5
  }
}
```

---

#### 1.2 获取食阁列表

```
GET /food-courts
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat | float | 否 | 纬度（附近排序） |
| lng | float | 否 | 经度（附近排序） |
| page | int | 否 | 页码，默认 1 |
| limit | int | 否 | 每页数量，默认 20 |

**响应：**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "KLCC Food Court",
      "distance": 1.2,
      "stall_count": 12,
      "avg_rating": 4.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### 2. 档口相关

#### 2.1 获取档口详情

```
GET /stalls/{id}
```

**响应：**
```json
{
  "data": {
    "id": "uuid",
    "food_court_id": "uuid",
    "name": "马来风味坊",
    "description": "正宗马来西亚美食",
    "story": "创立于1995年...",
    "logo_url": "https://...",
    "cover_image": "https://...",
    "banner_images": ["https://..."],
    "floor_level": 1,
    "zone": "A区",
    "booth_number": "A-01",
    "avg_rating": 4.5,
    "total_reviews": 328,
    "total_orders": 1523,
    "is_featured": true,
    "business_hours": [
      {
        "day_of_week": 1,
        "open_time": "10:00:00",
        "close_time": "22:00:00"
      }
    ],
    "dish_count": 15,
    "is_open": true
  }
}
```

---

#### 2.2 获取档口列表

```
GET /food-courts/{id}/stalls
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |
| featured | bool | 否 | 仅推荐档口 |
| zone | string | 否 | 区域筛选 |

---

#### 2.3 获取档口在售菜品

```
GET /stalls/{id}/dishes
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | uuid | 否 | 分类ID |
| available | bool | 否 | 仅在售 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

**响应：**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "椰浆饭",
      "name_en": "Nasi Lemak",
      "description": "马来西亚国菜...",
      "price": 15.00,
      "image_url": "https://...",
      "category": "主食",
      "tags": ["招牌", "马来经典"],
      "is_recommended": true,
      "avg_rating": 4.6,
      "total_sold": 1523,
      "is_sold_out": false,
      "customizations": [
        {
          "name": "辣度",
          "required": true,
          "options": [
            {"name": "不辣", "price_modifier": 0},
            {"name": "微辣", "price_modifier": 0}
          ]
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

### 3. 菜品相关

#### 3.1 获取菜品详情

```
GET /dishes/{id}
```

---

#### 3.2 搜索菜品

```
GET /dishes
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 否 | 搜索关键词 |
| stall_id | uuid | 否 | 档口筛选 |
| category | string | 否 | 分类筛选 |
| min_price | decimal | 否 | 最低价格 |
| max_price | decimal | 否 | 最高价格 |
| tags | string | 否 | 标签（逗号分隔） |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

---

#### 3.3 获取推荐菜品

```
GET /dishes/recommended
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| food_court_id | uuid | 否 | 食阁筛选 |
| limit | int | 否 | 数量限制 |

---

### 4. 购物车相关

#### 4.1 获取购物车

```
GET /cart
```

**响应：**
```json
{
  "data": {
    "id": "uuid",
    "food_court_id": "uuid",
    "items": [
      {
        "id": "uuid",
        "dish_id": "uuid",
        "dish": {
          "id": "uuid",
          "name": "椰浆饭",
          "price": 15.00,
          "image_url": "https://..."
        },
        "quantity": 2,
        "customizations": [
          {"group": "辣度", "option": "不辣"}
        ],
        "unit_price": 15.00,
        "subtotal": 30.00
      }
    ],
    "item_count": 2,
    "subtotal": 30.00,
    "discount": 0,
    "total": 30.00,
    "expires_at": "2026-02-16T10:00:00Z"
  }
}
```

---

#### 4.2 添加到购物车

```
POST /cart/items
```

**请求体：**
```json
{
  "dish_id": "uuid",
  "quantity": 2,
  "customizations": [
    {"group": "辣度", "option": "不辣"}
  ]
}
```

---

#### 4.3 更新购物车商品数量

```
PATCH /cart/items/{id}
```

**请求体：**
```json
{
  "quantity": 3
}
```

---

#### 4.4 删除购物车商品

```
DELETE /cart/items/{id}
```

---

#### 4.5 清空购物车

```
DELETE /cart
```

---

#### 4.6 批量操作购物车（支持跨档口）

```
POST /cart/batch
```

**请求体：**
```json
{
  "items": [
    {
      "dish_id": "uuid",
      "quantity": 1,
      "customizations": []
    },
    {
      "dish_id": "uuid",
      "quantity": 2,
      "customizations": []
    }
  ]
}
```

---

### 5. 订单相关

#### 5.1 创建订单

```
POST /orders
```

**请求体：**
```json
{
  "food_court_id": "uuid",
  "order_type": "dine_in",
  "table_number": "A01",
  "cart_id": "uuid",
  "items": [
    {
      "dish_id": "uuid",
      "quantity": 2,
      "customizations": []
    }
  ],
  "coupon_code": "SAVE5",
  "user_remark": "少放辣",
  "delivery_address_id": "uuid"  // 外卖时必填
}
```

**响应：**
```json
{
  "data": {
    "order_id": "uuid",
    "order_no": "FOOD-20260215-00001",
    "total_amount": 28.50,
    "payment_url": "https://payment.example.com/pay/xxx"
  }
}
```

---

#### 5.2 获取订单详情

```
GET /orders/{id}
```

**响应：**
```json
{
  "data": {
    "id": "uuid",
    "order_no": "FOOD-20260215-00001",
    "food_court": {
      "id": "uuid",
      "name": "KLCC Food Court"
    },
    "order_type": "dine_in",
    "table_number": "A01",
    "items": [
      {
        "id": "uuid",
        "dish_name": "椰浆饭",
        "stall_name": "马来风味坊",
        "quantity": 2,
        "unit_price": 15.00,
        "subtotal": 30.00,
        "status": "preparing"
      }
    ],
    "item_count": 2,
    "subtotal": 30.00,
    "discount": 1.50,
    "tax": 1.80,
    "total": 28.50,
    "payment_status": "paid",
    "status": "preparing",
    "estimated_ready_time": "2026-02-15T10:30:00Z",
    "created_at": "2026-02-15T10:00:00Z"
  }
}
```

---

#### 5.3 获取订单列表

```
GET /orders
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

---

#### 5.4 取消订单

```
POST /orders/{id}/cancel
```

**请求体：**
```json
{
  "reason": "不想要了"
}
```

---

#### 5.5 确认收货/取餐

```
POST /orders/{id}/complete
```

---

### 6. 支付相关

#### 6.1 创建支付

```
POST /orders/{id}/payment
```

**请求体：**
```json
{
  "payment_method": "wechat",
  "payment_channel": "wechat_mini"
}
```

---

#### 6.2 支付回调

```
POST /webhooks/payment
```

**通知方：** 支付网关

---

#### 6.3 申请退款

```
POST /orders/{id}/refund
```

**请求体：**
```json
{
  "reason": "菜品质量问题",
  "refund_amount": 15.00
}
```

---

### 7. 用户相关

#### 7.1 获取用户信息

```
GET /users/me
```

---

#### 7.2 更新用户信息

```
PATCH /users/me
```

---

#### 7.3 获取用户地址列表

```
GET /users/me/addresses
```

---

#### 7.4 添加地址

```
POST /users/me/addresses
```

---

#### 7.5 获取用户优惠券

```
GET /users/me/coupons
```

---

### 8. 评价相关

#### 8.1 提交评价

```
POST /orders/{id}/review
```

**请求体：**
```json
{
  "overall_rating": 5,
  "food_rating": 5,
  "content": "味道很好，推荐！",
  "images": ["https://..."],
  "tags": ["味道好", "上菜快"]
}
```

---

#### 8.2 获取档口评价

```
GET /stalls/{id}/reviews
```

---

### 9. 营销相关

#### 9.1 获取可用优惠券

```
GET /promotions/available
```

---

#### 9.2 兑换优惠券

```
POST /promotions/redeem
```

**请求体：**
```json
{
  "code": "SAVE5"
}
```

---

### 10. 搜索相关

#### 10.1 全局搜索

```
GET /search
```

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| type | string | 否 | 类型：dish, stall, food_court |
| food_court_id | uuid | 否 | 食阁筛选 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

---

## 三、WebSocket API

### 连接地址

```
wss://api.example.com/ws/v1
```

### 认证

```
Connection Header: Authorization: Bearer <token>
```

### 事件列表

#### 订单状态更新

```json
{
  "event": "order.status_update",
  "data": {
    "order_id": "uuid",
    "order_no": "FOOD-20260215-00001",
    "status": "ready",
    "message": "您的订单已准备好，请取餐"
  }
}
```

#### 订单项状态更新

```json
{
  "event": "order_item.status_update",
  "data": {
    "order_id": "uuid",
    "item_id": "uuid",
    "dish_name": "椰浆饭",
    "status": "ready"
  }
}
```

#### 库存告警

```json
{
  "event": "inventory.low_stock",
  "data": {
    "dish_id": "uuid",
    "dish_name": "椰浆饭",
    "remaining_stock": 5,
    "threshold": 10
  }
}
```

#### 促销推送

```json
{
  "event": "promotion.new",
  "data": {
    "promotion_id": "uuid",
    "title": "新用户首单立减5元",
    "description": "首次下单立减5元",
    "end_time": "2026-03-15T00:00:00Z"
  }
}
```

---

## 四、错误码定义

| 错误码 | 说明 |
|--------|------|
| 40001 | 参数错误 |
| 40002 | 参数缺失 |
| 40003 | 参数格式错误 |
| 40004 | 资源不存在 |
| 40005 | 操作冲突 |
| 40101 | 未登录 |
| 40102 | Token 过期 |
| 40103 | Token 无效 |
| 40301 | 无权限访问 |
| 40302 | 账户被禁用 |
| 40401 | 资源不存在 |
| 40402 | 菜品已售罄 |
| 40403 | 档口已打烊 |
| 40404 | 优惠券已使用 |
| 40405 | 优惠券已过期 |
| 42901 | 请求过于频繁 |
| 50001 | 服务器错误 |
| 50002 | 数据库错误 |
| 50003 | 支付失败 |

---

## 五、分页规范

### 响应格式

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 六、速率限制

| 级别 | 限制 |
|------|------|
| 普通用户 | 100 次/分钟 |
| 认证用户 | 500 次/分钟 |
| 关键接口 | 60 次/分钟 |

---

## 七、API 版本管理

- 当前版本：v1
- URL 格式：`/api/v1/{resource}`
- 版本升级时，旧版本至少维护 6 个月

---

## 八、下一步

- [ ] 编写 API 文档（Swagger/OpenAPI）
- [ ] 实现 API 路由
- [ ] 编写 API 测试用例

---

## 九、管理后台 API

### 9.1 权限体系

| 角色 | 权限范围 |
|------|----------|
| **平台管理员 (super_admin)** | 所有食阁、所有档口、全局配置 |
| **食阁管理员 (food_court_admin)** | 所管理的食阁及下属档口 |
| **档口管理员 (stall_admin)** | 所管理的档口 |

### 9.2 平台管理 API

#### 9.2.1 食阁管理

```
GET /admin/food-courts          # 获取食阁列表
POST /admin/food-courts        # 创建食阁
GET /admin/food-courts/{id}    # 获取食阁详情
PUT /admin/food-courts/{id}    # 更新食阁
DELETE /admin/food-courts/{id} # 删除食阁
POST /admin/food-courts/{id}/activate   # 激活食阁
POST /admin/food-courts/{id}/suspend    # 暂停食阁
```

**请求体（创建/更新）：**
```json
{
  "name": "KLCC Food Court",
  "description": "吉隆坡市中心美食广场",
  "address": "...",
  "contact_phone": "...",
  "currency": "MYR",
  "tax_rate": 6.00,
  "platform_commission_rate": 10.00,
  "settings": {
    "features": {
      "reservation": true,
      "delivery": false
    }
  },
  "owner_id": "uuid"
}
```

---

#### 9.2.2 档口审核

```
GET /admin/stalls/pending       # 待审核档口列表
GET /admin/stalls/{id}         # 审核档口详情
POST /admin/stalls/{id}/verify # 审核通过
POST /admin/stalls/{id}/reject # 审核拒绝
```

---

#### 9.2.3 平台统计

```
GET /admin/stats/overview              # 平台概览
GET /admin/stats/food-courts           # 食阁统计
GET /admin/stats/orders               # 订单统计
GET /admin/stats/revenue               # 收入统计
GET /admin/stats/users                # 用户统计
```

**响应：**
```json
{
  "data": {
    "total_orders": 12580,
    "total_revenue": 285640.50,
    "total_users": 4520,
    "total_food_courts": 5,
    "total_stalls": 48,
    "avg_order_value": 22.70,
    "orders_today": 156,
    "revenue_today": 3540.50
  }
}
```

---

#### 9.2.4 全局配置

```
GET /admin/config              # 获取全局配置
PUT /admin/config             # 更新全局配置
```

---

#### 9.2.5 平台管理员管理

```
GET /admin/admins              # 管理员列表
POST /admin/admins            # 创建管理员
DELETE /admin/admins/{id}    # 删除管理员
```

---

### 9.3 食阁管理 API

#### 9.3.1 档口管理

```
GET /admin/food-courts/{id}/stalls           # 获取档口列表
POST /admin/food-courts/{id}/stalls         # 创建档口
GET /admin/stalls/{id}                       # 获取档口详情
PUT /admin/stalls/{id}                       # 更新档口
DELETE /admin/stalls/{id}                    # 删除档口
POST /admin/stalls/{id}/feature              # 设置推荐
POST /admin/stalls/{id}/suspend             # 暂停档口
```

---

#### 9.3.2 菜品管理

```
GET /admin/stalls/{id}/dishes               # 获取菜品列表
POST /admin/stalls/{id}/dishes              # 添加菜品
GET /admin/dishes/{id}                       # 获取菜品详情
PUT /admin/dishes/{id}                       # 更新菜品
DELETE /admin/dishes/{id}                    # 删除菜品
POST /admin/dishes/{id}/publish              # 发布菜品
POST /admin/dishes/{id}/unpublish           # 下架菜品
POST /admin/dishes/{id}/stock               # 更新库存
```

**请求体（添加菜品）：**
```json
{
  "name": {
    "en": "Nasi Lemak",
    "zh-CN": "椰浆饭",
    "ms": "Nasi Lemak"
  },
  "description": {
    "en": "Malaysian national dish...",
    "zh-CN": "马来西亚国菜..."
  },
  "price": 15.00,
  "category_id": "uuid",
  "image_url": "https://...",
  "has_inventory": true,
  "total_stock": 100,
  "settings": {
    "customizations": [
      {
        "name": "辣度",
        "required": true,
        "options": [
          {"name": {"en": "Not Spicy", "zh-CN": "不辣"}, "price_modifier": 0},
          {"name": {"en": "Spicy", "zh-CN": "辣"}, "price_modifier": 0}
        ]
      }
    ]
  }
}
```

---

#### 9.3.3 订单管理

```
GET /admin/food-courts/{id}/orders              # 获取订单列表
GET /admin/orders/{id}                          # 获取订单详情
POST /admin/orders/{id}/confirm                 # 确认订单
POST /admin/orders/{id}/prepare                 # 开始准备
POST /admin/orders/{id}/ready                   # 准备完成
POST /admin/orders/{id}/complete                # 完成订单
POST /admin/orders/{id}/cancel                  # 取消订单
POST /admin/orders/{id}/refund                  # 退款
```

---

#### 9.3.4 结算管理

```
GET /admin/food-courts/{id}/settlements         # 结算列表
GET /admin/settlements/{id}                     # 结算详情
POST /admin/settlements/generate               # 生成结算
POST /admin/settlements/{id}/transfer          # 确认转账
GET /admin/settlements/export                  # 导出结算报表
```

---

#### 9.3.5 营业时间管理

```
GET /admin/stalls/{id}/business-hours          # 获取营业时间
PUT /admin/stalls/{id}/business-hours          # 更新营业时间
POST /admin/stalls/{id}/holidays              # 添加节假日
DELETE /admin/stalls/{id}/holidays/{holiday_id} # 删除节假日
```

---

#### 9.3.6 营销活动

```
GET /admin/promotions                          # 营销列表
POST /admin/promotions                        # 创建活动
GET /admin/promotions/{id}                    # 活动详情
PUT /admin/promotions/{id}                    # 更新活动
POST /admin/promotions/{id}/publish           # 发布活动
POST /admin/promotions/{id}/pause             # 暂停活动
DELETE /admin/promotions/{id}                 # 删除活动
```

---

#### 9.3.7 评价管理

```
GET /admin/stalls/{id}/reviews                 # 评价列表
GET /admin/reviews/{id}                        # 评价详情
POST /admin/reviews/{id}/reply                 # 回复评价
POST /admin/reviews/{id}/hide                 # 隐藏评价
POST /admin/reviews/{id}/show                 # 显示评价
```

---

#### 9.3.8 数据统计

```
GET /admin/food-courts/{id}/stats/orders      # 订单统计
GET /admin/food-courts/{id}/stats/revenue     # 收入统计
GET /admin/food-courts/{id}/stats/dishes      # 菜品销量排行
GET /admin/food-courts/{id}/stats/stalls     # 档口排行
GET /admin/food-courts/{id}/stats/users      # 用户统计
```

**响应：**
```json
{
  "data": {
    "period": "2026-02-01 ~ 2026-02-15",
    "total_orders": 1258,
    "total_revenue": 28564.50,
    "avg_order_value": 22.70,
    "top_dishes": [
      {"id": "uuid", "name": "椰浆饭", "count": 523},
      {"id": "uuid", "name": "海南鸡饭", "count": 412}
    ],
    "top_stalls": [
      {"id": "uuid", "name": "马来风味坊", "revenue": 8540.50}
    ],
    "orders_by_hour": [12, 45, 89, 156, 234, 189, 134, 89, 45, 23, 12, 8],
    "orders_by_day": [156, 178, 189, 201, 167, 145, 123]
  }
}
```

---

#### 9.3.9 库存管理

```
GET /admin/stalls/{id}/inventory              # 库存列表
POST /admin/dishes/{id}/restock              # 批量补货
POST /admin/dishes/{id}/adjust               # 库存调整
GET /admin/inventory/logs                    # 库存变动日志
GET /admin/inventory/alerts                  # 低库存告警
```

---

### 9.4 管理后台 WebSocket

#### 订单实时推送

```json
{
  "event": "admin.new_order",
  "data": {
    "order_id": "uuid",
    "order_no": "FOOD-20260215-00001",
    "total_amount": 28.50,
    "stall_name": "马来风味坊",
    "items_count": 3,
    "created_at": "2026-02-15T10:00:00Z"
  }
}
```

#### 库存告警

```json
{
  "event": "admin.low_stock",
  "data": {
    "dish_id": "uuid",
    "dish_name": "椰浆饭",
    "stall_name": "马来风味坊",
    "remaining_stock": 5,
    "threshold": 10
  }
}
```

---

### 9.5 管理后台权限设计

| 权限 | 说明 | 平台管理员 | 食阁管理员 | 档口管理员 |
|------|------|------------|------------|------------|
| food_court.read | 查看食阁 | ✅ | ✅(所属) | ❌ |
| food_court.write | 管理食阁 | ✅ | ❌ | ❌ |
| stall.read | 查看档口 | ✅ | ✅(下属) | ✅(所属) |
| stall.write | 管理档口 | ✅ | ✅(下属) | ✅(所属) |
| dish.read | 查看菜品 | ✅ | ✅(下属) | ✅(所属) |
| dish.write | 管理菜品 | ✅ | ✅(下属) | ✅(所属) |
| order.read | 查看订单 | ✅ | ✅(下属) | ✅(所属) |
| order.write | 操作订单 | ✅ | ✅(下属) | ✅(所属) |
| settlement.read | 查看结算 | ✅ | ✅(下属) | ❌ |
| settlement.write | 结算操作 | ✅ | ✅(下属) | ❌ |
| stats.read | 查看统计 | ✅ | ✅(下属) | ✅(所属) |
| promotion.write | 管理营销 | ✅ | ✅(下属) | ❌ |
| admin.manage | 管理员管理 | ✅ | ❌ | ❌ |

---

## 十、数据模型扩展

### 10.1 国际化内容表

```sql
CREATE TABLE i18n_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,  -- dish, stall, food_court, promotion, common
  resource_id UUID,
  key VARCHAR(100) NOT NULL,
  translations JSONB NOT NULL,
  -- {
  --   "en": "Nasi Lemak",
  --   "zh-CN": "椰浆饭",
  --   "ms": "Nasi Lemak"
  -- }
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, key)
);

CREATE INDEX idx_i18n_resource ON i18n_content(resource_type, resource_id);
CREATE INDEX idx_i18n_key ON i18n_content(key);
```

### 10.2 管理员表

```sql
CREATE TABLE admin_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 账号信息
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url VARCHAR(500),
  
  -- 角色
  role VARCHAR(20) NOT NULL,  -- super_admin, food_court_admin, stall_admin
  
  -- 权限范围
  scope_type VARCHAR(20),      -- global, food_court, stall
  scope_id UUID,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_scope ON admin_user(scope_type, scope_id);
```

---

## 十一、错误码扩展

| 错误码 | 说明 |
|--------|------|
| 40301 | 无权限访问 |
| 40302 | 账户被禁用 |
| 40303 | 权限不足 |
| 40304 | 非管理员账户 |
| 40410 | 食阁不存在 |
| 40411 | 档口不存在 |
| 40412 | 菜品不存在 |
| 40901 | 资源已被使用 |

