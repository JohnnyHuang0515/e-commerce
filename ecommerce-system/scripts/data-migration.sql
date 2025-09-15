-- 數據遷移腳本
-- 從舊架構遷移到新架構

-- =============================================
-- 1. 備份現有數據 (如果需要的話)
-- =============================================

-- 創建備份表
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products;
CREATE TABLE IF NOT EXISTS orders_backup AS SELECT * FROM orders;

-- =============================================
-- 2. 遷移用戶數據
-- =============================================

-- 遷移用戶表 (從 UUID 主鍵改為 BIGINT + UUID)
INSERT INTO users (public_id, name, email, password_hash, phone, status, email_verified_at, last_login_at, created_at, updated_at)
SELECT 
    id as public_id,
    name,
    email,
    password as password_hash,
    NULL as phone,
    CASE 
        WHEN status = 'active' THEN 1
        WHEN status = 'inactive' THEN 0
        WHEN status = 'suspended' THEN 2
        ELSE 1
    END as status,
    email_verified_at,
    last_login_at,
    created_at,
    updated_at
FROM users_backup
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE users.public_id = users_backup.id
);

-- 遷移用戶資料表
INSERT INTO user_address (public_id, user_id, recipient_name, address_line, city, postal_code, country, phone, is_default, created_at, updated_at)
SELECT 
    uuid_generate_v4() as public_id,
    u.user_id,
    COALESCE(up.first_name || ' ' || up.last_name, up.first_name, up.last_name, '收件人') as recipient_name,
    COALESCE(up.address, '未設定地址') as address_line,
    COALESCE(up.city, '台北市') as city,
    COALESCE(up.postal_code, '100') as postal_code,
    COALESCE(up.country, 'Taiwan') as country,
    up.phone,
    TRUE as is_default,
    up.created_at,
    up.updated_at
FROM user_profiles up
JOIN users_backup ub ON up.user_id = ub.id
JOIN users u ON u.public_id = ub.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_address ua WHERE ua.user_id = u.user_id
);

-- =============================================
-- 3. 遷移商品數據
-- =============================================

-- 遷移商品分類
INSERT INTO categories (public_id, name, description, parent_id, level, sort_order, status, created_at, updated_at)
SELECT 
    id as public_id,
    name,
    description,
    parent_id,
    level,
    sort_order,
    CASE WHEN status = 'active' THEN 1 ELSE 0 END as status,
    created_at,
    updated_at
FROM categories_backup
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE categories.public_id = categories_backup.id
);

-- 遷移商品
INSERT INTO products (public_id, name, description, price, original_price, sku, category_id, brand, status, stock_quantity, view_count, sales_count, rating, review_count, created_at, updated_at)
SELECT 
    p.id as public_id,
    p.name,
    p.description,
    p.price,
    p.original_price,
    p.sku,
    c.category_id,
    p.brand,
    CASE 
        WHEN p.status = 'active' THEN 1
        WHEN p.status = 'inactive' THEN 0
        WHEN p.status = 'sold_out' THEN 2
        ELSE 1
    END as status,
    COALESCE(i.quantity, 0) as stock_quantity,
    p.view_count,
    p.sales_count,
    p.rating,
    p.review_count,
    p.created_at,
    p.updated_at
FROM products_backup p
LEFT JOIN categories_backup cb ON p.category_id = cb.id
LEFT JOIN categories c ON c.public_id = cb.id
LEFT JOIN inventory i ON i.product_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE products.public_id = p.id
);

-- 遷移商品圖片
INSERT INTO product_images (public_id, product_id, image_url, alt_text, is_main, sort_order, created_at)
SELECT 
    uuid_generate_v4() as public_id,
    pr.product_id,
    unnest(p.images) as image_url,
    pr.name as alt_text,
    CASE WHEN row_number() OVER (PARTITION BY p.id ORDER BY array_position(p.images, unnest(p.images))) = 1 THEN TRUE ELSE FALSE END as is_main,
    row_number() OVER (PARTITION BY p.id ORDER BY array_position(p.images, unnest(p.images))) as sort_order,
    p.created_at
