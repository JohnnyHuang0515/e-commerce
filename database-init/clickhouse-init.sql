-- ClickHouse 電商系統初始化腳本
-- 數據倉儲與分析：用戶行為、銷售報表、行銷數據

-- 建立資料庫
CREATE DATABASE IF NOT EXISTS ecommerce_analytics;

USE ecommerce_analytics;

-- ==============================================
-- 8.1 用戶行為事件表
-- ==============================================

CREATE TABLE IF NOT EXISTS user_behavior_events (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    session_id String,
    event_type String,
    product_id Nullable(UInt64),
    category_id Nullable(UInt64),
    page_url String,
    referrer String,
    device_type String,
    browser String,
    os String,
    country String,
    city String,
    duration UInt32, -- 停留時間（秒）
    metadata String -- JSON 格式的額外資料
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_time, user_id)
SETTINGS index_granularity = 8192;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior_events (user_id) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_user_behavior_event_type ON user_behavior_events (event_type) TYPE set(100) GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_user_behavior_product_id ON user_behavior_events (product_id) TYPE minmax GRANULARITY 1;

-- ==============================================
-- 8.2 銷售數據表
-- ==============================================

CREATE TABLE IF NOT EXISTS sales_data (
    order_date Date,
    order_time DateTime,
    order_id UInt64,
    user_id UInt64,
    product_id UInt64,
    category_id UInt64,
    quantity UInt32,
    unit_price Decimal(10,2),
    total_amount Decimal(10,2),
    discount_amount Decimal(10,2),
    payment_method String,
    shipping_method String,
    country String,
    city String,
    age_group String,
    gender String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, order_time, order_id)
SETTINGS index_granularity = 8192;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales_data (user_id) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales_data (product_id) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_sales_category_id ON sales_data (category_id) TYPE minmax GRANULARITY 1;

-- ==============================================
-- 8.3 商品表現數據表
-- ==============================================

CREATE TABLE IF NOT EXISTS product_performance (
    date Date,
    product_id UInt64,
    category_id UInt64,
    views UInt32,
    clicks UInt32,
    add_to_cart UInt32,
    purchases UInt32,
    revenue Decimal(12,2),
    conversion_rate Float32,
    avg_session_duration UInt32,
    bounce_rate Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, product_id)
SETTINGS index_granularity = 8192;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_product_perf_product_id ON product_performance (product_id) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_product_perf_category_id ON product_performance (category_id) TYPE minmax GRANULARITY 1;

-- ==============================================
-- 8.4 用戶分析表
-- ==============================================

CREATE TABLE IF NOT EXISTS user_analytics (
    date Date,
    user_id UInt64,
    age_group String,
    gender String,
    country String,
    city String,
    total_sessions UInt32,
    total_page_views UInt32,
    total_duration UInt32,
    total_orders UInt32,
    total_spent Decimal(12,2),
    avg_order_value Decimal(10,2),
    last_active_date Date,
    user_lifetime_days UInt32,
    churn_probability Float32
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id)
SETTINGS index_granularity = 8192;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics (user_id) TYPE minmax GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_user_analytics_age_group ON user_analytics (age_group) TYPE set(10) GRANULARITY 1;

-- ==============================================
-- 8.5 行銷活動表
-- ==============================================

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    campaign_id UInt64,
    campaign_name String,
    campaign_type String,
    start_date Date,
    end_date Date,
    budget Decimal(12,2),
    target_audience String,
    status String,
    created_at DateTime,
    updated_at DateTime
) ENGINE = MergeTree()
ORDER BY campaign_id
SETTINGS index_granularity = 8192;

-- ==============================================
-- 8.6 行銷效果表
-- ==============================================

CREATE TABLE IF NOT EXISTS marketing_effectiveness (
    date Date,
    campaign_id UInt64,
    impressions UInt64,
    clicks UInt64,
    conversions UInt64,
    revenue Decimal(12,2),
    cost Decimal(10,2),
    ctr Float32,
    conversion_rate Float32,
    roas Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, campaign_id)
SETTINGS index_granularity = 8192;

