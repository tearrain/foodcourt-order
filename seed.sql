-- ============================================================
-- 食阁扫码点单系统 - 种子数据
-- Database: Cloudflare D1 (SQLite compatible)
-- Created: 2026-02-15
-- ============================================================

-- ============================================================
-- 1. 食阁
-- ============================================================

INSERT INTO food_court (
  id, name, name_en, description, description_en, address, city,
  latitude, longitude, contact_phone, image_url, is_active, status
) VALUES (
  'fc001', 'KLCC 食阁', 'KLCC Food Court',
  '吉隆坡市中心最大美食广场，汇集马来西亚各地特色美食',
  'The largest food court in downtown Kuala Lumpur with Malaysian specialties',
  'Jalan Ampang, Kuala Lumpur', 'Kuala Lumpur',
  3.158069, 101.711549, '+60 3-1234 5678',
  'https://example.com/klcc-food-court.jpg', 1, 'active'
);

INSERT INTO food_court (
  id, name, name_en, description, description_en, address, city,
  contact_phone, is_active, status
) VALUES (
  'fc002', '武吉免登美食城', 'Pavilion Food Garden',
  '武吉免登广场美食城，汇聚国际料理',
  'Bukit Bintang food court with international cuisine',
  'Jalan Bukit Bintang, Kuala Lumpur', 'Kuala Lumpur',
  '+60 3-9876 5432', 1, 'active'
);

INSERT INTO food_court (
  id, name, name_en, description, description_en, address, city,
  contact_phone, is_active, status
) VALUES (
  'fc003', '双威金字塔美食广场', 'Sunway Pyramid Food Court',
  '双威度假区主题公园旁的美食广场',
  'Food court near Sunway Theme Park resort area',
  'Jalan Lagoon Selatan, Bandar Sunway', 'Petaling Jaya',
  '+60 3-5632 1890', 1, 'active'
);

-- ============================================================
-- 2. 档口
-- ============================================================

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url, cover_image_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's001', 'fc001', '马来风味坊', 'Malay Flavor House',
  '正宗马来西亚美食，从椰浆饭到沙嗲应有尽有',
  'Authentic Malaysian cuisine from nasi lemak to satay',
  '马来西亚菜', 'Malay', 'https://example.com/stalls/malay/logo.png',
  'https://example.com/stalls/malay/cover.jpg', 4.5, 328, 1250, 1, 1
);

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's002', 'fc001', '华粤小厨', 'Chinese Cantonese Kitchen',
  '经典粤式点心和烧腊',
  'Classic Cantonese dim sum and roasted meat',
  '粤菜', 'Cantonese', 'https://example.com/stalls/cantonese/logo.png',
  4.3, 256, 980, 1, 2
);

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's003', 'fc001', '印度咖喱屋', 'Indian Curry House',
  '正宗印度北部风味咖喱和馕饼',
  'Authentic North Indian curry and naan bread',
  '印度菜', 'Indian', 'https://example.com/stalls/indian/logo.png',
  4.4, 189, 756, 1, 3
);

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's004', 'fc001', '日本寿司台', 'Japanese Sushi Bar',
  '新鲜直送的日式寿司和刺身',
  'Fresh Japanese sushi and sashimi',
  '日本料理', 'Japanese', 'https://example.com/stalls/japanese/logo.png',
  4.7, 412, 1580, 1, 4
);

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's005', 'fc001', '韩国烤肉馆', 'Korean BBQ House',
  '正宗韩式烤肉和石锅拌饭',
  'Authentic Korean BBQ and bibimbap',
  '韩国料理', 'Korean', 'https://example.com/stalls/korean/logo.png',
  4.6, 298, 1120, 1, 5
);