FROM products_backup p
JOIN products pr ON pr.public_id = p.id
WHERE p.images IS NOT NULL AND array_length(p.images, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = pr.product_id
);

-- =============================================
-- 4. 遷移訂單數據
-- =============================================

-- 遷移訂單
INSERT INTO orders (public_id, order_number, user_id, order_status, total_amount, subtotal, tax_amount, shipping_amount, discount_amount, currency, shipping_address, billing_address, notes, created_at, updated_at)
SELECT 
    o.id as public_id,
    o.order_number,
    u.user_id,
    CASE 
        WHEN o.status = 'PENDING' THEN 'pending'
        WHEN o.status = 'PAID' THEN 'paid'
        WHEN o.status = 'PROCESSING' THEN 'paid'
        WHEN o.status = 'SHIPPED' THEN 'shipped'
        WHEN o.status = 'DELIVERED' THEN 'delivered'
        WHEN o.status = 'COMPLETED' THEN 'delivered'
        WHEN o.status = 'CANCELLED' THEN 'canceled'
        WHEN o.status = 'RETURN_REQUESTED' THEN 'delivered'
        WHEN o.status = 'RETURNED' THEN 'delivered'
        ELSE 'pending'
    END as order_status,
    o.total_amount,
    o.subtotal,
    o.tax_amount,
    o.shipping_amount,
    o.discount_amount,
    o.currency,
    o.shipping_address,
    o.billing_address,
    o.notes,
    o.created_at,
    o.updated_at
FROM orders_backup o
JOIN users_backup ub ON o.user_id = ub.id
JOIN users u ON u.public_id = ub.id
WHERE NOT EXISTS (
    SELECT 1 FROM orders WHERE orders.public_id = o.id
);

-- 遷移訂單項目
INSERT INTO order_items (public_id, order_id, product_id, product_name, product_sku, unit_price, quantity, subtotal, created_at)
SELECT 
    oi.id as public_id,
    o.order_id,
    pr.product_id,
    oi.product_name,
    oi.product_sku,
    oi.unit_price,
    oi.quantity,
    oi.total_price as subtotal,
    oi.created_at
FROM order_items_backup oi
JOIN orders_backup ob ON oi.order_id = ob.id
JOIN orders o ON o.public_id = ob.id
LEFT JOIN products_backup pb ON oi.product_id = pb.id
LEFT JOIN products pr ON pr.public_id = pb.id
WHERE NOT EXISTS (
    SELECT 1 FROM order_items WHERE order_items.public_id = oi.id
);

-- =============================================
-- 5. 遷移支付數據
-- =============================================

INSERT INTO payments (public_id, order_id, payment_method, payment_provider, external_payment_id, amount, currency, payment_status, transaction_id, payment_data, processed_at, failed_reason, created_at, updated_at)
SELECT 
    p.id as public_id,
    o.order_id,
    p.payment_method,
    p.payment_provider,
    p.external_payment_id,
    p.amount,
    p.currency,
    CASE 
        WHEN p.status = 'PENDING' THEN 'pending'
        WHEN p.status = 'PROCESSING' THEN 'pending'
        WHEN p.status = 'SUCCESS' THEN 'success'
        WHEN p.status = 'FAILED' THEN 'failed'
        WHEN p.status = 'CANCELLED' THEN 'failed'
        WHEN p.status = 'REFUNDED' THEN 'success'
        ELSE 'pending'
    END as payment_status,
    p.transaction_id,
    p.payment_data,
    p.processed_at,
    p.failed_reason,
    p.created_at,
    p.updated_at
FROM payments_backup p
JOIN orders_backup ob ON p.order_id = ob.id
JOIN orders o ON o.public_id = ob.id
WHERE NOT EXISTS (
    SELECT 1 FROM payments WHERE payments.public_id = p.id
);

-- =============================================
-- 6. 遷移物流數據
-- =============================================

