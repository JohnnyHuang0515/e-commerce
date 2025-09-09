-- 修正資料庫結構以符合設計文檔
-- 這個腳本會修正現有表格的結構問題

-- 1. 修正 users 表結構
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS role_id INTEGER;

-- 2. 修正 roles 表結構
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 3. 修正 permissions 表結構
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS resource VARCHAR(100),
ADD COLUMN IF NOT EXISTS action VARCHAR(100),
ADD COLUMN IF NOT EXISTS module VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 4. 創建 user_profiles 表 (如果不存在)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- 5. 創建 user_roles 表 (如果不存在)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- 6. 創建 system_logs 表 (如果不存在)
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
    message TEXT NOT NULL,
    module VARCHAR(100),
    user_id INTEGER REFERENCES users(id),
    ip VARCHAR(45),
    user_agent TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 創建 files 表 (如果不存在)
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(500) NOT NULL,
    url VARCHAR(500),
    uploaded_by INTEGER REFERENCES users(id),
    category VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 更新現有數據
UPDATE permissions SET display_name = '創建用戶' WHERE name = 'users:create' AND display_name IS NULL;
UPDATE permissions SET display_name = '查看用戶' WHERE name = 'users:read' AND display_name IS NULL;
UPDATE permissions SET display_name = '更新用戶' WHERE name = 'users:update' AND display_name IS NULL;
UPDATE permissions SET display_name = '刪除用戶' WHERE name = 'users:delete' AND display_name IS NULL;
UPDATE permissions SET display_name = '創建商品' WHERE name = 'products:create' AND display_name IS NULL;
UPDATE permissions SET display_name = '查看商品' WHERE name = 'products:read' AND display_name IS NULL;
UPDATE permissions SET display_name = '更新商品' WHERE name = 'products:update' AND display_name IS NULL;
UPDATE permissions SET display_name = '刪除商品' WHERE name = 'products:delete' AND display_name IS NULL;
UPDATE permissions SET display_name = '創建訂單' WHERE name = 'orders:create' AND display_name IS NULL;
UPDATE permissions SET display_name = '查看訂單' WHERE name = 'orders:read' AND display_name IS NULL;
UPDATE permissions SET display_name = '更新訂單' WHERE name = 'orders:update' AND display_name IS NULL;
UPDATE permissions SET display_name = '刪除訂單' WHERE name = 'orders:delete' AND display_name IS NULL;
UPDATE permissions SET display_name = '查看分析' WHERE name = 'analytics:read' AND display_name IS NULL;
UPDATE permissions SET display_name = '系統管理' WHERE name = 'system:manage' AND display_name IS NULL;
UPDATE permissions SET display_name = '支付管理' WHERE name = 'payments:manage' AND display_name IS NULL;
UPDATE permissions SET display_name = '物流管理' WHERE name = 'logistics:manage' AND display_name IS NULL;
UPDATE permissions SET display_name = '庫存管理' WHERE name = 'inventory:manage' AND display_name IS NULL;

-- 9. 更新 permissions 表的其他欄位
UPDATE permissions SET resource = split_part(name, ':', 1) WHERE resource IS NULL;
UPDATE permissions SET action = split_part(name, ':', 2) WHERE action IS NULL;
UPDATE permissions SET module = split_part(name, ':', 1) WHERE module IS NULL;

-- 10. 更新 roles 表的 is_system 欄位
UPDATE roles SET is_system = true WHERE name IN ('ADMIN', 'MERCHANT', 'STAFF', 'CUSTOMER', 'GUEST');

-- 11. 創建管理員用戶 (如果不存在)
INSERT INTO users (email, password, name, role, status, email_verified_at)
VALUES ('admin@ecommerce.com', '$2b$10$rQZ8K9vXqH2nM3pL4sT5uO6wE7yF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8', '系統管理員', 'ADMIN', 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- 12. 為管理員分配 ADMIN 角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@ecommerce.com' AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 13. 創建必要的索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

COMMIT;
