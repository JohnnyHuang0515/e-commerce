-- 電商平台新資料庫架構 (PostgreSQL + MongoDB 版本)
-- 基於設計文件創建的優化版本

-- 設置時區和擴展
SET timezone = 'Asia/Taipei';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. 用戶系統 (雙層主鍵設計)
-- =============================================

-- 用戶表
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1, 2)), -- 0: inactive, 1: active, 2: suspended
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用戶地址表
CREATE TABLE user_address (
    address_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_name VARCHAR(100) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'Taiwan',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. RBAC 權限系統
-- =============================================

-- 角色表
CREATE TABLE roles (
    role_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 權限表
CREATE TABLE permissions (
    permission_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色權限關聯表
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(role_id, permission_id)
);

-- 用戶角色關聯表
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(user_id, role_id)
);

-- =============================================
-- 3. 商品系統
-- =============================================

-- 商品分類表
CREATE TABLE categories (
    category_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES categories(category_id),
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)), -- 0: inactive, 1: active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品表
CREATE TABLE products (
    product_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10,2) CHECK (original_price >= 0),
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id BIGINT REFERENCES categories(category_id),
    brand VARCHAR(100),
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1, 2)), -- 0: inactive, 1: active, 2: sold_out
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    view_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品圖片表
CREATE TABLE product_images (
    image_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    is_main BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. 訂單系統
-- =============================================

-- 訂單表
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'paid', 'shipped', 'delivered', 'canceled')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    currency VARCHAR(3) DEFAULT 'TWD',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 訂單項目表
CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. 支付與物流系統
-- =============================================

-- 支付表
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    external_payment_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'TWD',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
    transaction_id VARCHAR(100),
    payment_data JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 物流表
CREATE TABLE shipments (
    shipment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    shipping_method VARCHAR(50) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    shipping_address JSONB NOT NULL,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    tracking_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. 購物車與心願單
-- =============================================

-- 購物車表
CREATE TABLE cart (
    cart_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 購物車項目表
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    cart_id BIGINT NOT NULL REFERENCES cart(cart_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 心願單表
CREATE TABLE wishlist (
    wishlist_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =============================================
-- 7. 創建索引
-- =============================================

-- 用戶相關索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_address_user_id ON user_address(user_id);
CREATE INDEX idx_user_address_is_default ON user_address(is_default);

-- RBAC 索引
CREATE INDEX idx_roles_role_name ON roles(role_name);
CREATE INDEX idx_permissions_permission_name ON permissions(permission_name);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- 商品相關索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_status ON categories(status);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_main ON product_images(is_main);

-- 訂單相關索引
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 支付物流索引
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);

-- 購物車心願單索引
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);

-- =============================================
-- 8. 創建觸發器
-- =============================================

-- 自動更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為需要的表添加 updated_at 觸發器
CREATE TRIGGER trg_update_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_user_address
BEFORE UPDATE ON user_address
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_roles
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_permissions
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_user_roles
BEFORE UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_categories
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_products
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_shipments
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_cart
BEFORE UPDATE ON cart
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_cart_items
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================
-- 9. 插入初始數據
-- =============================================

-- 插入預設權限 (使用動詞_資源格式)
INSERT INTO permissions (permission_name, description, resource, action) VALUES
('view_products', '查看商品', 'products', 'read'),
('create_product', '創建商品', 'products', 'create'),
('update_product', '更新商品', 'products', 'update'),
('delete_product', '刪除商品', 'products', 'delete'),
('manage_inventory', '管理庫存', 'inventory', 'manage'),
('view_orders', '查看訂單', 'orders', 'read'),
('create_order', '創建訂單', 'orders', 'create'),
('update_order', '更新訂單', 'orders', 'update'),
('cancel_order', '取消訂單', 'orders', 'cancel'),
('process_refund', '處理退款', 'payments', 'refund'),
('manage_users', '管理用戶', 'users', 'manage'),
('assign_roles', '分配角色', 'roles', 'assign'),
('view_reports', '查看報表', 'analytics', 'read'),
('query_analytics', '查詢分析', 'clickhouse', 'query'),
('manage_coupons', '管理優惠券', 'coupons', 'manage'),
('write_review', '撰寫評論', 'reviews', 'write'),
('manage_cart', '管理購物車', 'cart', 'manage'),
('manage_wishlist', '管理心願單', 'wishlist', 'manage'),
('request_return', '申請退貨', 'returns', 'request'),
('process_return', '處理退貨', 'returns', 'process'),
('manage_logistics', '管理物流', 'shipments', 'manage'),
('view_logistics_reports', '查看物流報表', 'logistics', 'read'),
('manage_system_settings', '管理系統設定', 'settings', 'manage'),
('view_all_reports', '查看所有報表', 'analytics', 'read_all'),
('export_data', '導出數據', 'data', 'export'),
('view_ai_insights', '查看 AI 洞察', 'ai', 'read')
ON CONFLICT (permission_name) DO NOTHING;

-- 插入預設角色
INSERT INTO roles (role_name, description) VALUES
('admin', '系統管理員'),
('seller', '賣家'),
('logistics', '物流人員'),
('customer_service', '客服人員'),
('analyst', '分析人員'),
('customer', '顧客')
ON CONFLICT (role_name) DO NOTHING;

-- 為角色分配權限
-- Admin 擁有所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seller 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'seller'
AND p.permission_name IN ('view_products', 'create_product', 'update_product', 'delete_product', 
                         'manage_inventory', 'view_orders', 'update_order', 'manage_coupons', 'process_return')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Logistics 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'logistics'
AND p.permission_name IN ('view_orders', 'update_order', 'manage_logistics', 'view_logistics_reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer Service 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'customer_service'
AND p.permission_name IN ('view_orders', 'update_order', 'process_refund', 'process_return', 'manage_users')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Analyst 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'analyst'
AND p.permission_name IN ('view_reports', 'query_analytics', 'export_data', 'view_ai_insights')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer 權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'customer'
AND p.permission_name IN ('view_products', 'create_order', 'view_orders', 'cancel_order', 
                         'write_review', 'manage_cart', 'manage_wishlist', 'request_return')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 創建預設管理員用戶
INSERT INTO users (name, email, password_hash, status, email_verified_at)
VALUES ('系統管理員', 'admin@ecommerce.com', '$2b$10$ZUowWee1Dh.zuukcIGVMReJ3Krs4cxiv3YBcHwq7cl0h4o3eUxIBC', 1, NOW())
ON CONFLICT (email) DO NOTHING;

-- 為管理員分配 admin 角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u, roles r
WHERE u.email = 'admin@ecommerce.com' AND r.role_name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 創建預設商品分類
INSERT INTO categories (name, description, level, sort_order) VALUES
('電子產品', '各種電子產品', 0, 1),
('服飾配件', '服裝和配件', 0, 2),
('家居生活', '家居用品', 0, 3),
('美妝保養', '美妝和保養品', 0, 4),
('運動戶外', '運動和戶外用品', 0, 5)
ON CONFLICT (name) DO NOTHING;

COMMIT;