-- ==============================================
-- 8.7 庫存分析表
-- ==============================================

CREATE TABLE IF NOT EXISTS inventory_analytics (
    date Date,
    product_id UInt64,
    category_id UInt64,
    initial_stock UInt32,
    sold_quantity UInt32,
    returned_quantity UInt32,
    final_stock UInt32,
    stock_turnover_rate Float32,
    days_in_stock UInt32,
    stockout_days UInt32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, product_id)
SETTINGS index_granularity = 8192;

-- ==============================================
-- 8.8 支付分析表
-- ==============================================

CREATE TABLE IF NOT EXISTS payment_analytics (
    date Date,
    payment_method String,
    country String,
    transaction_count UInt32,
    total_amount Decimal(12,2),
    avg_amount Decimal(10,2),
    success_rate Float32,
    failure_count UInt32,
    avg_processing_time UInt32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, payment_method, country)
SETTINGS index_granularity = 8192;

-- ==============================================
-- 8.9 物流分析表
-- ==============================================

CREATE TABLE IF NOT EXISTS logistics_analytics (
    date Date,
    carrier String,
    country String,
    city String,
    shipment_count UInt32,
    avg_delivery_time UInt32,
    on_time_delivery_rate Float32,
    delivery_cost Decimal(10,2),
    customer_satisfaction Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, carrier, country)
SETTINGS index_granularity = 8192;

-- ==============================================
-- 8.10 物化視圖 - 每日銷售摘要
-- ==============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_summary_mv
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

-- ==============================================
-- 8.11 物化視圖 - 用戶行為摘要
-- ==============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_user_behavior_summary_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_type)
AS SELECT
    toDate(event_date) as date,
    event_type,
    count() as event_count,
    uniqExact(user_id) as unique_users,
    uniqExact(session_id) as unique_sessions,
    avg(duration) as avg_duration
FROM user_behavior_events
GROUP BY date, event_type;

-- ==============================================
-- 8.12 物化視圖 - 商品表現摘要
-- ==============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_product_performance_summary_mv
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
    avg(bounce_rate) as avg_bounce_rate
FROM product_performance
GROUP BY date, category_id;

-- ==============================================
-- 插入測試資料
-- ==============================================