INSERT INTO shipments (public_id, order_id, carrier, tracking_number, shipping_method, shipping_cost, shipping_address, estimated_delivery, shipped_at, delivered_at, tracking_data, notes, created_at, updated_at)
SELECT 
    l.id as public_id,
    o.order_id,
    l.carrier,
    l.tracking_number,
    l.shipping_method,
    l.shipping_cost,
    l.shipping_address,
    l.estimated_delivery,
    l.shipped_at,
    l.delivered_at,
    l.tracking_data,
    l.notes,
    l.created_at,
    l.updated_at
FROM logistics_backup l
JOIN orders_backup ob ON l.order_id = ob.id
JOIN orders o ON o.public_id = ob.id
WHERE NOT EXISTS (
    SELECT 1 FROM shipments WHERE shipments.public_id = l.id
);

-- =============================================
-- 7. 遷移 RBAC 數據
-- =============================================

-- 遷移角色
INSERT INTO roles (public_id, role_name, description, created_at, updated_at)
SELECT 
    id as public_id,
    name as role_name,
    description,
    created_at,
    updated_at
FROM roles_backup
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE roles.public_id = roles_backup.id
);

-- 遷移權限
INSERT INTO permissions (public_id, permission_name, description, resource, action, created_at, updated_at)
SELECT 
    id as public_id,
    name as permission_name,
    description,
    resource,
    action,
    created_at,
    updated_at
FROM permissions_backup
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permissions.public_id = permissions_backup.id
);

-- 遷移角色權限關聯
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
    r.role_id,
    p.permission_id,
    rp.granted_at as created_at
FROM role_permissions_backup rp
JOIN roles_backup rb ON rp.role_id = rb.id
JOIN roles r ON r.public_id = rb.id
JOIN permissions_backup pb ON rp.permission_id = pb.id
JOIN permissions p ON p.public_id = pb.id
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions WHERE role_permissions.role_id = r.role_id AND role_permissions.permission_id = p.permission_id
);

-- 遷移用戶角色關聯
INSERT INTO user_roles (user_id, role_id, assigned_at, expires_at, is_active, created_at, updated_at)
SELECT 
    u.user_id,
    r.role_id,
    ur.assigned_at,
    ur.expires_at,
    ur.is_active,
    ur.created_at,
    ur.updated_at
FROM user_roles_backup ur
JOIN users_backup ub ON ur.user_id = ub.id
JOIN users u ON u.public_id = ub.id
JOIN roles_backup rb ON ur.role_id = rb.id
JOIN roles r ON r.public_id = rb.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = u.user_id AND user_roles.role_id = r.role_id
);

-- =============================================
-- 8. 創建購物車和心願單 (為現有用戶)
-- =============================================

-- 為所有用戶創建購物車
INSERT INTO cart (public_id, user_id, created_at, updated_at)
SELECT 
    uuid_generate_v4() as public_id,
    u.user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM cart WHERE cart.user_id = u.user_id
);

-- =============================================
-- 9. 數據驗證
-- =============================================

-- 檢查遷移結果
SELECT 'Users migrated' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products migrated', COUNT(*) FROM products
UNION ALL
SELECT 'Orders migrated', COUNT(*) FROM orders
UNION ALL
SELECT 'Order items migrated', COUNT(*) FROM order_items
UNION ALL
SELECT 'Payments migrated', COUNT(*) FROM payments
UNION ALL
SELECT 'Shipments migrated', COUNT(*) FROM shipments
UNION ALL
SELECT 'Roles migrated', COUNT(*) FROM roles
UNION ALL
SELECT 'Permissions migrated', COUNT(*) FROM permissions
UNION ALL
SELECT 'Cart created', COUNT(*) FROM cart;

-- 檢查數據完整性
SELECT 
    'Data integrity check' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - ' || COUNT(*) || ' orphaned records'
    END as result
FROM orders o
LEFT JOIN users u ON o.user_id = u.user_id
WHERE u.user_id IS NULL;

COMMIT;
