# 🚀 電商平台資料庫架構升級指南

## 📋 概述

本指南說明如何將現有的電商系統資料庫升級到新的多資料庫架構，實現 PostgreSQL + MongoDB + Redis + ClickHouse + Milvus + MinIO 的整合設計。

## 🎯 升級目標

### 新架構特色
- **雙層主鍵設計**: BIGINT (內部) + UUID (對外)
- **完整 RBAC 系統**: 支援多角色權限控制
- **多資料庫分工**: 各司其職，效能最佳化
- **AI 整合**: 行為追蹤、特徵工程、推薦系統

### 資料庫分工
| 資料庫 | 用途 | 主要功能 |
|--------|------|----------|
| PostgreSQL | 核心交易數據 | 用戶、商品、訂單、支付、RBAC |
| MongoDB | 非結構化數據 | 用戶行為、評論、特徵向量、推薦 |
| Redis | 快取與 Session | 購物車、權限快取、熱門商品 |
| ClickHouse | 分析數據 | 行為事件、流量分析、報表 |
| Milvus | 向量檢索 | AI 相似商品檢索 |
| MinIO | 物件儲存 | 商品圖片、影片、文件 |

## 📁 檔案結構

```
scripts/
├── new-database-schema.sql      # 新的 PostgreSQL 架構
├── mongodb-collections-init.js  # MongoDB 集合初始化
├── mongodb-rbac-setup.js        # MongoDB RBAC 設定
├── data-migration.sql           # 數據遷移腳本
├── integration-test.sql          # 整合測試腳本
└── deploy-database.sh           # 自動部署腳本
```

## 🚀 快速部署

### 方法一：自動部署 (推薦)
```bash
# 執行自動部署腳本
./scripts/deploy-database.sh
```

### 方法二：手動部署
```bash
# 1. 啟動服務
docker compose up -d

# 2. 等待服務就緒
sleep 30

# 3. 部署 PostgreSQL 架構
docker compose exec ecommerce-postgresql psql -U postgres -d ecommerce -f /docker-entrypoint-initdb.d/new-database-schema.sql

# 4. 執行數據遷移
docker compose exec ecommerce-postgresql psql -U postgres -d ecommerce -f /docker-entrypoint-initdb.d/data-migration.sql

# 5. 初始化 MongoDB
docker compose exec ecommerce-mongodb mongosh /docker-entrypoint-initdb.d/mongodb-collections-init.js

# 6. 設定 MongoDB RBAC
docker compose exec ecommerce-mongodb mongosh /docker-entrypoint-initdb.d/mongodb-rbac-setup.js

# 7. 執行整合測試
docker compose exec ecommerce-postgresql psql -U postgres -d ecommerce -f /docker-entrypoint-initdb.d/integration-test.sql
```

## 🔧 主要變更

### 1. PostgreSQL 架構變更

#### 雙層主鍵設計
```sql
-- 舊設計 (UUID 主鍵)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ...
);

-- 新設計 (BIGINT 內部 + UUID 對外)
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    ...
);
```

#### RBAC 權限系統
```sql
-- 統一權限命名 (動詞_資源格式)
INSERT INTO permissions (permission_name, resource, action) VALUES
('view_products', 'products', 'read'),
('create_product', 'products', 'create'),
('manage_cart', 'cart', 'manage');
```

#### 新增表格
- `cart` / `cart_items` - 購物車系統
- `wishlist` - 心願單
- `shipments` - 物流追蹤
- 優化的 `user_address` - 多地址管理

### 2. MongoDB 集合設計

#### 核心集合
```javascript
// 用戶行為事件
db.user_events.insertOne({
  user_id: 1,
  event_type: "product_view",
  product_id: 123,
  event_data: { ... },
  created_at: new Date()
});

// 商品評論
db.reviews.insertOne({
  review_id: "uuid-xxxx",
  product_id: 123,
  user_id: 456,
  rating: 5,
  comment: "Great product!"
});

// AI 特徵向量
db.user_features.insertOne({
  user_id: 456,
  features: {
    preferences: ["electronics", "smartphones"],
    behavior_score: 0.85
  },
  version: "v1.0"
});
```

#### MongoDB RBAC
```javascript
// 創建角色
db.createRole({
  role: "ecommerce_customer",
  privileges: [
    { resource: { db: "ecommerce", collection: "user_events" }, actions: ["find", "insert"] },
    { resource: { db: "ecommerce", collection: "reviews" }, actions: ["find", "insert"] }
  ]
});
```

## 🔐 RBAC 權限矩陣