-- FC002 档口
INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's006', 'fc002', '泰国东炎庄', 'Thai Tom Yum House',
  '正宗泰式冬阴功和芒果糯米饭',
  'Authentic Thai tom yum and mango sticky rice',
  '泰国菜', 'Thai', 'https://example.com/stalls/thai/logo.png',
  4.4, 245, 890, 1, 1
);

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's007', 'fc002', '越南河粉铺', 'Vietnamese Pho Shop',
  '正宗越南河粉和春卷',
  'Authentic Vietnamese pho and spring rolls',
  '越南菜', 'Vietnamese', 'https://example.com/stalls/vietnamese/logo.png',
  4.5, 312, 1100, 1, 2
);

-- FC003 档口
INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's008', 'fc003', '西式牛排屋', 'Western Steak House',
  '高品质西式牛排和意面',
  'Premium Western steaks and pasta',
  '西餐', 'Western', 'https://example.com/stalls/western/logo.png',
  4.6, 178, 650, 1, 1
);

INSERT INTO stall (
  id, food_court_id, name, name_en, description, description_en,
  cuisine_type, cuisine_type_en, logo_url,
  avg_rating, total_reviews, total_orders, is_active, sort_order
) VALUES (
  's009', 'fc003', '港式茶餐厅', 'HK Tea Restaurant',
  '港式奶茶、菠萝包和西多士',
  'Hong Kong style milk tea, pineapple bun and French toast',
  '港式', 'HK Style', 'https://example.com/stalls/hk/logo.png',
  4.3, 234, 890, 1, 2
);

-- ============================================================
-- 3. 菜品分类
-- ============================================================

INSERT INTO dish_category (id, stall_id, name, name_en, sort_order) VALUES
('cat001', 's001', '招牌主食', 'Signature Mains', 1),
('cat002', 's001', '特色小食', 'Signature Snacks', 2),
('cat003', 's001', '饮品', 'Beverages', 3),
('cat004', 's002', '点心', 'Dim Sum', 1),
('cat005', 's002', '烧腊', 'Roasted Meat', 2),
('cat006', 's002', '粥品', 'Congee', 3),
('cat007', 's003', '咖喱', 'Curry', 1),
('cat008', 's003', '馕饼', 'Naan Bread', 2),
('cat009', 's004', '寿司套餐', 'Sushi Sets', 1),
('cat010', 's004', '刺身', 'Sashimi', 2),
('cat011', 's005', '烤肉', 'BBQ', 1),
('cat012', 's005', '拌饭', 'Rice Bowls', 2);

-- ============================================================
-- 4. 菜品
-- ============================================================

-- 马来风味坊菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, original_price, image_url, unit,
  is_spicy, spicy_level, is_vegetarian, is_recommended,
  avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd001', 's001', 'cat001', '椰浆饭', 'Nasi Lemak',
  '马来西亚国菜，椰浆饭配 sambal 虾',
  'Malaysia national dish with coconut rice and sambal shrimp',
  12.90, 15.00, 'https://example.com/dishes/nasi-lemak.jpg', '份',
  1, 2, 0, 1, 4.6, 580, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit,
  is_spicy, is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd002', 's001', 'cat001', '沙嗲串', 'Satay Skewers',
  '10串沙嗲配花生酱',
  '10 satay skewers with peanut sauce',
  15.90, 'https://example.com/dishes/satay.jpg', '份',
  0, 1, 4.5, 420, 1, 'active', 2
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_vegetarian, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd003', 's001', 'cat002', '炸香蕉', 'Fried Banana',
  '香脆可口的马来炸香蕉',
  'Crispy and tasty Malaysian fried banana',
  5.00, 'https://example.com/dishes/banana-fritter.jpg', '份',
  1, 4.2, 320, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd004', 's001', 'cat003', '拉茶', 'Teh Tarik',
  '正宗马来拉茶',
  'Authentic Malaysian pulled tea',
  3.50, 'https://example.com/dishes/teh-tarik.jpg', '杯',
  4.4, 680, 1, 'active', 1
);

