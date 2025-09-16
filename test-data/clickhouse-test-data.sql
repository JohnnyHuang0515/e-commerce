-- ClickHouse 電商系統測試資料
-- 擴展現有初始化腳本的測試資料

-- 切換到分析資料庫
USE ecommerce_analytics;

-- ==============================================
-- 擴展用戶行為事件資料
-- ==============================================

INSERT INTO user_behavior_events VALUES
-- 美妝保養相關事件
('2024-01-02', '2024-01-02 09:00:00', 4, 'sess_004', 'view', 6, 6, '/products/6', 'google.com', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 200, '{"page_title": "SK-II 青春露", "category": "beauty"}'),
('2024-01-02', '2024-01-02 09:02:00', 4, 'sess_004', 'click', 6, 6, '/products/6', '/products/6', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 8, '{"button": "add_to_cart", "position": "top"}'),
('2024-01-02', '2024-01-02 09:05:00', 4, 'sess_004', 'add_to_cart', 6, 6, '/cart', '/products/6', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 45, '{"quantity": 1}'),
('2024-01-02', '2024-01-02 09:10:00', 4, 'sess_004', 'view', 7, 6, '/products/7', '/products/6', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 150, '{"page_title": "蘭蔻小黑瓶精華"}'),
('2024-01-02', '2024-01-02 09:12:00', 4, 'sess_004', 'wishlist_add', 7, 6, '/products/7', '/products/7', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 20, '{"source": "product_page"}'),

