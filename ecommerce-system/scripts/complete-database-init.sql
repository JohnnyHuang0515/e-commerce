-- 完整的電商系統資料庫初始化腳本
-- 包含所有合併服務需要的表格和欄位

-- 設置時區
SET timezone = 'Asia/Taipei';

-- 創建擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 創建自定義類型
CREATE TYPE order_status AS ENUM (
    'PENDING',
    'PAID', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESS',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE payment_method AS ENUM (
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'DIGITAL_WALLET',
    'CASH_ON_DELIVERY'
);

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'MERCHANT',
    'STAFF',
    'CUSTOMER',
    'GUEST'
);

CREATE TYPE membership_level AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'VIP'
);

-- 設置搜索路徑
SET search_path TO public;

-- =============================================
-- 1. 用戶相關表格 (AUTH-SERVICE)
-- =============================================

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'CUSTOMER',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    role_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用戶資料表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar VARCHAR(500),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 權限表
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色權限關聯表
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    UNIQUE(role_id, permission_id)
);

-- 用戶角色關聯表
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- =============================================
-- 2. 商品相關表格 (PRODUCT-SERVICE)
-- =============================================

-- 商品表 (PostgreSQL 版本，用於庫存管理)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10,2) CHECK (original_price >= 0),
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID,
    brand VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    attributes JSONB DEFAULT '{}',
    images TEXT[],
    tags TEXT[],
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    view_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品分類表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 庫存表
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    reorder_point INTEGER NOT NULL DEFAULT 10 CHECK (reorder_point >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 庫存變動記錄表
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    adjustment INTEGER NOT NULL,
    reason TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 訂單相關表格 (ORDER-SERVICE)
-- =============================================

-- 訂單表
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    status order_status DEFAULT 'PENDING',
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    currency VARCHAR(3) DEFAULT 'TWD',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    notes TEXT,
    payment_status payment_status DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_id UUID,
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 訂單項目表
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL, -- 改為 VARCHAR 以存儲 MongoDB ObjectId
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price > 0),
    product_attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支付表
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    external_payment_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'TWD',
    status payment_status DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    payment_data JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 物流表
CREATE TABLE IF NOT EXISTS logistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shipping_method VARCHAR(50) NOT NULL,
    carrier VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED')),
    shipping_address JSONB NOT NULL,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    tracking_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. 系統相關表格 (SYSTEM-SERVICE)
-- =============================================

-- 系統設定表
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用戶設定表
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- 系統日誌表
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
    message TEXT NOT NULL,
    module VARCHAR(100),
    user_id UUID REFERENCES users(id),
    ip VARCHAR(45),
    user_agent TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipients UUID[] NOT NULL,
    read_by UUID[] DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 檔案表
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(500) NOT NULL,
    url VARCHAR(500),
    uploaded_by UUID REFERENCES users(id),
    category VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. 創建索引
-- =============================================

-- 用戶相關索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- 商品相關索引
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- 訂單相關索引
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_logistics_order_id ON logistics(order_id);
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_number ON logistics(tracking_number);
CREATE INDEX IF NOT EXISTS idx_logistics_status ON logistics(status);

-- 系統相關索引
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- =============================================
-- 6. 創建觸發器函數
-- =============================================

-- 自動更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表添加 updated_at 觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_logistics_updated_at BEFORE UPDATE ON logistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. 插入初始數據
-- =============================================

