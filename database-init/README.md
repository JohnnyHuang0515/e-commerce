# 資料庫初始化腳本說明

## 概述

本目錄包含電商系統的資料庫初始化腳本，確保系統能夠正確部署和運行。

## 檔案說明

### `postgresql-init.sql`
主要的 PostgreSQL 資料庫初始化腳本，包含：

1. **基本表結構**：
   - Users 表（包含 public_id 欄位）
   - User_Address 表
   - Categories 表
   - Products 表
   - Cart 表
   - Orders 相關表
   - Payments 相關表
   - Shipments 相關表
   - Coupons 表

2. **RBAC 權限系統**：
   - permissions 表（權限定義）
   - roles 表（角色定義）
   - user_roles 表（用戶角色關聯）
   - role_permissions 表（角色權限關聯）

3. **種子資料**：
   - 管理員帳號：`admin@ecommerce.com` / `password123`
   - 測試用戶：`test1@example.com` / `password123`
   - 基本商品分類和商品
   - 優惠券資料

## 使用方法

### 1. 使用 Docker 執行初始化

```bash
# 確保 PostgreSQL 容器正在運行
docker ps | grep postgresql

# 執行初始化腳本
docker exec -i ecommerce-postgresql psql -U admin -d ecommerce_transactions < database-init/postgresql-init.sql
```

### 2. 手動執行

```bash
# 連接到資料庫
psql -h localhost -U admin -d ecommerce_transactions

# 執行腳本
\i database-init/postgresql-init.sql
```

## 預設帳號

初始化完成後，可以使用以下帳號登入：

| 角色 | Email | Password | 權限 |
|------|-------|----------|------|
| 管理員 | admin@ecommerce.com | password123 | 所有權限 |
| 測試用戶 | test1@example.com | password123 | 客戶權限 |
| 測試用戶 | test2@example.com | password123 | 客戶權限 |

## 權限系統

### 電商權限系統

#### 商品相關權限
- `create_product` - 建立商品
- `read_product` - 查看商品
- `update_product` - 更新商品
- `delete_product` - 刪除商品

#### 訂單相關權限
- `create_order` - 建立訂單
- `read_order` - 查看訂單
- `update_order` - 更新訂單
- `update_order_status` - 更新訂單狀態
- `delete_order` - 刪除訂單

#### 用戶相關權限
- `manage_users` - 管理用戶
- `assign_roles` - 分配角色

#### 退貨相關權限
- `request_return` - 申請退貨
- `process_return` - 處理退貨
- `refund_orders` - 退款處理

#### 報表相關權限
- `view_reports` - 查看報表
- `query_clickhouse` - 查詢分析數據

### 電商角色系統

| 角色 | 權限 | 說明 |
|------|------|------|
| **顧客 (Customer)** | | |
| | `read_product` | 瀏覽商品 |
| | `create_order` | 下單購買 |
| | `request_return` | 申請退貨 |
| **賣家 (Seller)** | | |
| | `create_product` | 建立商品 |
| | `update_product` | 更新商品 |
| | `read_order` | 查看訂單 |
| | `update_order` | 處理訂單 |
| **物流 (Logistics)** | | |
| | `read_order` | 查看訂單 |
| | `update_order_status` | 更新配送狀態 |
| **管理員 (Admin)** | | |
| | `manage_users` | 管理用戶 |
| | `refund_orders` | 退款處理 |
| | `assign_roles` | 分配角色 |
| | `*` | 所有權限 |
| **分析人員 (Analyst)** | | |
| | `view_reports` | 查看報表 |
| | `query_clickhouse` | 查詢分析數據 |

## 注意事項

1. **密碼安全**：生產環境請務必更改預設密碼
2. **資料庫名稱**：腳本使用 `ecommerce_transactions` 作為資料庫名稱
3. **用戶權限**：腳本會建立 `ecommerce_user` 用戶並授予必要權限
4. **UUID 支援**：腳本會自動啟用 `uuid-ossp` 擴展

## 故障排除

### 常見問題

1. **"column public_id does not exist"**
   - 解決方案：重新執行完整的初始化腳本

2. **"relation user_roles does not exist"**
   - 解決方案：確保 RBAC 系統表已建立

3. **登入失敗**
   - 檢查用戶是否存在：`SELECT * FROM users WHERE email = 'admin@ecommerce.com';`
   - 檢查密碼 hash 是否正確

### 驗證初始化

執行以下查詢驗證初始化是否成功：

```sql
-- 檢查用戶和權限
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
```

## 更新記錄

- **2024-01-XX**: 添加 public_id 欄位支援
- **2024-01-XX**: 建立完整的 RBAC 權限系統
- **2024-01-XX**: 添加管理員帳號和測試資料