-- 食品飲料相關事件
('2024-01-02', '2024-01-02 10:00:00', 5, 'sess_005', 'view', 11, 7, '/products/11', 'facebook.com', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', 180, '{"page_title": "日本進口零食禮盒"}'),
('2024-01-02', '2024-01-02 10:03:00', 5, 'sess_005', 'click', 11, 7, '/products/11', '/products/11', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', 12, '{"button": "buy_now", "position": "bottom"}'),
('2024-01-02', '2024-01-02 10:05:00', 5, 'sess_005', 'purchase', 11, 7, '/checkout', '/products/11', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', 300, '{"order_id": 1004}'),
('2024-01-02', '2024-01-02 10:10:00', 5, 'sess_005', 'view', 12, 7, '/products/12', '/products/11', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', 120, '{"page_title": "台灣高山茶葉"}'),

-- 寵物用品相關事件
('2024-01-02', '2024-01-02 11:00:00', 6, 'sess_006', 'search', NULL, NULL, '/search', 'google.com', 'tablet', 'Chrome', 'Android', 'Taiwan', 'Taichung', 60, '{"query": "狗糧", "results_count": 8}'),
('2024-01-02', '2024-01-02 11:01:00', 6, 'sess_006', 'view', 14, 8, '/products/14', '/search', 'tablet', 'Chrome', 'Android', 'Taiwan', 'Taichung', 90, '{"page_title": "皇家狗糧"}'),
('2024-01-02', '2024-01-02 11:03:00', 6, 'sess_006', 'click', 14, 8, '/products/14', '/products/14', 'tablet', 'Chrome', 'Android', 'Taiwan', 'Taichung', 15, '{"button": "add_to_cart"}'),
('2024-01-02', '2024-01-02 11:05:00', 6, 'sess_006', 'add_to_cart', 14, 8, '/cart', '/products/14', 'tablet', 'Chrome', 'Android', 'Taiwan', 'Taichung', 35, '{"quantity": 1}'),

-- 汽車用品相關事件
('2024-01-02', '2024-01-02 12:00:00', 7, 'sess_007', 'view', 18, 9, '/products/18', 'yahoo.com', 'desktop', 'Firefox', 'Windows', 'Taiwan', 'Tainan', 220, '{"page_title": "汽車行車記錄器"}'),
('2024-01-02', '2024-01-02 12:03:00', 7, 'sess_007', 'click', 18, 9, '/products/18', '/products/18', 'desktop', 'Firefox', 'Windows', 'Taiwan', 'Tainan', 10, '{"button": "compare", "position": "middle"}'),
('2024-01-02', '2024-01-02 12:05:00', 7, 'sess_007', 'purchase', 18, 9, '/checkout', '/products/18', 'desktop', 'Firefox', 'Windows', 'Taiwan', 'Tainan', 280, '{"order_id": 1005}'),

-- 戶外運動相關事件
('2024-01-02', '2024-01-02 13:00:00', 8, 'sess_008', 'view', 22, 10, '/products/22', 'instagram.com', 'mobile', 'Chrome', 'Android', 'Taiwan', 'Taoyuan', 160, '{"page_title": "登山背包"}'),
('2024-01-02', '2024-01-02 13:02:00', 8, 'sess_008', 'click', 22, 10, '/products/22', '/products/22', 'mobile', 'Chrome', 'Android', 'Taiwan', 'Taoyuan', 8, '{"button": "add_to_cart"}'),
('2024-01-02', '2024-01-02 13:04:00', 8, 'sess_008', 'add_to_cart', 22, 10, '/cart', '/products/22', 'mobile', 'Chrome', 'Android', 'Taiwan', 'Taoyuan', 40, '{"quantity": 1}'),
('2024-01-02', '2024-01-02 13:06:00', 8, 'sess_008', 'view', 23, 10, '/products/23', '/products/22', 'mobile', 'Chrome', 'Android', 'Taiwan', 'Taoyuan', 140, '{"page_title": "露營帳篷"}');

-- ==============================================
-- 擴展銷售數據資料
-- ==============================================

INSERT INTO sales_data VALUES
-- 美妝保養銷售
('2024-01-02', '2024-01-02 09:15:00', 1004, 4, 6, 6, 1, 4500.00, 4500.00, 675.00, 'credit_card', 'home_delivery', 'Taiwan', 'Taipei', '35-44', 'F'),
('2024-01-02', '2024-01-02 10:30:00', 1005, 5, 7, 6, 1, 3200.00, 3200.00, 0.00, 'credit_card', 'convenience_store', 'Taiwan', 'Kaohsiung', '25-34', 'F'),
('2024-01-02', '2024-01-02 11:45:00', 1006, 6, 8, 6, 2, 2800.00, 5600.00, 840.00, 'bank_transfer', 'home_delivery', 'Taiwan', 'Taichung', '18-24', 'F'),

-- 食品飲料銷售
('2024-01-02', '2024-01-02 10:05:00', 1007, 5, 11, 7, 1, 1200.00, 1200.00, 0.00, 'convenience_store', 'convenience_store', 'Taiwan', 'Kaohsiung', '25-34', 'F'),
('2024-01-02', '2024-01-02 12:15:00', 1008, 7, 12, 7, 1, 800.00, 800.00, 80.00, 'credit_card', 'post_office', 'Taiwan', 'Tainan', '35-44', 'M'),
('2024-01-02', '2024-01-02 14:30:00', 1009, 8, 13, 7, 3, 450.00, 1350.00, 135.00, 'digital_wallet', 'home_delivery', 'Taiwan', 'Taoyuan', '25-34', 'M'),

-- 寵物用品銷售
('2024-01-02', '2024-01-02 11:10:00', 1010, 6, 14, 8, 1, 1200.00, 1200.00, 0.00, 'credit_card', 'convenience_store', 'Taiwan', 'Taichung', '18-24', 'F'),
('2024-01-02', '2024-01-02 15:20:00', 1011, 9, 15, 8, 2, 350.00, 700.00, 70.00, 'bank_transfer', 'home_delivery', 'Taiwan', 'Hsinchu', '25-34', 'M'),
('2024-01-02', '2024-01-02 16:45:00', 1012, 10, 16, 8, 1, 800.00, 800.00, 0.00, 'credit_card', 'post_office', 'Taiwan', 'Keelung', '35-44', 'F'),

-- 汽車用品銷售
('2024-01-02', '2024-01-02 12:10:00', 1013, 7, 18, 9, 1, 2500.00, 2500.00, 250.00, 'credit_card', 'home_delivery', 'Taiwan', 'Tainan', '35-44', 'M'),
('2024-01-02', '2024-01-02 17:30:00', 1014, 11, 19, 9, 1, 450.00, 450.00, 0.00, 'convenience_store', 'convenience_store', 'Taiwan', 'Chiayi', '25-34', 'M'),

-- 戶外運動銷售
('2024-01-02', '2024-01-02 13:10:00', 1015, 8, 22, 10, 1, 1800.00, 1800.00, 180.00, 'credit_card', 'home_delivery', 'Taiwan', 'Taoyuan', '25-34', 'M'),
('2024-01-02', '2024-01-02 18:00:00', 1016, 12, 23, 10, 1, 3500.00, 3500.00, 350.00, 'bank_transfer', 'home_delivery', 'Taiwan', 'Yilan', '35-44', 'M');

-- ==============================================
-- 擴展商品表現數據資料
-- ==============================================

INSERT INTO product_performance VALUES
-- 美妝保養商品表現
('2024-01-02', 6, 6, 200, 60, 25, 5, 22500.00, 0.25, 180, 0.15),
('2024-01-02', 7, 6, 150, 45, 20, 4, 12800.00, 0.27, 160, 0.18),
('2024-01-02', 8, 6, 180, 55, 30, 6, 16800.00, 0.33, 140, 0.12),
('2024-01-02', 9, 6, 120, 35, 15, 3, 2550.00, 0.25, 120, 0.20),
('2024-01-02', 10, 6, 100, 30, 12, 2, 4400.00, 0.20, 110, 0.22),

-- 食品飲料商品表現
('2024-01-02', 11, 7, 250, 75, 40, 8, 9600.00, 0.32, 130, 0.10),
('2024-01-02', 12, 7, 180, 50, 25, 5, 4000.00, 0.28, 125, 0.15),
('2024-01-02', 13, 7, 200, 60, 35, 7, 3150.00, 0.35, 115, 0.12),

-- 寵物用品商品表現
('2024-01-02', 14, 8, 300, 90, 50, 10, 12000.00, 0.33, 100, 0.08),
('2024-01-02', 15, 8, 220, 65, 35, 7, 2450.00, 0.32, 95, 0.10),
('2024-01-02', 16, 8, 150, 40, 20, 4, 3200.00, 0.27, 105, 0.15),

-- 汽車用品商品表現
('2024-01-02', 18, 9, 120, 35, 18, 3, 7500.00, 0.30, 200, 0.12),
('2024-01-02', 19, 9, 100, 25, 12, 2, 900.00, 0.24, 180, 0.18),

-- 戶外運動商品表現
('2024-01-02', 22, 10, 160, 45, 25, 5, 9000.00, 0.31, 150, 0.10),
('2024-01-02', 23, 10, 140, 40, 20, 4, 14000.00, 0.29, 160, 0.12);

-- ==============================================
-- 擴展用戶分析資料
-- ==============================================

INSERT INTO user_analytics VALUES
-- 美妝保養用戶
('2024-01-02', 4, '35-44', 'F', 'Taiwan', 'Taipei', 5, 25, 2400, 3, 13500.00, 4500.00, '2024-01-02', 60, 0.05),
('2024-01-02', 5, '25-34', 'F', 'Taiwan', 'Kaohsiung', 4, 20, 1800, 2, 6400.00, 3200.00, '2024-01-02', 45, 0.08),
('2024-01-02', 6, '18-24', 'F', 'Taiwan', 'Taichung', 3, 15, 1200, 2, 5600.00, 2800.00, '2024-01-02', 30, 0.12),

-- 食品飲料用戶
('2024-01-02', 7, '35-44', 'M', 'Taiwan', 'Tainan', 2, 10, 800, 1, 800.00, 800.00, '2024-01-02', 20, 0.15),
('2024-01-02', 8, '25-34', 'M', 'Taiwan', 'Taoyuan', 3, 18, 1500, 2, 3150.00, 1575.00, '2024-01-02', 35, 0.10),

-- 寵物用品用戶
('2024-01-02', 9, '25-34', 'M', 'Taiwan', 'Hsinchu', 2, 12, 900, 1, 700.00, 700.00, '2024-01-02', 25, 0.18),
('2024-01-02', 10, '35-44', 'F', 'Taiwan', 'Keelung', 1, 8, 600, 1, 800.00, 800.00, '2024-01-02', 15, 0.20),

-- 汽車用品用戶
('2024-01-02', 11, '25-34', 'M', 'Taiwan', 'Chiayi', 1, 6, 500, 1, 450.00, 450.00, '2024-01-02', 10, 0.25),

-- 戶外運動用戶
('2024-01-02', 12, '35-44', 'M', 'Taiwan', 'Yilan', 2, 14, 1200, 1, 3500.00, 3500.00, '2024-01-02', 40, 0.08);

-- ==============================================
-- 擴展行銷活動資料
-- ==============================================

INSERT INTO marketing_campaigns VALUES
(4, '美妝週特惠', 'discount', '2024-01-01', '2024-01-07', 50000.00, 'beauty_lovers', 'active', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(5, '食品節促銷', 'seasonal', '2024-01-15', '2024-01-31', 30000.00, 'food_enthusiasts', 'active', '2024-01-15 00:00:00', '2024-01-15 00:00:00'),
(6, '寵物用品月', 'product_launch', '2024-02-01', '2024-02-29', 40000.00, 'pet_owners', 'planned', '2024-01-20 00:00:00', '2024-01-20 00:00:00'),
(7, '汽車配件展', 'exhibition', '2024-03-01', '2024-03-15', 60000.00, 'car_enthusiasts', 'planned', '2024-02-15 00:00:00', '2024-02-15 00:00:00'),
(8, '戶外運動季', 'seasonal', '2024-04-01', '2024-04-30', 45000.00, 'outdoor_lovers', 'planned', '2024-03-15 00:00:00', '2024-03-15 00:00:00');

-- ==============================================
-- 擴展行銷效果資料
-- ==============================================

INSERT INTO marketing_effectiveness VALUES
-- 美妝週特惠效果
('2024-01-02', 4, 15000, 750, 75, 75000.00, 7500.00, 0.05, 0.10, 10.00),
('2024-01-02', 4, 18000, 900, 90, 90000.00, 9000.00, 0.05, 0.10, 10.00),

-- 食品節促銷效果
('2024-01-02', 5, 8000, 400, 40, 40000.00, 4000.00, 0.05, 0.10, 10.00),
('2024-01-02', 5, 10000, 500, 50, 50000.00, 5000.00, 0.05, 0.10, 10.00),

-- 寵物用品月效果
('2024-01-02', 6, 6000, 300, 30, 30000.00, 3000.00, 0.05, 0.10, 10.00),
('2024-01-02', 6, 7000, 350, 35, 35000.00, 3500.00, 0.05, 0.10, 10.00),

-- 汽車配件展效果
('2024-01-02', 7, 5000, 250, 25, 25000.00, 2500.00, 0.05, 0.10, 10.00),
('2024-01-02', 7, 6000, 300, 30, 30000.00, 3000.00, 0.05, 0.10, 10.00),

-- 戶外運動季效果
('2024-01-02', 8, 4000, 200, 20, 20000.00, 2000.00, 0.05, 0.10, 10.00),
('2024-01-02', 8, 5000, 250, 25, 25000.00, 2500.00, 0.05, 0.10, 10.00);

-- ==============================================
-- 擴展庫存分析資料
-- ==============================================

INSERT INTO inventory_analytics VALUES
-- 美妝保養庫存
('2024-01-02', 6, 6, 50, 5, 0, 45, 0.10, 1, 0),
('2024-01-02', 7, 6, 40, 4, 0, 36, 0.10, 1, 0),
('2024-01-02', 8, 6, 60, 6, 1, 53, 0.10, 1, 0),
('2024-01-02', 9, 6, 80, 3, 0, 77, 0.038, 1, 0),
('2024-01-02', 10, 6, 70, 2, 0, 68, 0.029, 1, 0),

-- 食品飲料庫存
('2024-01-02', 11, 7, 100, 8, 0, 92, 0.08, 1, 0),
('2024-01-02', 12, 7, 80, 5, 0, 75, 0.063, 1, 0),
('2024-01-02', 13, 7, 120, 7, 0, 113, 0.058, 1, 0),

-- 寵物用品庫存
('2024-01-02', 14, 8, 200, 10, 0, 190, 0.05, 1, 0),
('2024-01-02', 15, 8, 150, 7, 0, 143, 0.047, 1, 0),
('2024-01-02', 16, 8, 100, 4, 0, 96, 0.04, 1, 0),

-- 汽車用品庫存
('2024-01-02', 18, 9, 50, 3, 0, 47, 0.06, 1, 0),
('2024-01-02', 19, 9, 80, 2, 0, 78, 0.025, 1, 0),

-- 戶外運動庫存
('2024-01-02', 22, 10, 60, 5, 0, 55, 0.083, 1, 0),
('2024-01-02', 23, 10, 40, 4, 0, 36, 0.10, 1, 0);

-- ==============================================
-- 擴展支付分析資料
-- ==============================================

INSERT INTO payment_analytics VALUES
-- 美妝保養支付
('2024-01-02', 'credit_card', 'Taiwan', 8, 22500.00, 2812.50, 1.00, 0, 2),
('2024-01-02', 'bank_transfer', 'Taiwan', 2, 5600.00, 2800.00, 1.00, 0, 5),
('2024-01-02', 'convenience_store', 'Taiwan', 1, 1200.00, 1200.00, 1.00, 0, 1),

-- 食品飲料支付
('2024-01-02', 'credit_card', 'Taiwan', 3, 4000.00, 1333.33, 1.00, 0, 2),
('2024-01-02', 'convenience_store', 'Taiwan', 1, 1200.00, 1200.00, 1.00, 0, 1),
('2024-01-02', 'digital_wallet', 'Taiwan', 1, 1350.00, 1350.00, 1.00, 0, 1),

-- 寵物用品支付
('2024-01-02', 'credit_card', 'Taiwan', 2, 2000.00, 1000.00, 1.00, 0, 2),
('2024-01-02', 'bank_transfer', 'Taiwan', 1, 700.00, 700.00, 1.00, 0, 5),

-- 汽車用品支付
('2024-01-02', 'credit_card', 'Taiwan', 2, 2950.00, 1475.00, 1.00, 0, 2),

-- 戶外運動支付
('2024-01-02', 'credit_card', 'Taiwan', 1, 1800.00, 1800.00, 1.00, 0, 2),
('2024-01-02', 'bank_transfer', 'Taiwan', 1, 3500.00, 3500.00, 1.00, 0, 5);

-- ==============================================
-- 擴展物流分析資料
-- ==============================================

INSERT INTO logistics_analytics VALUES
-- 美妝保養物流
('2024-01-02', 'home_delivery', 'Taiwan', 'Taipei', 3, 2, 1.00, 150.00, 4.5),
('2024-01-02', 'convenience_store', 'Taiwan', 'Kaohsiung', 2, 1, 1.00, 120.00, 4.8),
('2024-01-02', 'post_office', 'Taiwan', 'Taichung', 1, 3, 1.00, 100.00, 4.2),

-- 食品飲料物流
('2024-01-02', 'convenience_store', 'Taiwan', 'Kaohsiung', 1, 1, 1.00, 60.00, 4.8),
('2024-01-02', 'post_office', 'Taiwan', 'Tainan', 1, 3, 1.00, 50.00, 4.5),
('2024-01-02', 'home_delivery', 'Taiwan', 'Taoyuan', 1, 2, 1.00, 80.00, 4.3),

-- 寵物用品物流
('2024-01-02', 'convenience_store', 'Taiwan', 'Taichung', 1, 1, 1.00, 60.00, 4.8),
('2024-01-02', 'home_delivery', 'Taiwan', 'Hsinchu', 1, 2, 1.00, 80.00, 4.3),
('2024-01-02', 'post_office', 'Taiwan', 'Keelung', 1, 3, 1.00, 50.00, 4.5),

-- 汽車用品物流
('2024-01-02', 'home_delivery', 'Taiwan', 'Tainan', 1, 2, 1.00, 80.00, 4.3),
('2024-01-02', 'convenience_store', 'Taiwan', 'Chiayi', 1, 1, 1.00, 60.00, 4.8),

-- 戶外運動物流
('2024-01-02', 'home_delivery', 'Taiwan', 'Taoyuan', 1, 2, 1.00, 80.00, 4.3),
('2024-01-02', 'home_delivery', 'Taiwan', 'Yilan', 1, 2, 1.00, 80.00, 4.3);

-- ==============================================
-- 建立擴展分析視圖
-- ==============================================

-- 建立商品類別銷售摘要視圖
CREATE MATERIALIZED VIEW IF NOT EXISTS category_sales_summary_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, category_id)
AS SELECT
    toDate(order_date) as date,
    category_id,
    count() as order_count,
    sum(quantity) as total_quantity,
    sum(total_amount) as total_revenue,
    sum(discount_amount) as total_discount,
    avg(total_amount) as avg_order_value,
    uniqExact(user_id) as unique_customers
FROM sales_data
GROUP BY date, category_id;

-- 建立用戶行為分析視圖
CREATE MATERIALIZED VIEW IF NOT EXISTS user_behavior_analysis_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_type, category_id)
AS SELECT
    toDate(event_date) as date,
    event_type,
    category_id,
    count() as event_count,
    uniqExact(user_id) as unique_users,
    uniqExact(session_id) as unique_sessions,
    avg(duration) as avg_duration
FROM user_behavior_events
WHERE category_id IS NOT NULL
GROUP BY date, event_type, category_id;

-- 建立商品表現分析視圖
CREATE MATERIALIZED VIEW IF NOT EXISTS product_performance_analysis_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, category_id)
AS SELECT
    date,
    category_id,
    sum(views) as total_views,
    sum(clicks) as total_clicks,
    sum(add_to_cart) as total_add_to_cart,
    sum(purchases) as total_purchases,
    sum(revenue) as total_revenue,
    avg(conversion_rate) as avg_conversion_rate,
    avg(bounce_rate) as avg_bounce_rate,
    count() as product_count
FROM product_performance
GROUP BY date, category_id;

-- ==============================================
-- 建立擴展分析函數
-- ==============================================

-- 建立商品類別銷售趨勢函數
CREATE OR REPLACE FUNCTION get_category_sales_trend(start_date Date, end_date Date, category_id UInt64)
RETURNS TABLE (
    date Date,
    total_revenue Decimal(12,2),
    order_count UInt32,
    avg_order_value Decimal(10,2),
    unique_customers UInt32
) AS $$
SELECT
    toDate(order_date) as date,
    sum(total_amount) as total_revenue,
    count() as order_count,
    avg(total_amount) as avg_order_value,
    uniqExact(user_id) as unique_customers
FROM sales_data
WHERE order_date >= start_date AND order_date <= end_date AND category_id = category_id
GROUP BY date
ORDER BY date
$$;

-- 建立用戶行為分析函數
CREATE OR REPLACE FUNCTION get_user_behavior_by_category(start_date Date, end_date Date, category_id UInt64)
RETURNS TABLE (
    event_type String,
    event_count UInt64,
    unique_users UInt64,
    avg_duration Float32,
    conversion_rate Float32
) AS $$
SELECT
    event_type,
    count() as event_count,
    uniqExact(user_id) as unique_users,
    avg(duration) as avg_duration,
    countIf(event_type = 'purchase') / countIf(event_type = 'view') as conversion_rate
FROM user_behavior_events
WHERE event_date >= start_date AND event_date <= end_date AND category_id = category_id
GROUP BY event_type
ORDER BY event_count DESC
$$;

-- 建立商品表現分析函數
CREATE OR REPLACE FUNCTION get_product_performance_by_category(start_date Date, end_date Date, category_id UInt64)
RETURNS TABLE (
    product_id UInt64,
    total_views UInt32,
    total_clicks UInt32,
    total_purchases UInt32,
    total_revenue Decimal(12,2),
    conversion_rate Float32,
    avg_session_duration UInt32
) AS $$
SELECT
    product_id,
    sum(views) as total_views,
    sum(clicks) as total_clicks,
    sum(purchases) as total_purchases,
    sum(revenue) as total_revenue,
    sum(purchases) / sum(views) as conversion_rate,
    avg(avg_session_duration) as avg_session_duration
FROM product_performance
WHERE date >= start_date AND date <= end_date AND category_id = category_id
GROUP BY product_id
ORDER BY total_revenue DESC
$$;

-- ==============================================
-- 完成測試資料插入
-- ==============================================

SELECT 'ClickHouse 擴展測試資料插入完成！' as message;
SELECT '已插入擴展的測試資料' as status;
SELECT '新增資料類型:' as new_data_types;
SELECT '- 擴展用戶行為事件 (美妝、食品、寵物、汽車、戶外運動)' as type1;
SELECT '- 擴展銷售數據 (各類別商品銷售)' as type2;
SELECT '- 擴展商品表現數據 (各類別商品表現)' as type3;
SELECT '- 擴展用戶分析 (各類別用戶行為)' as type4;
SELECT '- 擴展行銷活動與效果 (各類別行銷數據)' as type5;
SELECT '- 擴展庫存分析 (各類別庫存狀況)' as type6;
SELECT '- 擴展支付分析 (各類別支付方式)' as type7;
SELECT '- 擴展物流分析 (各類別物流狀況)' as type8;
SELECT '- 新增分析視圖與函數' as type9;