-- 插入預設權限
INSERT INTO permissions (name, description, resource, action, module) VALUES
('users:create', '創建用戶', 'users', 'create', 'users'),
('users:read', '查看用戶', 'users', 'read', 'users'),
('users:update', '更新用戶', 'users', 'update', 'users'),
('users:delete', '刪除用戶', 'users', 'delete', 'users'),
('products:create', '創建商品', 'products', 'create', 'products'),
('products:read', '查看商品', 'products', 'read', 'products'),
('products:update', '更新商品', 'products', 'update', 'products'),
('products:delete', '刪除商品', 'products', 'delete', 'products'),
('orders:create', '創建訂單', 'orders', 'create', 'orders'),
('orders:read', '查看訂單', 'orders', 'read', 'orders'),
('orders:update', '更新訂單', 'orders', 'update', 'orders'),
('orders:delete', '刪除訂單', 'orders', 'delete', 'orders'),
('analytics:read', '查看分析', 'analytics', 'read', 'analytics'),
('system:manage', '系統管理', 'system', 'manage', 'system'),
('payments:manage', '支付管理', 'payments', 'manage', 'payments'),
('logistics:manage', '物流管理', 'logistics', 'manage', 'logistics'),
('inventory:manage', '庫存管理', 'inventory', 'manage', 'inventory')
ON CONFLICT (name) DO NOTHING;

-- 插入預設角色
INSERT INTO roles (name, description, is_system) VALUES
('ADMIN', '系統管理員', true),
('MERCHANT', '商家', true),
('STAFF', '員工', true),
('CUSTOMER', '客戶', true),
('GUEST', '訪客', true)
ON CONFLICT (name) DO NOTHING;

-- 為 ADMIN 角色分配所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 MERCHANT 角色分配商品和訂單管理權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MERCHANT' 
AND p.name IN ('products:create', 'products:read', 'products:update', 'products:delete',
               'orders:read', 'orders:update', 'analytics:read', 'inventory:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 STAFF 角色分配基本操作權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'STAFF'
AND p.name IN ('products:read', 'orders:read', 'orders:update', 'analytics:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 CUSTOMER 角色分配客戶權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER'
AND p.name IN ('products:read', 'orders:create', 'orders:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 GUEST 角色分配訪客權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'GUEST'
AND p.name IN ('products:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 插入預設系統設定
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('site_name', '"電商系統"', '網站名稱', 'general', true),
('site_description', '"智能電商平台"', '網站描述', 'general', true),
('currency', '"TWD"', '預設貨幣', 'general', true),
('timezone', '"Asia/Taipei"', '時區設定', 'general', true),
('order_timeout_minutes', '30', '訂單超時時間（分鐘）', 'orders', false),
('max_order_items', '50', '單筆訂單最大商品數量', 'orders', false),
('free_shipping_threshold', '1000', '免運費門檻', 'shipping', true),
('tax_rate', '0.05', '稅率', 'tax', true),
('points_earn_rate', '0.01', '積分獲得比例', 'loyalty', true),
('points_redeem_rate', '0.01', '積分兌換比例', 'loyalty', true)
ON CONFLICT (key) DO NOTHING;

-- 創建預設管理員用戶
INSERT INTO users (email, password, name, role, status, email_verified_at)
VALUES ('admin@ecommerce.com', '$2b$10$ZUowWee1Dh.zuukcIGVMReJ3Krs4cxiv3YBcHwq7cl0h4o3eUxIBC', '系統管理員', 'ADMIN', 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- 為管理員分配 ADMIN 角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@ecommerce.com' AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 創建預設商品分類
INSERT INTO categories (name, description, level, sort_order) VALUES
('電子產品', '各種電子產品', 0, 1),
('服飾配件', '服裝和配件', 0, 2),
('家居生活', '家居用品', 0, 3),
('美妝保養', '美妝和保養品', 0, 4),
('運動戶外', '運動和戶外用品', 0, 5)
ON CONFLICT (name) DO NOTHING;

-- 創建子分類
INSERT INTO categories (name, description, parent_id, level, sort_order)
SELECT 
    subcat.name,
    subcat.description,
    c.id,
    1,
    subcat.sort_order
FROM categories c,
(VALUES 
    ('智慧型手機', '手機相關產品', 1),
    ('筆記型電腦', '筆電相關產品', 2),
    ('平板電腦', '平板相關產品', 3),
    ('男裝', '男性服裝', 1),
    ('女裝', '女性服裝', 2),
    ('鞋子', '各種鞋子', 3)
) AS subcat(name, description, sort_order)
WHERE c.name = '電子產品' AND subcat.sort_order <= 3
ON CONFLICT (name) DO NOTHING;

COMMIT;