-- 华粤小厨菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, original_price, image_url, unit,
  is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd005', 's002', 'cat004', '虾饺', 'Shrimp Dumplings',
  '传统粤式虾饺，3只',
  'Traditional Cantonese shrimp dumplings, 3pcs',
  8.90, 10.90, 'https://example.com/dishes/shrimp-dumpling.jpg', '份',
  1, 4.7, 450, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd006', 's002', 'cat004', '叉烧包', 'Char Siu Bao',
  '蜜汁叉烧包，2只',
  'Honey glaze BBQ pork buns, 2pcs',
  7.50, 'https://example.com/dishes/char-siu-bao.jpg', '份',
  4.5, 380, 1, 'active', 2
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd007', 's002', 'cat005', '烧鸭饭', 'Roasted Duck Rice',
  '秘制烧鸭配米饭',
  'Special roasted duck with rice',
  14.90, 'https://example.com/dishes/roasted-duck.jpg', '份',
  4.6, 290, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd008', 's002', 'cat006', '皮蛋瘦肉粥', 'Century Egg Congee',
  '传统广式皮蛋瘦肉粥',
  'Traditional Cantonese century egg and pork congee',
  9.90, 'https://example.com/dishes/congee.jpg', '份',
  4.4, 220, 1, 'active', 1
);

-- 印度咖喱屋菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_spicy, spicy_level, is_vegetarian, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd009', 's003', 'cat007', '黄油咖喱鸡', 'Butter Chicken Curry',
  '浓郁奶油咖喱鸡配香米饭',
  'Rich butter chicken curry with fragrant rice',
  13.90, 'https://example.com/dishes/butter-chicken.jpg', '份',
  1, 2, 0, 4.5, 310, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_spicy, spicy_level, is_vegetarian, is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd010', 's003', 'cat007', '玛萨拉羊肉', 'Mutton Masala',
  '香辣羊肉玛萨拉咖喱',
  'Spicy mutton masala curry',
  16.90, 'https://example.com/dishes/mutton-masala.jpg', '份',
  1, 4, 0, 1, 4.6, 180, 1, 'active', 2
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_vegetarian, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd011', 's003', 'cat008', '蒜香馕', 'Garlic Naan',
  '手工制作的蒜香烤馕',
  'Handmade garlic roasted naan bread',
  4.50, 'https://example.com/dishes/garlic-naan.jpg', '份',
  1, 4.4, 420, 1, 'active', 1
);

-- 日本寿司台菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, original_price, image_url, unit,
  is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd012', 's004', 'cat009', '三文鱼寿司套餐', 'Salmon Sushi Set',
  '8贯三文鱼寿司配味增汤',
  '8 pieces salmon sushi with miso soup',
  22.90, 28.90, 'https://example.com/dishes/salmon-sushi.jpg', '份',
  1, 4.8, 520, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd013', 's004', 'cat010', '刺身拼盘', 'Sashimi Platter',
  '三文鱼、金枪鱼、北极贝刺身拼盘',
  'Salmon, tuna, and arctic scallop sashimi platter',
  35.90, 'https://example.com/dishes/sashimi-platter.jpg', '份',
  4.9, 280, 1, 'active', 1
);

-- 韩国烤肉馆菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, original_price, image_url, unit,
  is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd014', 's005', 'cat011', '五花肉烤肉套餐', 'Pork Belly BBQ Set',
  '韩式腌制五花肉配生菜蒜片辣椒',
  'Marinated Korean pork belly with lettuce garlic chili',
  24.90, 29.90, 'https://example.com/dishes/pork-belly-bbq.jpg', '份',
  1, 4.7, 450, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd015', 's005', 'cat012', '石锅拌饭', 'Bibimbap',
  '传统韩式石锅拌饭配各种蔬菜',
  'Traditional Korean stone pot rice with vegetables',
  15.90, 'https://example.com/dishes/bibimbap.jpg', '份',
  1, 4.5, 380, 1, 'active', 1
);