### 角色與權限對應
| 角色 | 核心權限 |
|------|----------|
| Customer | view_products, create_order, manage_cart, write_review |
| Seller | create_product, update_product, manage_inventory, view_orders |
| Logistics | update_order_status, manage_logistics, view_logistics_reports |
| Admin | manage_users, assign_roles, view_all_reports, manage_system_settings |
| Analyst | view_reports, query_analytics, export_data, view_ai_insights |

### 權限檢查流程
```javascript
// 應用層權限檢查
const checkPermission = (permission) => {
  return async (req, res, next) => {
    const userPermissions = user.permissions || [];
    if (!userPermissions.includes(permission) && userPermissions !== '*') {
      return res.status(403).json({ error: '權限不足' });
    }
    next();
  };
};
```

## 📊 數據遷移

### 遷移策略
1. **備份現有數據** - 創建備份表
2. **結構轉換** - UUID 主鍵 → BIGINT + UUID
3. **數據映射** - 保持數據完整性
4. **關係重建** - 重新建立外鍵關係
5. **驗證檢查** - 確保數據一致性

### 遷移腳本功能
- 自動備份現有數據
- 智能數據類型轉換
- 外鍵關係重建
- 數據完整性驗證
- 回滾支援

## 🧪 測試與驗證

### 整合測試項目
1. **功能測試** - 用戶註冊、商品創建、訂單流程
2. **權限測試** - RBAC 權限檢查
3. **數據一致性** - 外鍵約束、數據完整性
4. **性能測試** - 索引效能、查詢速度
5. **多資料庫整合** - PostgreSQL + MongoDB 協作

### 測試結果驗證
```sql
-- 檢查數據完整性
SELECT 'Data Integrity Check' as test_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as result
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_id IS NULL;
```

## 🔍 監控與維護

### 服務狀態檢查
```bash
# 檢查所有服務
docker compose ps

# 查看服務日誌
docker compose logs -f ecommerce-postgresql
docker compose logs -f ecommerce-mongodb

# 檢查資料庫連接
docker compose exec ecommerce-postgresql pg_isready
docker compose exec ecommerce-mongodb mongosh --eval "db.runCommand('ping')"
```

### 性能監控
```sql
-- PostgreSQL 性能查詢
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- 索引使用情況
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

## 🚨 故障排除

### 常見問題

#### 1. PostgreSQL 端口衝突
```bash
# 停止系統 PostgreSQL
sudo systemctl stop postgresql

# 或修改 docker-compose.yml 中的端口映射
ports:
  - "5433:5432"  # 使用不同端口
```

#### 2. MongoDB 連接問題
```bash
# 檢查 MongoDB 容器狀態
docker compose exec ecommerce-mongodb mongosh --eval "db.runCommand('ping')"

# 重啟 MongoDB 服務
docker compose restart ecommerce-mongodb
```

#### 3. 權限檢查失敗
```sql
-- 檢查用戶權限
SELECT u.email, r.role_name, p.permission_name
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE u.email = 'test@example.com';
```

## 📈 性能優化

### 索引策略
- **主鍵索引** - 自動創建
- **外鍵索引** - 提升 JOIN 效能
- **複合索引** - 根據查詢模式優化
- **部分索引** - 針對特定條件

### 快取策略
- **Redis 快取** - 用戶權限、購物車、熱門商品
- **應用層快取** - 商品資訊、分類數據
- **CDN 快取** - 靜態資源、圖片

## 🔄 回滾計劃

### 緊急回滾
```bash
# 停止新服務
docker compose down

# 恢復舊架構
docker compose -f docker-compose.old.yml up -d

# 恢復數據備份
docker compose exec ecommerce-postgresql psql -U postgres -d ecommerce -f backup.sql
```

### 數據回滾
```sql
-- 從備份表恢復數據
INSERT INTO users SELECT * FROM users_backup;
INSERT INTO products SELECT * FROM products_backup;
INSERT INTO orders SELECT * FROM orders_backup;
```

## 📞 支援與聯絡

### 技術支援
- 查看日誌: `docker compose logs -f`
- 檢查狀態: `docker compose ps`
- 測試連接: 執行 `integration-test.sql`

### 相關文件
- [資料庫架構設計](docs/database-architecture-design.md)
- [RBAC 權限矩陣](docs/rbac-permissions-matrix.md)
- [實施路線圖](docs/implementation-roadmap.md)

---

**注意**: 在生產環境部署前，請務必在測試環境完整測試所有功能，並準備好回滾計劃。
