-- PostgreSQL 電商系統資料庫初始化腳本
-- 交易型資料庫：Users, Orders, Payments, Shipments, Products

-- 使用現有資料庫 ecommerce_transactions
-- CREATE DATABASE ecommerce_db;
-- \c ecommerce_db;

-- 建立擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================
-- 2.1 User Domain（用戶領域）
-- ==============================================

-- Users 表
CREATE TABLE Users (
    user_id BIGSERIAL PRIMARY KEY,
    public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_status ON Users(status);

-- User_Address 表
CREATE TABLE User_Address (
    address_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    recipient_name VARCHAR(100) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_address_user_id ON User_Address(user_id);
CREATE INDEX idx_user_address_default ON User_Address(user_id, is_default);

-- ==============================================
-- 2.2 Product Domain（商品領域）
-- ==============================================

-- Categories 表
CREATE TABLE Categories (
    category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES Categories(category_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON Categories(parent_id);

-- Products 表（核心交易欄位）
CREATE TABLE Products (
    product_id BIGSERIAL PRIMARY KEY,       -- 主鍵，交易系統唯一ID
    name VARCHAR(255) NOT NULL,             -- 商品名稱
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0), -- 售價
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- 庫存數量
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')), -- 狀態
    category_id BIGINT NOT NULL REFERENCES Categories(category_id), -- 類別
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON Products(category_id);
CREATE INDEX idx_products_status ON Products(status);
CREATE INDEX idx_products_price ON Products(price);
CREATE INDEX idx_products_stock ON Products(stock_quantity);
CREATE INDEX idx_products_name ON Products(name);
CREATE INDEX idx_products_category_status ON Products(category_id, status);
CREATE INDEX idx_products_price_range ON Products(price) WHERE status = 'active';

-- ==============================================
-- 2.3 Order Domain（訂單領域）
-- ==============================================

-- Cart 表
CREATE TABLE Cart (
    cart_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_user_id ON Cart(user_id);

-- Cart_Items 表
CREATE TABLE Cart_Items (
    cart_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cart_id BIGINT NOT NULL REFERENCES Cart(cart_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart_id ON Cart_Items(cart_id);
CREATE INDEX idx_cart_items_product_id ON Cart_Items(product_id);

-- Orders 表
CREATE TABLE Orders (
    order_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'paid', 'shipped', 'delivered', 'canceled')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON Orders(user_id);
CREATE INDEX idx_orders_status ON Orders(order_status);
CREATE INDEX idx_orders_created_at ON Orders(created_at);
CREATE INDEX idx_orders_user_status ON Orders(user_id, order_status);
CREATE INDEX idx_orders_created_at_desc ON Orders(created_at DESC);

-- Order_Items 表
CREATE TABLE Order_Items (
    order_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL, -- 下單時商品名稱（快照）
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0), -- 下單時商品價格（快照）
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order_id ON Order_Items(order_id);
CREATE INDEX idx_order_items_product_id ON Order_Items(product_id);

-- ==============================================
-- 2.4 Payment Domain（支付領域）
-- ==============================================

-- Payments 表
CREATE TABLE Payments (
    payment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON Payments(order_id);
CREATE INDEX idx_payments_status ON Payments(payment_status);

-- ==============================================
-- 2.5 Logistics Domain（物流領域）
-- ==============================================

-- Shipments 表
CREATE TABLE Shipments (
    shipment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_order_id ON Shipments(order_id);
CREATE INDEX idx_shipments_tracking ON Shipments(tracking_number);

-- ==============================================
-- 2.6 Marketing Domain（行銷領域）
-- ==============================================

-- Coupons 表
CREATE TABLE Coupons (
    coupon_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON Coupons(code);
CREATE INDEX idx_coupons_valid_period ON Coupons(valid_from, valid_to);

-- Reviews 表
CREATE TABLE Reviews (
    review_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id) -- 每個用戶對同一商品只能評論一次
);

CREATE INDEX idx_reviews_product_id ON Reviews(product_id);
CREATE INDEX idx_reviews_user_id ON Reviews(user_id);
CREATE INDEX idx_reviews_rating ON Reviews(rating);

-- Wishlist 表
CREATE TABLE Wishlist (
    wishlist_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wishlist_user_id ON Wishlist(user_id);

-- Wishlist_Items 表
CREATE TABLE Wishlist_Items (
    wishlist_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    wishlist_id BIGINT NOT NULL REFERENCES Wishlist(wishlist_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id, product_id) -- 避免重複加入
);

CREATE INDEX idx_wishlist_items_wishlist_id ON Wishlist_Items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON Wishlist_Items(product_id);

-- ==============================================
-- 2.7 Return Domain（退貨領域）
-- ==============================================

-- Return_Requests 表
CREATE TABLE Return_Requests (
    return_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'received', 'refunded', 'completed')),
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_return_requests_order_id ON Return_Requests(order_id);
CREATE INDEX idx_return_requests_user_id ON Return_Requests(user_id);
CREATE INDEX idx_return_requests_status ON Return_Requests(status);

-- Return_Items 表
CREATE TABLE Return_Items (
    return_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    return_id BIGINT NOT NULL REFERENCES Return_Requests(return_id) ON DELETE CASCADE,
    order_item_id BIGINT NOT NULL REFERENCES Order_Items(order_item_id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount >= 0)
);

CREATE INDEX idx_return_items_return_id ON Return_Items(return_id);
CREATE INDEX idx_return_items_order_item_id ON Return_Items(order_item_id);

-- Refunds 表
CREATE TABLE Refunds (
    refund_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    return_id BIGINT NOT NULL REFERENCES Return_Requests(return_id) ON DELETE RESTRICT,
    payment_id BIGINT NOT NULL REFERENCES Payments(payment_id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    refund_status VARCHAR(20) DEFAULT 'pending' CHECK (refund_status IN ('pending', 'success', 'failed')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refunds_return_id ON Refunds(return_id);
CREATE INDEX idx_refunds_payment_id ON Refunds(payment_id);
CREATE INDEX idx_refunds_status ON Refunds(refund_status);

-- ==============================================
-- 3. AI 相關資料表設計
-- ==============================================

-- User_Events 表（行為數據）
CREATE TABLE User_Events (
    event_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES Users(user_id) ON DELETE SET NULL,
    product_id BIGINT REFERENCES Products(product_id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'add_to_cart', 'purchase', 'search', 'remove_from_cart', 'wishlist_add', 'review')),
    metadata JSONB, -- 其他資訊（如瀏覽時間、來源頁、搜尋關鍵字等）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_events_user_id ON User_Events(user_id);
CREATE INDEX idx_user_events_product_id ON User_Events(product_id);
CREATE INDEX idx_user_events_type ON User_Events(event_type);
CREATE INDEX idx_user_events_created_at ON User_Events(created_at);
CREATE INDEX idx_user_events_metadata ON User_Events USING GIN(metadata);

-- User_Features 表（特徵數據）
CREATE TABLE User_Features (
    user_id BIGINT PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    age_group VARCHAR(20), -- 年齡層
    gender VARCHAR(10), -- 性別
    avg_order_value DECIMAL(10,2) DEFAULT 0, -- 平均消費金額
    purchase_frequency FLOAT DEFAULT 0, -- 購買頻率（次/月）
    last_active_at TIMESTAMP, -- 最近活躍時間
    embedding_vector JSONB, -- 使用者向量（JSON 格式儲存）
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_features_age_group ON User_Features(age_group);
CREATE INDEX idx_user_features_gender ON User_Features(gender);
CREATE INDEX idx_user_features_avg_order ON User_Features(avg_order_value);
CREATE INDEX idx_user_features_frequency ON User_Features(purchase_frequency);

-- Product_Features 表（特徵數據）
CREATE TABLE Product_Features (
    product_id BIGINT PRIMARY KEY REFERENCES Products(product_id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES Categories(category_id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    popularity_score FLOAT DEFAULT 0, -- 熱門分數
    embedding_vector JSONB, -- 商品向量（JSON 格式儲存）
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_features_category ON Product_Features(category_id);
CREATE INDEX idx_product_features_price ON Product_Features(price);
CREATE INDEX idx_product_features_popularity ON Product_Features(popularity_score);

-- Recommendations 表（AI 結果數據）
CREATE TABLE Recommendations (
    rec_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1), -- 推薦分數
    model_version VARCHAR(50) NOT NULL, -- 使用的模型版本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_user_id ON Recommendations(user_id);
CREATE INDEX idx_recommendations_product_id ON Recommendations(product_id);
CREATE INDEX idx_recommendations_score ON Recommendations(score);
CREATE INDEX idx_recommendations_model ON Recommendations(model_version);
CREATE INDEX idx_recommendations_created_at ON Recommendations(created_at);

-- Predictions 表（AI 結果數據）
CREATE TABLE Predictions (
    pred_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('churn', 'LTV', 'demand', 'price_sensitivity')),
    value FLOAT NOT NULL, -- 預測結果
    model_version VARCHAR(50) NOT NULL, -- 模型版本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_user_id ON Predictions(user_id);
CREATE INDEX idx_predictions_type ON Predictions(prediction_type);
CREATE INDEX idx_predictions_model ON Predictions(model_version);
CREATE INDEX idx_predictions_created_at ON Predictions(created_at);

-- ==============================================
-- 觸發器設定
-- ==============================================

-- 自動更新 updated_at 欄位的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要 updated_at 的表建立觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON Products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON Orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_return_requests_updated_at BEFORE UPDATE ON Return_Requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_features_updated_at BEFORE UPDATE ON User_Features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_features_updated_at BEFORE UPDATE ON Product_Features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 初始資料插入
-- ==============================================

-- 插入預設分類
INSERT INTO Categories (name, parent_id) VALUES 
('電子產品', NULL),
('服飾', NULL),
('家居用品', NULL),
('運動用品', NULL),
('書籍', NULL);

-- 插入子分類
INSERT INTO Categories (name, parent_id) VALUES 
('手機', 1),
('筆記型電腦', 1),
('耳機', 1),
('男裝', 2),
('女裝', 2),
('童裝', 2),
('家具', 3),
('廚房用品', 3),
('健身器材', 4),
('球類運動', 4),
('小說', 5),
('技術書籍', 5);

-- 插入測試商品
INSERT INTO Products (name, price, stock_quantity, status, category_id) VALUES 
('iPhone 15 Pro', 999.00, 50, 'active', 6),
('MacBook Pro M3', 1999.00, 25, 'active', 7),
('AirPods Pro', 249.00, 100, 'active', 8),
('Nike Air Max', 120.00, 200, 'active', 9),
('Adidas T-Shirt', 29.99, 150, 'active', 10);

-- ==============================================
-- RBAC 權限管理系統
-- ==============================================

-- 權限表
CREATE TABLE IF NOT EXISTS permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource_type VARCHAR(50), -- 資源類型：product, order, user, report
    action_type VARCHAR(50),    -- 操作類型：create, read, update, delete
    created_at TIMESTAMP DEFAULT NOW()
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 用戶角色關聯表
CREATE TABLE IF NOT EXISTS user_roles (
    user_role_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- 角色權限關聯表
CREATE TABLE IF NOT EXISTS role_permissions (
    role_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- RBAC 索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 插入電商權限
INSERT INTO permissions (permission_name, description, resource_type, action_type) VALUES
-- 商品相關權限
('create_product', '建立商品', 'product', 'create'),
('read_product', '查看商品', 'product', 'read'),
('update_product', '更新商品', 'product', 'update'),
('delete_product', '刪除商品', 'product', 'delete'),

-- 訂單相關權限
('create_order', '建立訂單', 'order', 'create'),
('read_order', '查看訂單', 'order', 'read'),
('update_order', '更新訂單', 'order', 'update'),
('update_order_status', '更新訂單狀態', 'order', 'update'),
('delete_order', '刪除訂單', 'order', 'delete'),

-- 用戶相關權限
('manage_users', '管理用戶', 'user', 'manage'),
('assign_roles', '分配角色', 'user', 'assign'),

-- 退貨相關權限
('request_return', '申請退貨', 'return', 'create'),
('process_return', '處理退貨', 'return', 'update'),
('refund_orders', '退款處理', 'refund', 'process'),

-- 報表相關權限
('view_reports', '查看報表', 'report', 'read'),
('query_clickhouse', '查詢分析數據', 'analytics', 'read')
ON CONFLICT (permission_name) DO NOTHING;

-- 插入電商角色
INSERT INTO roles (role_name, description) VALUES
('admin', '系統管理員'),
('seller', '賣家'),
('customer', '顧客'),
('logistics', '物流人員'),
('analyst', '分析人員')
ON CONFLICT (role_name) DO NOTHING;

-- 角色權限分配
-- 顧客權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'customer' 
AND p.permission_name IN ('read_product', 'create_order', 'request_return')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 賣家權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'seller' 
AND p.permission_name IN ('create_product', 'update_product', 'read_order', 'update_order')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 物流權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'logistics' 
AND p.permission_name IN ('read_order', 'update_order_status')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 管理員權限（所有權限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 分析人員權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'analyst' 
AND p.permission_name IN ('view_reports', 'query_clickhouse')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================
-- 種子資料
-- ==============================================

-- 插入測試用戶（使用正確的 bcrypt hash）
INSERT INTO Users (name, email, password_hash, phone, status) VALUES 
('系統管理員', 'admin@ecommerce.com', '$2a$10$qKn56iI4J2dRB1xLhksb2OZaxdaaLDG.5/XBFng80j.xl5PZMlt4C', '0912345678', 'active'),
('測試用戶1', 'test1@example.com', '$2a$10$emK0iIcvSb.X1QMH8Oi06.d0h3k3VlNCO96l4ocM.IUh24iKll9q.', '0987654321', 'active'),
('測試用戶2', 'test2@example.com', '$2a$10$emK0iIcvSb.X1QMH8Oi06.d0h3k3VlNCO96l4ocM.IUh24iKll9q.', '0955555555', 'active');

-- 插入測試地址
INSERT INTO User_Address (user_id, recipient_name, address_line, city, postal_code, country, is_default) VALUES 
(1, '系統管理員', '台北市信義區信義路五段7號', '台北市', '110', '台灣', true),
(2, '測試用戶1', '新北市板橋區文化路一段188號', '新北市', '220', '台灣', true),
(3, '測試用戶2', '高雄市左營區博愛二路777號', '高雄市', '813', '台灣', true);

-- 分配用戶角色
INSERT INTO user_roles (user_id, role_id) VALUES
(1, (SELECT role_id FROM roles WHERE role_name = 'admin')),  -- 系統管理員
(2, (SELECT role_id FROM roles WHERE role_name = 'customer')), -- 測試用戶1
(3, (SELECT role_id FROM roles WHERE role_name = 'customer')); -- 測試用戶2

-- 插入測試優惠券
INSERT INTO Coupons (code, discount_percent, valid_from, valid_to) VALUES 
('WELCOME10', 10.00, NOW(), NOW() + INTERVAL '30 days'),
('SUMMER20', 20.00, NOW(), NOW() + INTERVAL '60 days'),
('VIP15', 15.00, NOW(), NOW() + INTERVAL '90 days');

-- 建立資料庫使用者（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ecommerce_user') THEN
        CREATE USER ecommerce_user WITH PASSWORD 'ecommerce_password';
    END IF;
END
$$;

-- 授予權限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecommerce_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecommerce_user;

-- 驗證初始化結果
\echo '驗證 RBAC 系統初始化...'
SELECT 
    u.name as user_name,
    u.email,
    r.role_name,
    COUNT(p.permission_name) as permission_count
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE ur.is_active = true
GROUP BY u.user_id, u.name, u.email, r.role_name
ORDER BY u.user_id;

-- 完成初始化
\echo 'PostgreSQL 電商系統資料庫初始化完成！'
\echo '資料庫名稱: ecommerce_transactions'
\echo '使用者: admin'
\echo '已建立所有必要的表和索引'
\echo 'RBAC 權限系統已初始化'
\echo '測試帳號:'
\echo '  管理員: admin@ecommerce.com / password123'
\echo '  測試用戶: test1@example.com / password123'