-- 插入用戶行為事件測試資料
INSERT INTO user_behavior_events VALUES
('2024-01-01', '2024-01-01 10:00:00', 1, 'sess_001', 'view', 1, 1, '/products/1', 'google.com', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 120, '{"page_title": "iPhone 15 Pro"}'),
('2024-01-01', '2024-01-01 10:02:00', 1, 'sess_001', 'click', 1, 1, '/products/1', '/products/1', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 5, '{"button": "add_to_cart"}'),
('2024-01-01', '2024-01-01 10:05:00', 1, 'sess_001', 'add_to_cart', 1, 1, '/cart', '/products/1', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', 30, '{"quantity": 1}'),
('2024-01-01', '2024-01-01 11:00:00', 2, 'sess_002', 'view', 2, 1, '/products/2', 'facebook.com', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', 180, '{"page_title": "MacBook Pro M3"}'),
('2024-01-01', '2024-01-01 11:03:00', 2, 'sess_002', 'purchase', 2, 1, '/checkout', '/products/2', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', 300, '{"order_id": 1001}'),
('2024-01-01', '2024-01-01 12:00:00', 3, 'sess_003', 'search', NULL, NULL, '/search', 'google.com', 'tablet', 'Chrome', 'Android', 'Taiwan', 'Taichung', 60, '{"query": "AirPods"}'),
('2024-01-01', '2024-01-01 12:01:00', 3, 'sess_003', 'view', 3, 1, '/products/3', '/search', 'tablet', 'Chrome', 'Android', 'Taiwan', 'Taichung', 90, '{"page_title": "AirPods Pro"}');

-- 插入銷售數據測試資料
INSERT INTO sales_data VALUES
('2024-01-01', '2024-01-01 11:03:00', 1001, 2, 2, 1, 1, 1999.00, 1999.00, 0.00, 'credit_card', 'home_delivery', 'Taiwan', 'Kaohsiung', '25-34', 'F'),
('2024-01-01', '2024-01-01 14:30:00', 1002, 1, 1, 1, 1, 999.00, 999.00, 50.00, 'credit_card', 'convenience_store', 'Taiwan', 'Taipei', '25-34', 'M'),
('2024-01-01', '2024-01-01 16:45:00', 1003, 3, 3, 1, 2, 249.00, 498.00, 0.00, 'bank_transfer', 'home_delivery', 'Taiwan', 'Taichung', '18-24', 'M'),
('2024-01-02', '2024-01-02 09:15:00', 1004, 1, 1, 1, 1, 999.00, 999.00, 0.00, 'credit_card', 'home_delivery', 'Taiwan', 'Taipei', '25-34', 'M'),
('2024-01-02', '2024-01-02 13:20:00', 1005, 2, 4, 2, 1, 120.00, 120.00, 10.00, 'convenience_store', 'convenience_store', 'Taiwan', 'Kaohsiung', '25-34', 'F');

-- 插入商品表現數據測試資料
INSERT INTO product_performance VALUES
('2024-01-01', 1, 1, 150, 45, 12, 3, 2997.00, 0.20, 180, 0.15),
('2024-01-01', 2, 1, 80, 25, 8, 2, 3998.00, 0.25, 240, 0.10),
('2024-01-01', 3, 1, 200, 60, 20, 5, 1245.00, 0.25, 120, 0.20),
('2024-01-01', 4, 2, 120, 35, 15, 4, 480.00, 0.33, 150, 0.12),
('2024-01-01', 5, 2, 90, 28, 10, 3, 89.97, 0.30, 135, 0.18),
('2024-01-02', 1, 1, 180, 55, 18, 4, 3996.00, 0.22, 175, 0.12),
('2024-01-02', 2, 1, 95, 30, 12, 3, 5997.00, 0.32, 250, 0.08),
('2024-01-02', 3, 1, 220, 65, 25, 6, 1494.00, 0.27, 125, 0.18);

-- 插入用戶分析測試資料
INSERT INTO user_analytics VALUES
('2024-01-01', 1, '25-34', 'M', 'Taiwan', 'Taipei', 3, 15, 1800, 2, 1998.00, 999.00, '2024-01-01', 30, 0.15),
('2024-01-01', 2, '25-34', 'F', 'Taiwan', 'Kaohsiung', 2, 8, 1200, 1, 1999.00, 1999.00, '2024-01-01', 45, 0.08),
('2024-01-01', 3, '18-24', 'M', 'Taiwan', 'Taichung', 1, 5, 600, 1, 498.00, 498.00, '2024-01-01', 15, 0.25);

-- 插入行銷活動測試資料
INSERT INTO marketing_campaigns VALUES
(1, '新年特惠活動', 'discount', '2024-01-01', '2024-01-31', 100000.00, 'all_users', 'active', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(2, 'iPhone 15 Pro 預購', 'product_launch', '2024-01-15', '2024-02-15', 50000.00, 'tech_enthusiasts', 'active', '2024-01-15 00:00:00', '2024-01-15 00:00:00'),
(3, '春季服飾促銷', 'seasonal', '2024-03-01', '2024-03-31', 75000.00, 'fashion_lovers', 'planned', '2024-02-15 00:00:00', '2024-02-15 00:00:00');

-- 插入行銷效果測試資料
INSERT INTO marketing_effectiveness VALUES
('2024-01-01', 1, 10000, 500, 50, 50000.00, 5000.00, 0.05, 0.10, 10.00),
('2024-01-01', 2, 5000, 200, 25, 25000.00, 2500.00, 0.04, 0.125, 10.00),
('2024-01-02', 1, 12000, 600, 60, 60000.00, 6000.00, 0.05, 0.10, 10.00),
('2024-01-02', 2, 6000, 240, 30, 30000.00, 3000.00, 0.04, 0.125, 10.00);

-- 插入庫存分析測試資料
INSERT INTO inventory_analytics VALUES
('2024-01-01', 1, 1, 100, 3, 0, 97, 0.03, 1, 0),
('2024-01-01', 2, 1, 50, 2, 0, 48, 0.04, 1, 0),
('2024-01-01', 3, 1, 200, 5, 1, 194, 0.025, 1, 0),
('2024-01-01', 4, 2, 300, 4, 0, 296, 0.013, 1, 0),
('2024-01-01', 5, 2, 250, 3, 0, 247, 0.012, 1, 0);

-- 插入支付分析測試資料
INSERT INTO payment_analytics VALUES
('2024-01-01', 'credit_card', 'Taiwan', 3, 4997.00, 1665.67, 1.00, 0, 2),
('2024-01-01', 'bank_transfer', 'Taiwan', 1, 498.00, 498.00, 1.00, 0, 5),
('2024-01-01', 'convenience_store', 'Taiwan', 1, 120.00, 120.00, 1.00, 0, 1),
('2024-01-02', 'credit_card', 'Taiwan', 2, 1998.00, 999.00, 1.00, 0, 2),
('2024-01-02', 'convenience_store', 'Taiwan', 1, 120.00, 120.00, 1.00, 0, 1);

-- 插入物流分析測試資料
INSERT INTO logistics_analytics VALUES
('2024-01-01', 'post_office', 'Taiwan', 'Taipei', 2, 3, 1.00, 100.00, 4.5),
('2024-01-01', 'convenience_store', 'Taiwan', 'Kaohsiung', 1, 1, 1.00, 60.00, 4.8),
('2024-01-01', 'home_delivery', 'Taiwan', 'Taichung', 1, 2, 1.00, 80.00, 4.2),
('2024-01-02', 'post_office', 'Taiwan', 'Taipei', 1, 3, 1.00, 50.00, 4.5),
('2024-01-02', 'convenience_store', 'Taiwan', 'Kaohsiung', 1, 1, 1.00, 60.00, 4.8);

-- ==============================================
-- 建立使用者
-- ==============================================

-- 建立分析使用者
CREATE USER IF NOT EXISTS analytics_user IDENTIFIED BY 'analytics_password';
GRANT ALL ON ecommerce_analytics.* TO analytics_user;

-- 建立只讀使用者
CREATE USER IF NOT EXISTS analytics_readonly IDENTIFIED BY 'analytics_readonly_password';
GRANT SELECT ON ecommerce_analytics.* TO analytics_readonly;

-- ==============================================
-- 建立常用查詢函數
-- ==============================================

-- 建立銷售趨勢查詢函數
CREATE OR REPLACE FUNCTION get_sales_trend(start_date Date, end_date Date)
RETURNS TABLE (
    date Date,
    total_revenue Decimal(12,2),
    order_count UInt32,
    avg_order_value Decimal(10,2)
) AS $$
SELECT
    toDate(order_date) as date,
    sum(total_amount) as total_revenue,
    count() as order_count,
    avg(total_amount) as avg_order_value
FROM sales_data
WHERE order_date >= start_date AND order_date <= end_date
GROUP BY date
ORDER BY date
$$;

-- 建立用戶行為分析函數
CREATE OR REPLACE FUNCTION get_user_behavior_analysis(start_date Date, end_date Date)
RETURNS TABLE (
    event_type String,
    event_count UInt64,
    unique_users UInt64,
    avg_duration Float32
) AS $$
SELECT
    event_type,
    count() as event_count,
    uniqExact(user_id) as unique_users,
    avg(duration) as avg_duration
FROM user_behavior_events
WHERE event_date >= start_date AND event_date <= end_date
GROUP BY event_type
ORDER BY event_count DESC
$$;

-- ==============================================
-- 完成初始化
-- ==============================================

SELECT 'ClickHouse 電商系統資料庫初始化完成！' as message;
SELECT '資料庫名稱: ecommerce_analytics' as database_name;
SELECT '使用者: analytics_user (完整存取), analytics_readonly (只讀存取)' as users;
SELECT '已建立所有必要的表和物化視圖' as tables_created;
SELECT '已插入測試資料' as test_data_inserted;
