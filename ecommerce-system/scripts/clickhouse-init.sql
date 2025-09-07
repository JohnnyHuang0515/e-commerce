-- ClickHouse 初始化腳本
-- 用於電商系統分析服務

-- 創建資料庫
CREATE DATABASE IF NOT EXISTS ecommerce_analytics;

-- 使用資料庫
USE ecommerce_analytics;

-- 用戶行為事件表
CREATE TABLE IF NOT EXISTS user_events (
    event_id String,
    user_id UInt64,
    session_id String,
    event_type String,
    event_name String,
    page_url String,
    referrer String,
    user_agent String,
    ip_address String,
    device_type String,
    browser String,
    os String,
    country String,
    city String,
    properties Map(String, String),
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (user_id, timestamp)
SETTINGS index_granularity = 8192;

-- 商品瀏覽事件表
CREATE TABLE IF NOT EXISTS product_views (
    view_id String,
    user_id UInt64,
    product_id String,
    product_name String,
    category_id String,
    category_name String,
    price Decimal(10, 2),
    view_duration UInt32,
    page_position UInt16,
    search_query String,
    filters Map(String, String),
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (user_id, timestamp)
SETTINGS index_granularity = 8192;

-- 訂單分析表
CREATE TABLE IF NOT EXISTS order_analytics (
    order_id UInt64,
    user_id UInt64,
    order_number String,
    status String,
    total_amount Decimal(12, 2),
    subtotal Decimal(12, 2),
    tax_amount Decimal(10, 2),
    shipping_fee Decimal(10, 2),
    discount_amount Decimal(10, 2),
    payment_method String,
    payment_status String,
    shipping_method String,
    item_count UInt16,
    first_order Bool,
    customer_lifetime_value Decimal(12, 2),
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (user_id, timestamp)
SETTINGS index_granularity = 8192;

-- 商品銷售統計表
CREATE TABLE IF NOT EXISTS product_sales (
    product_id String,
    product_name String,
    category_id String,
    category_name String,
    sku String,
    quantity_sold UInt32,
    revenue Decimal(12, 2),
    avg_price Decimal(10, 2),
    orders_count UInt32,
    unique_customers UInt32,
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = SummingMergeTree()
PARTITION BY date
ORDER BY (product_id, date)
SETTINGS index_granularity = 8192;

-- 用戶行為漏斗表
CREATE TABLE IF NOT EXISTS user_funnel (
    user_id UInt64,
    session_id String,
    step_name String,
    step_order UInt8,
    step_timestamp DateTime64(3),
    step_duration UInt32,
    conversion_rate Float32,
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (user_id, session_id, step_order)
SETTINGS index_granularity = 8192;

-- 系統性能監控表
CREATE TABLE IF NOT EXISTS system_metrics (
    service_name String,
    metric_name String,
    metric_value Float64,
    metric_unit String,
    tags Map(String, String),
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (service_name, metric_name, timestamp)
SETTINGS index_granularity = 8192;

-- 創建物化視圖用於實時統計
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_user_stats
ENGINE = SummingMergeTree()
PARTITION BY date
ORDER BY (date, user_id)
AS SELECT
    date,
    user_id,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'click') as clicks,
    countIf(event_type = 'purchase') as purchases,
    uniq(session_id) as sessions,
    max(timestamp) as last_activity
FROM user_events
GROUP BY date, user_id;

-- 創建物化視圖用於商品熱度統計
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_product_stats
ENGINE = SummingMergeTree()
PARTITION BY date
ORDER BY (date, product_id)
AS SELECT
    date,
    product_id,
    product_name,
    category_id,
    category_name,
    count() as views,
    sum(view_duration) as total_view_time,
    avg(view_duration) as avg_view_time,
    uniq(user_id) as unique_viewers
FROM product_views
GROUP BY date, product_id, product_name, category_id, category_name;

-- 插入測試數據
INSERT INTO user_events VALUES
('evt_001', 1, 'sess_001', 'page_view', 'homepage', '/', '', 'Mozilla/5.0', '192.168.1.1', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', {'page_title': '首頁'}, now(), today()),
('evt_002', 1, 'sess_001', 'click', 'product_link', '/products/1', '/', 'Mozilla/5.0', '192.168.1.1', 'desktop', 'Chrome', 'Windows', 'Taiwan', 'Taipei', {'product_id': '1'}, now(), today()),
('evt_003', 2, 'sess_002', 'page_view', 'product_page', '/products/2', '/search', 'Mozilla/5.0', '192.168.1.2', 'mobile', 'Safari', 'iOS', 'Taiwan', 'Kaohsiung', {'product_id': '2'}, now(), today());

INSERT INTO product_views VALUES
('view_001', 1, 'prod_001', 'iPhone 15', 'cat_001', '手機', 29900.00, 45, 1, '', {'brand': 'Apple'}, now(), today()),
('view_002', 2, 'prod_002', 'MacBook Pro', 'cat_002', '筆電', 59900.00, 120, 2, 'macbook', {'brand': 'Apple'}, now(), today());

INSERT INTO order_analytics VALUES
(1, 1, 'ORD-001', 'completed', 29900.00, 28000.00, 1400.00, 500.00, 0.00, 'credit_card', 'paid', 'standard', 1, true, 29900.00, now(), today()),
(2, 2, 'ORD-002', 'processing', 59900.00, 55000.00, 2750.00, 2150.00, 0.00, 'bank_transfer', 'pending', 'express', 1, true, 59900.00, now(), today());

-- 創建用戶
CREATE USER IF NOT EXISTS admin IDENTIFIED BY 'password123';
GRANT ALL ON ecommerce_analytics.* TO admin;