-- 泰国东炎庄菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_spicy, spicy_level, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd016', 's006', NULL, '冬阴功汤', 'Tom Yum Soup',
  '泰式酸辣虾汤',
  'Thai spicy and sour shrimp soup',
  12.90, 'https://example.com/dishes/tom-yum.jpg', '份',
  1, 3, 4.6, 320, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd017', 's006', NULL, '芒果糯米饭', 'Mango Sticky Rice',
  '泰式香甜芒果配椰浆糯米饭',
  'Thai sweet mango with coconut sticky rice',
  8.90, 'https://example.com/dishes/mango-sticky-rice.jpg', '份',
  4.7, 280, 1, 'active', 2
);

-- 越南河粉铺菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd018', 's007', NULL, '火车头河粉', 'Pho Bo Vien',
  '越式牛肉河粉，配九层塔豆芽',
  'Vietnamese beef pho with basil bean sprouts',
  14.90, 'https://example.com/dishes/pho-bo.jpg', '份',
  4.5, 420, 1, 'active', 1
);

-- 西式牛排屋菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, original_price, image_url, unit,
  is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd019', 's008', NULL, '菲力牛排', 'Filet Mignon',
  '7盎司澳洲和牛菲力牛排配薯条',
  '7oz Australian Wagyu filet mignon with fries',
  38.90, 48.90, 'https://example.com/dishes/filet-mignon.jpg', '份',
  1, 4.8, 180, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd020', 's008', NULL, '意大利肉酱面', 'Spaghetti Bolognese',
  '经典意大利肉酱意面',
  'Classic Italian bolognese pasta',
  16.90, 'https://example.com/dishes/spaghetti-bolognese.jpg', '份',
  4.4, 260, 1, 'active', 2
);

-- 港式茶餐厅菜品
INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, is_recommended, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd021', 's009', NULL, '港式奶茶', 'Hong Kong Milk Tea',
  '正宗丝袜奶茶',
  'Authentic Hong Kong style milk tea',
  5.90, 'https://example.com/dishes/hk-milk-tea.jpg', '杯',
  1, 4.6, 520, 1, 'active', 1
);

INSERT INTO dish (
  id, stall_id, category_id, name, name_en, description, description_en,
  price, image_url, unit, avg_rating, total_sold, is_available, status, sort_order
) VALUES (
  'd022', 's009', NULL, '菠萝包', 'Pineapple Bun',
  '经典港式菠萝包配牛油',
  'Classic Hong Kong pineapple bun with butter',
  6.90, 'https://example.com/dishes/pineapple-bun.jpg', '份',
  4.5, 380, 1, 'active', 2
);

-- ============================================================
-- 5. 优惠券
-- ============================================================

INSERT INTO coupon (id, code, name, description, discount_type, discount_value, min_order_amount, usage_limit, valid_from, valid_until, is_active) VALUES
('cp001', 'WELCOME10', '新用户立减', '首次下单立减10%', 'percentage', 10, 20, 1000, '2024-01-01', '2025-12-31', 1),
('cp002', 'FIRST5', '首单优惠', '首单立减5马币', 'fixed', 5, 15, NULL, '2024-01-01', '2025-12-31', 1),
('cp003', 'FREEDELIVERY', '免配送费', '订单满30马币免配送费', 'fixed', 5, 30, 500, '2024-01-01', '2025-12-31', 1);

-- ============================================================
-- 6. 系统配置
-- ============================================================

INSERT OR REPLACE INTO system_config (id, config_key, config_value, description) VALUES
('1', 'supported_languages', 'en,zh-CN,zh-TW,ms,id,th,ja,ko', '支持的语言列表'),
('2', 'default_language', 'zh-CN', '默认语言'),
('3', 'tax_rate', '0.06', '默认税率'),
('4', 'delivery_fee_base', '2.00', '基础配送费'),
('5', 'min_order_amount', '5.00', '起送金额'),
('6', 'platform_commission_rate', '0.10', '平台佣金比例'),
('7', 'cart_expiry_hours', '24', '购物车过期时间（小时）');
