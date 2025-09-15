-- 電商系統測試數據初始化腳本
-- 創建測試用戶、商品、分類等基礎數據

-- 1. 創建測試用戶
INSERT INTO users (user_id, public_id, name, email, password_hash, role, status, created_at, updated_at) VALUES
('user_001', 'usr_001', '管理員', 'admin@ecommerce.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, NOW(), NOW()),
('user_002', 'usr_002', '張小明', 'zhang@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 1, NOW(), NOW()),
('user_003', 'usr_003', '李小花', 'li@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 1, NOW(), NOW()),
('user_004', 'usr_004', '王大明', 'wang@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'moderator', 1, NOW(), NOW());

-- 2. 創建商品分類
INSERT INTO categories (category_id, public_id, name, description, parent_id, status, created_at, updated_at) VALUES
('cat_001', 'cat_001', '電子產品', '各種電子設備和配件', NULL, 1, NOW(), NOW()),
('cat_002', 'cat_002', '服裝', '男女服裝和配飾', NULL, 1, NOW(), NOW()),
('cat_003', 'cat_003', '家居用品', '家庭生活用品', NULL, 1, NOW(), NOW()),
('cat_004', 'cat_004', '手機', '智能手機和配件', 'cat_001', 1, NOW(), NOW()),
('cat_005', 'cat_005', '筆記本電腦', '筆記本電腦和配件', 'cat_001', 1, NOW(), NOW());

-- 3. 創建品牌
INSERT INTO brands (brand_id, public_id, name, description, logo_url, status, created_at, updated_at) VALUES
('brand_001', 'brand_001', 'Apple', '蘋果公司', 'https://example.com/apple-logo.png', 1, NOW(), NOW()),
('brand_002', 'brand_002', 'Samsung', '三星電子', 'https://example.com/samsung-logo.png', 1, NOW(), NOW()),
('brand_003', 'brand_003', 'Nike', '耐克運動品牌', 'https://example.com/nike-logo.png', 1, NOW(), NOW()),
('brand_004', 'brand_004', 'IKEA', '宜家家居', 'https://example.com/ikea-logo.png', 1, NOW(), NOW());

-- 4. 創建測試商品
INSERT INTO products (product_id, public_id, name, description, price, category_id, brand_id, sku, stock_quantity, status, created_at, updated_at) VALUES
('prod_001', 'prod_001', 'iPhone 15 Pro', '蘋果最新款智能手機', 999.99, 'cat_004', 'brand_001', 'IPH15PRO-128', 50, 1, NOW(), NOW()),
('prod_002', 'prod_002', 'Samsung Galaxy S24', '三星旗艦智能手機', 899.99, 'cat_004', 'brand_002', 'SGS24-256', 30, 1, NOW(), NOW()),
('prod_003', 'prod_003', 'MacBook Pro M3', '蘋果筆記本電腦', 1999.99, 'cat_005', 'brand_001', 'MBP-M3-512', 20, 1, NOW(), NOW()),
('prod_004', 'prod_004', 'Nike Air Max', '耐克運動鞋', 129.99, 'cat_002', 'brand_003', 'NAM-42', 100, 1, NOW(), NOW()),
('prod_005', 'prod_005', 'IKEA 書桌', '宜家簡約書桌', 199.99, 'cat_003', 'brand_004', 'IKEA-DESK-120', 25, 1, NOW(), NOW());

-- 5. 創建商品圖片
INSERT INTO product_images (image_id, public_id, product_id, image_url, alt_text, sort_order, created_at) VALUES
('img_001', 'img_001', 'prod_001', 'https://example.com/iphone15pro-1.jpg', 'iPhone 15 Pro 正面', 1, NOW()),
('img_002', 'img_002', 'prod_001', 'https://example.com/iphone15pro-2.jpg', 'iPhone 15 Pro 背面', 2, NOW()),
('img_003', 'img_003', 'prod_002', 'https://example.com/sgs24-1.jpg', 'Samsung Galaxy S24 正面', 1, NOW()),
('img_004', 'img_004', 'prod_003', 'https://example.com/mbp-m3-1.jpg', 'MacBook Pro M3 正面', 1, NOW()),
('img_005', 'img_005', 'prod_004', 'https://example.com/nike-airmax-1.jpg', 'Nike Air Max 側面', 1, NOW());

-- 6. 創建測試訂單
INSERT INTO orders (order_id, public_id, user_id, status, total_amount, shipping_address, payment_method, created_at, updated_at) VALUES
('order_001', 'order_001', 'user_002', 'pending', 999.99, '{"name":"張小明","address":"台北市信義區信義路五段7號","phone":"0912345678"}', 'credit_card', NOW(), NOW()),
('order_002', 'order_002', 'user_003', 'processing', 129.99, '{"name":"李小花","address":"新北市板橋區文化路一段188號","phone":"0987654321"}', 'line_pay', NOW(), NOW()),
('order_003', 'order_003', 'user_002', 'shipped', 1999.99, '{"name":"張小明","address":"台北市信義區信義路五段7號","phone":"0912345678"}', 'credit_card', NOW(), NOW());

-- 7. 創建訂單項目
INSERT INTO order_items (item_id, public_id, order_id, product_id, quantity, price, created_at) VALUES
('item_001', 'item_001', 'order_001', 'prod_001', 1, 999.99, NOW()),
('item_002', 'item_002', 'order_002', 'prod_004', 1, 129.99, NOW()),
('item_003', 'item_003', 'order_003', 'prod_003', 1, 1999.99, NOW());

-- 8. 創建權限
INSERT INTO permissions (permission_id, public_id, name, description, resource, action, created_at, updated_at) VALUES
('perm_001', 'perm_001', '用戶管理', '管理用戶帳號', 'users', 'manage', NOW(), NOW()),
('perm_002', 'perm_002', '商品管理', '管理商品信息', 'products', 'manage', NOW(), NOW()),
('perm_003', 'perm_003', '訂單管理', '管理訂單流程', 'orders', 'manage', NOW(), NOW()),
('perm_004', 'perm_004', '系統設定', '系統配置管理', 'system', 'configure', NOW(), NOW());

-- 9. 創建角色
INSERT INTO roles (role_id, public_id, name, description, created_at, updated_at) VALUES
('role_001', 'role_001', '管理員', '系統管理員，擁有所有權限', NOW(), NOW()),
('role_002', 'role_002', '客服', '客服人員，處理訂單和用戶問題', NOW(), NOW()),
('role_003', 'role_003', '商品管理員', '負責商品信息管理', NOW(), NOW());

-- 10. 分配角色權限
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
('role_001', 'perm_001', NOW()),
('role_001', 'perm_002', NOW()),
('role_001', 'perm_003', NOW()),
('role_001', 'perm_004', NOW()),
('role_002', 'perm_003', NOW()),
('role_003', 'perm_002', NOW());

-- 11. 分配用戶角色
INSERT INTO user_roles (user_id, role_id, created_at) VALUES
('user_001', 'role_001', NOW()),
('user_004', 'role_002', NOW());

-- 12. 創建購物車項目
INSERT INTO cart_items (cart_item_id, public_id, user_id, product_id, quantity, created_at, updated_at) VALUES
('cart_001', 'cart_001', 'user_002', 'prod_002', 1, NOW(), NOW()),
('cart_002', 'cart_002', 'user_003', 'prod_005', 2, NOW(), NOW());

-- 完成初始化
SELECT '測試數據初始化完成！' as message;
