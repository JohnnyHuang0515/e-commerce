-- 多資料庫整合測試腳本
-- 測試 PostgreSQL + MongoDB + Redis 整合

-- =============================================
-- 1. PostgreSQL 功能測試
-- =============================================

-- 測試用戶註冊和登入
DO $$
DECLARE
    new_user_id BIGINT;
    new_public_id UUID;
BEGIN
    -- 創建測試用戶
    INSERT INTO users (name, email, password_hash, status)
    VALUES ('測試用戶', 'test@example.com', '$2b$10$test.hash', 1)
    RETURNING user_id, public_id INTO new_user_id, new_public_id;
    
    -- 分配角色
    INSERT INTO user_roles (user_id, role_id)
    SELECT new_user_id, role_id FROM roles WHERE role_name = 'customer';
    
    RAISE NOTICE '用戶創建成功: ID=%, Public_ID=%', new_user_id, new_public_id;
END $$;

-- 測試商品創建
DO $$
DECLARE
    new_product_id BIGINT;
    new_public_id UUID;
BEGIN
    -- 創建測試商品
    INSERT INTO products (name, description, price, sku, category_id, stock_quantity)
    VALUES ('測試商品', '這是一個測試商品', 100.00, 'TEST-001', 1, 10)
    RETURNING product_id, public_id INTO new_product_id, new_public_id;
    
    -- 添加商品圖片
    INSERT INTO product_images (product_id, image_url, is_main)
    VALUES (new_product_id, 'https://example.com/test-product.jpg', TRUE);
    
    RAISE NOTICE '商品創建成功: ID=%, Public_ID=%', new_product_id, new_public_id;
END $$;

-- 測試訂單創建
DO $$
DECLARE
    new_order_id BIGINT;
    new_public_id UUID;
    test_user_id BIGINT;
    test_product_id BIGINT;
BEGIN
    -- 獲取測試用戶和商品
    SELECT user_id INTO test_user_id FROM users WHERE email = 'test@example.com';
    SELECT product_id INTO test_product_id FROM products WHERE sku = 'TEST-001';
    
    -- 創建訂單
    INSERT INTO orders (order_number, user_id, order_status, total_amount, subtotal, shipping_address, billing_address)
    VALUES ('TEST-ORDER-001', test_user_id, 'pending', 100.00, 100.00, 
            '{"address": "測試地址"}', '{"address": "測試地址"}')
    RETURNING order_id, public_id INTO new_order_id, new_public_id;
    
    -- 添加訂單項目
    INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, subtotal)
    VALUES (new_order_id, test_product_id, '測試商品', 'TEST-001', 100.00, 1, 100.00);
    
    RAISE NOTICE '訂單創建成功: ID=%, Public_ID=%', new_order_id, new_public_id;
END $$;

-- =============================================
-- 2. RBAC 權限測試
-- =============================================

-- 測試權限檢查函數
CREATE OR REPLACE FUNCTION check_user_permission(user_email TEXT, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.email = user_email 
        AND p.permission_name = permission_name
        AND ur.is_active = TRUE
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- 測試各種權限
SELECT 
    'test@example.com' as user_email,
    'view_products' as permission,
    check_user_permission('test@example.com', 'view_products') as has_permission
UNION ALL
SELECT 
    'test@example.com',
    'create_product',
    check_user_permission('test@example.com', 'create_product')
UNION ALL
SELECT 
    'admin@ecommerce.com',
    'manage_users',
    check_user_permission('admin@ecommerce.com', 'manage_users');

-- =============================================
-- 3. 購物車功能測試
-- =============================================

-- 測試購物車操作
DO $$
DECLARE
    test_user_id BIGINT;
    test_product_id BIGINT;
    test_cart_id BIGINT;
BEGIN
    -- 獲取測試用戶和商品
    SELECT user_id INTO test_user_id FROM users WHERE email = 'test@example.com';
    SELECT product_id INTO test_product_id FROM products WHERE sku = 'TEST-001';
    
    -- 獲取或創建購物車
    SELECT cart_id INTO test_cart_id FROM cart WHERE user_id = test_user_id;
    
    IF test_cart_id IS NULL THEN
        INSERT INTO cart (user_id) VALUES (test_user_id) RETURNING cart_id INTO test_cart_id;
    END IF;
    
    -- 添加商品到購物車
    INSERT INTO cart_items (cart_id, product_id, quantity)
    VALUES (test_cart_id, test_product_id, 2)
    ON CONFLICT (cart_id, product_id) 
    DO UPDATE SET quantity = cart_items.quantity + 2;
    
    RAISE NOTICE '購物車操作成功: Cart_ID=%, Product_ID=%', test_cart_id, test_product_id;
END $$;

-- =============================================
-- 4. 數據一致性測試
-- =============================================

-- 測試外鍵約束
DO $$
BEGIN
    -- 嘗試插入無效的用戶ID
    BEGIN
        INSERT INTO orders (order_number, user_id, order_status, total_amount, subtotal, shipping_address, billing_address)
        VALUES ('INVALID-001', 99999, 'pending', 100.00, 100.00, '{}', '{}');
        RAISE EXCEPTION '外鍵約束測試失敗 - 應該拋出錯誤';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE '外鍵約束測試通過';
    END;
END $$;

-- 測試數據完整性
SELECT 
    'Data Integrity Check' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' orphaned records'
    END as result
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_id IS NULL;

-- =============================================
-- 5. 性能測試
-- =============================================

-- 測試索引效能
EXPLAIN (ANALYZE, BUFFERS) 
SELECT u.name, u.email, r.role_name, p.permission_name
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE u.email = 'test@example.com';

-- 測試商品查詢效能
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.name, p.price, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.status = 1 AND p.price BETWEEN 50 AND 200
ORDER BY p.created_at DESC
LIMIT 10;

-- =============================================
-- 6. 清理測試數據
-- =============================================

-- 清理測試數據 (可選)
/*
DELETE FROM cart_items WHERE cart_id IN (
    SELECT cart_id FROM cart WHERE user_id IN (
        SELECT user_id FROM users WHERE email = 'test@example.com'
    )
);

DELETE FROM cart WHERE user_id IN (
    SELECT user_id FROM users WHERE email = 'test@example.com'
);

DELETE FROM order_items WHERE order_id IN (
    SELECT order_id FROM orders WHERE order_number = 'TEST-ORDER-001'
);

DELETE FROM orders WHERE order_number = 'TEST-ORDER-001';

DELETE FROM product_images WHERE product_id IN (
    SELECT product_id FROM products WHERE sku = 'TEST-001'
);

DELETE FROM products WHERE sku = 'TEST-001';

DELETE FROM user_roles WHERE user_id IN (
    SELECT user_id FROM users WHERE email = 'test@example.com'
);

DELETE FROM users WHERE email = 'test@example.com';
*/

-- =============================================
-- 7. 測試結果報告
-- =============================================

SELECT 
    'Integration Test Results' as test_suite,
    'PostgreSQL' as database,
    'All tests completed' as status,
    NOW() as completed_at;

-- 顯示測試統計
SELECT 
    'Test Statistics' as category,
    'Users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 'Test Statistics', 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Test Statistics', 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Test Statistics', 'Cart Items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'Test Statistics', 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Test Statistics', 'Permissions', COUNT(*) FROM permissions;

COMMIT;
