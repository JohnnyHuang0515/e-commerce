-- PostgreSQL 初始數據腳本
-- 插入系統預設數據

-- 插入預設權限
INSERT INTO permissions (name, display_name, module, action, description) VALUES
('users:create', '創建用戶', 'users', 'create', '創建新用戶'),
('users:read', '查看用戶', 'users', 'read', '查看用戶資訊'),
('users:update', '更新用戶', 'users', 'update', '更新用戶資訊'),
('users:delete', '刪除用戶', 'users', 'delete', '刪除用戶'),
('products:create', '創建商品', 'products', 'create', '創建新商品'),
('products:read', '查看商品', 'products', 'read', '查看商品資訊'),
('products:update', '更新商品', 'products', 'update', '更新商品資訊'),
('products:delete', '刪除商品', 'products', 'delete', '刪除商品'),
('orders:create', '創建訂單', 'orders', 'create', '創建新訂單'),
('orders:read', '查看訂單', 'orders', 'read', '查看訂單資訊'),
('orders:update', '更新訂單', 'orders', 'update', '更新訂單狀態'),
('orders:delete', '刪除訂單', 'orders', 'delete', '刪除訂單'),
('analytics:read', '查看分析', 'analytics', 'read', '查看分析數據'),
('system:manage', '系統管理', 'system', 'manage', '系統管理功能'),
('payments:manage', '支付管理', 'payments', 'manage', '支付相關管理'),
('logistics:manage', '物流管理', 'logistics', 'manage', '物流相關管理'),
('inventory:manage', '庫存管理', 'inventory', 'manage', '庫存相關管理')
ON CONFLICT (name) DO NOTHING;

-- 插入預設角色
INSERT INTO roles (name, display_name, description) VALUES
('ADMIN', '系統管理員', '擁有所有權限的系統管理員'),
('MERCHANT', '商家', '商品和訂單管理權限'),
('STAFF', '員工', '基本操作權限'),
('CUSTOMER', '客戶', '客戶基本權限'),
('GUEST', '訪客', '訪客權限')
ON CONFLICT (name) DO NOTHING;

-- 為角色分配權限
-- ADMIN 角色 - 所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MERCHANT 角色 - 商品和訂單管理權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MERCHANT' 
AND p.name IN ('products:create', 'products:read', 'products:update', 'products:delete',
               'orders:read', 'orders:update', 'analytics:read', 'inventory:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF 角色 - 基本操作權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'STAFF'
AND p.name IN ('products:read', 'orders:read', 'orders:update', 'analytics:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CUSTOMER 角色 - 客戶權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER'
AND p.name IN ('products:read', 'orders:create', 'orders:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- GUEST 角色 - 訪客權限
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
INSERT INTO users (username, email, password_hash, first_name, last_name, membership_level, is_active, email_verified)
VALUES ('admin', 'admin@ecommerce.com', '$2b$10$rQZ8K9vXqH2nM3pL4sT5uO6wE7yF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8', '系統', '管理員', 'VIP', true, true)
ON CONFLICT (email) DO NOTHING;

-- 為管理員分配 ADMIN 角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@ecommerce.com' AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;
