-- 📐 電商平台最終整合資料庫 Schema
-- 雙層主鍵設計：BIGINT (內部) + UUID (對外)
-- 完整的 RBAC 權限系統

-- 設置時區和擴展
SET timezone = 'Asia/Taipei';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. User Domain (用戶領域)
-- =============================================

-- 用戶表
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)), -- 0=停用, 1=啟用
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 用戶地址表
CREATE TABLE user_address (
    address_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_name VARCHAR(100),
    address_line VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- =============================================
-- 2. RBAC System (權限系統)
-- =============================================

-- 角色表
CREATE TABLE roles (
    role_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 權限表
CREATE TABLE permissions (
    permission_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 角色權限關聯表
CREATE TABLE role_permissions (
    role_id BIGINT REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

-- 用戶角色關聯表
CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT now(),
    assigned_by BIGINT REFERENCES users(user_id),
    PRIMARY KEY(user_id, role_id)
);

-- =============================================
-- 3. Product Domain (商品領域)
-- =============================================

-- 商品分類表
CREATE TABLE categories (
    category_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES categories(category_id),
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)), -- 0=停用, 1=啟用
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 商品表
CREATE TABLE products (
    product_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) CHECK (price >= 0),
    stock_quantity INT CHECK (stock_quantity >= 0),
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)), -- 0=下架, 1=上架
    category_id BIGINT REFERENCES categories(category_id),
    sku VARCHAR(100) UNIQUE,
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 商品圖片表
CREATE TABLE product_images (
    image_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

-- =============================================
-- 4. Order Domain (訂單領域)
-- =============================================

-- 訂單表
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(user_id),
    order_status VARCHAR(20) CHECK(order_status IN ('pending','paid','shipped','delivered','canceled')),
    total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
    subtotal DECIMAL(10,2) CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_address TEXT,
    billing_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 訂單項目表
CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id BIGINT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(product_id),
    product_name VARCHAR(200) NOT NULL, -- 快照：下單時的商品名稱
    product_sku VARCHAR(100), -- 快照：下單時的商品 SKU
    unit_price DECIMAL(10,2) CHECK (unit_price > 0), -- 快照：下單時的商品價格
    quantity INT CHECK (quantity > 0),
    subtotal DECIMAL(10,2) CHECK (subtotal > 0),
    created_at TIMESTAMP DEFAULT now()
);

-- =============================================
-- 5. Payment & Logistics (支付與物流)
-- =============================================

-- 支付表
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id BIGINT REFERENCES orders(order_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50),
    external_payment_id VARCHAR(100),
    amount DECIMAL(10,2) CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'TWD',
    payment_status VARCHAR(20) CHECK(payment_status IN ('pending','success','failed','refunded')),
    transaction_id VARCHAR(100),
    payment_data JSONB,
    paid_at TIMESTAMP,
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 物流表
CREATE TABLE shipments (
    shipment_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id BIGINT REFERENCES orders(order_id) ON DELETE CASCADE,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    shipping_method VARCHAR(50),
    shipping_address JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned')),
    shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    estimated_delivery TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    tracking_data JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- =============================================
-- 6. Marketing Domain (行銷領域)
-- =============================================

-- 優惠券表
CREATE TABLE coupons (
    coupon_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage','fixed_amount')),
    discount_value DECIMAL(10,2) CHECK (discount_value > 0),
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)), -- 0=停用, 1=啟用
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 評論表
CREATE TABLE reviews (
    review_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES products(product_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(order_id), -- 確保只有購買過的用戶才能評論
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- 是否為驗證購買評論
    helpful_count INTEGER DEFAULT 0,
    status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)), -- 0=隱藏, 1=顯示
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(product_id, user_id, order_id) -- 一個訂單只能評論一次
);

-- 心願單表
CREATE TABLE wishlists (
    wishlist_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT '我的心願單',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, name) -- 同一用戶的心願單名稱不能重複
);

-- 心願單項目表
CREATE TABLE wishlist_items (
    wishlist_item_id BIGINT PRIMARY KEY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    wishlist_id BIGINT REFERENCES wishlists(wishlist_id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(product_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT now(),
    UNIQUE(wishlist_id, product_id) -- 同一心願單不能重複添加同一商品
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

-- RBAC 相關索引
CREATE INDEX idx_roles_role_name ON roles(role_name);
CREATE INDEX idx_permissions_permission_name ON permissions(permission_name);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- 商品相關索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_status ON categories(status);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_main ON product_images(is_main);

-- 訂單相關索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 支付物流相關索引
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- 行銷相關索引
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_valid_from ON coupons(valid_from);
CREATE INDEX idx_coupons_valid_to ON coupons(valid_to);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- =============================================
-- 8. 創建觸發器函數
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
CREATE TRIGGER update_user_address_updated_at BEFORE UPDATE ON user_address FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. 插入初始數據
-- =============================================

-- 插入預設權限
INSERT INTO permissions (permission_id, permission_name, description) VALUES
(1, 'view_products', '查看商品'),
(2, 'create_product', '創建商品'),
(3, 'update_product', '更新商品'),
(4, 'delete_product', '刪除商品'),
(5, 'manage_inventory', '管理庫存'),
(6, 'view_orders', '查看訂單'),
(7, 'create_order', '創建訂單'),
(8, 'update_order', '更新訂單'),
(9, 'cancel_order', '取消訂單'),
(10, 'process_refund', '處理退款'),
(11, 'manage_users', '管理用戶'),
(12, 'assign_roles', '分配角色'),
(13, 'view_reports', '查看報表'),
(14, 'query_analytics', '查詢分析'),
(15, 'manage_coupons', '管理優惠券'),
(16, 'write_review', '撰寫評論'),
(17, 'manage_cart', '管理購物車'),
(18, 'manage_wishlist', '管理心願單'),
(19, 'request_return', '申請退貨'),
(20, 'process_return', '處理退貨'),
(21, 'manage_logistics', '管理物流'),
(22, 'view_logistics_reports', '查看物流報表'),
(23, 'manage_system_settings', '管理系統設定'),
(24, 'view_all_reports', '查看所有報表'),
(25, 'export_data', '導出數據'),
(26, 'view_ai_insights', '查看 AI 洞察')
ON CONFLICT (permission_id) DO NOTHING;

-- 插入預設角色
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'admin', '系統管理員'),
(2, 'seller', '賣家'),
(3, 'customer', '顧客'),
(4, 'logistics', '物流'),
(5, 'customer_service', '客服'),
(6, 'analyst', '分析人員')
ON CONFLICT (role_id) DO NOTHING;

-- 為 ADMIN 角色分配所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 SELLER 角色分配權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions 
WHERE permission_name IN ('view_products', 'create_product', 'update_product', 'delete_product', 
                         'manage_inventory', 'view_orders', 'update_order', 'manage_coupons', 'process_return')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 CUSTOMER 角色分配權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions 
WHERE permission_name IN ('view_products', 'create_order', 'view_orders', 'cancel_order', 
                         'write_review', 'manage_cart', 'manage_wishlist', 'request_return')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 LOGISTICS 角色分配權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions 
WHERE permission_name IN ('view_orders', 'update_order', 'manage_logistics', 'view_logistics_reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 CUSTOMER_SERVICE 角色分配權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM permissions 
WHERE permission_name IN ('view_orders', 'update_order', 'process_refund', 'process_return', 'manage_users')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 為 ANALYST 角色分配權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, permission_id FROM permissions 
WHERE permission_name IN ('view_reports', 'query_analytics', 'export_data', 'view_ai_insights')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 創建預設管理員用戶
INSERT INTO users (user_id, name, email, password_hash, status) VALUES
(1, '系統管理員', 'admin@ecommerce.com', '$2b$10$ZUowWee1Dh.zuukcIGVMReJ3Krs4cxiv3YBcHwq7cl0h4o3eUxIBC', 1)
ON CONFLICT (user_id) DO NOTHING;

-- 為管理員分配 ADMIN 角色
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 創建預設商品分類
INSERT INTO categories (category_id, name, level, sort_order) VALUES
(1, '電子產品', 0, 1),
(2, '服飾配件', 0, 2),
(3, '家居生活', 0, 3),
(4, '美妝保養', 0, 4),
(5, '運動戶外', 0, 5)
ON CONFLICT (category_id) DO NOTHING;

-- 創建子分類
INSERT INTO categories (category_id, name, parent_id, level, sort_order) VALUES
(11, '智慧型手機', 1, 1, 1),
(12, '筆記型電腦', 1, 1, 2),
(13, '平板電腦', 1, 1, 3),
(21, '男裝', 2, 1, 1),
(22, '女裝', 2, 1, 2),
(23, '鞋子', 2, 1, 3)
ON CONFLICT (category_id) DO NOTHING;

COMMIT;
