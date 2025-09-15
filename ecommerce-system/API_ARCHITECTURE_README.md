# 🚀 電商平台統一 API 架構

## 📋 概述

本專案已重構為統一的 Node.js 主服務架構，支援雙層主鍵設計與完整的 RBAC 權限系統，整合多種資料庫技術。

## 🏗️ 架構特點

### ✅ 統一服務架構
- **單一入口**: 所有 API 通過統一的 Node.js 服務提供
- **微服務整合**: 支援 FastAPI 微服務擴展
- **負載均衡**: Nginx 反向代理和負載均衡
- **容器化部署**: Docker Compose 多容器管理

### ✅ 雙層主鍵設計
- **內部主鍵**: BIGINT (高效能、適合高併發)
- **對外公開 ID**: UUID/ULID (安全、唯一)
- **ID 映射工具**: 自動處理內外部 ID 轉換
- **批量操作**: 支援批量 ID 映射和操作

### ✅ 完整 RBAC 權限系統
- **角色管理**: 6 種預設角色 (Customer, Seller, Logistics, Admin, Analyst, Customer Service)
- **權限控制**: 26 種細粒度權限
- **動態權限**: 支援動態權限分配和回收
- **快取機制**: Redis 權限快取，提升性能

### ✅ 多資料庫整合
- **PostgreSQL**: 核心交易數據、關聯表、RBAC
- **MongoDB**: 商品描述、彈性屬性、用戶評論、推薦 JSON
- **Redis**: Session、購物車快取、熱銷商品快取、RBAC 快取
- **ClickHouse**: 行為事件、分析型報表、AI 分析結果
- **Milvus**: 商品/使用者向量、AI 相似商品檢索
- **MinIO**: 商品圖片、影片、退貨憑證

## 📁 專案結構

```
ecommerce-system/
├── backend-node/                    # 統一 Node.js 主服務
│   ├── app.js                       # Express 主應用程式
│   ├── config/
│   │   └── database.js              # 多資料庫連接配置
│   ├── middleware/
│   │   ├── rbac.js                  # RBAC 權限中間件
│   │   └── errorHandler.js          # 錯誤處理中間件
│   ├── utils/
│   │   └── idMapper.js              # 雙層主鍵映射工具
│   ├── routes/
│   │   ├── auth.js                  # 認證路由
│   │   ├── users.js                 # 用戶管理路由
│   │   ├── products.js              # 商品管理路由
│   │   ├── orders.js                # 訂單管理路由
│   │   ├── cart.js                  # 購物車路由
│   │   └── recommendations.js       # 推薦服務路由
│   ├── services/                    # 業務邏輯層
│   ├── tests/                       # 測試檔案
│   ├── Dockerfile                   # Docker 映像配置
│   ├── package.json                 # Node.js 依賴
│   └── env.example                  # 環境變數範例
├── backend-fastapi/                 # FastAPI 微服務
├── nginx/                           # Nginx 配置
│   └── nginx.conf                   # 反向代理配置
├── scripts/                         # 部署腳本
│   ├── deploy-api.sh                # API 部署腳本
│   ├── new-database-schema.sql      # PostgreSQL 架構
│   ├── mongodb-collections-init.js  # MongoDB 初始化
│   └── clickhouse-schema.sql        # ClickHouse 架構
├── docker-compose-api.yml           # Docker Compose 配置
└── docs/                            # 文檔
    ├── database-architecture-design.md
    ├── rbac-permissions-matrix.md
    └── implementation-roadmap.md
```

## 🚀 快速開始

### 1. 環境準備

```bash
# 克隆專案
git clone <repository-url>
cd ecommerce-system

# 設置環境變數
cp backend-node/env.example backend-node/.env
# 編輯 .env 檔案，設置資料庫連接資訊
```

### 2. 部署服務

```bash
# 完整部署
./scripts/deploy-api.sh deploy

# 或分步驟部署
./scripts/deploy-api.sh start
```

### 3. 驗證部署

```bash
# 檢查服務狀態
./scripts/deploy-api.sh status

# 查看服務日誌
./scripts/deploy-api.sh logs

# 測試 API
curl http://localhost/health
curl http://localhost/api-docs
```

## 🔧 服務管理

### 基本命令

```bash
# 啟動服務
./scripts/deploy-api.sh start

# 停止服務
./scripts/deploy-api.sh stop

# 重啟服務
./scripts/deploy-api.sh restart

# 查看狀態
./scripts/deploy-api.sh status

# 查看日誌
./scripts/deploy-api.sh logs

# 清理資源
./scripts/deploy-api.sh cleanup
```

### Docker Compose 命令

```bash
# 啟動所有服務
docker compose -f docker-compose-api.yml up -d

# 停止所有服務
docker compose -f docker-compose-api.yml down

# 查看服務狀態
docker compose -f docker-compose-api.yml ps

# 查看服務日誌
docker compose -f docker-compose-api.yml logs -f

# 重啟特定服務
docker compose -f docker-compose-api.yml restart api-node
```

## 📊 API 端點

### 認證服務
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/logout` - 用戶登出
- `GET /api/v1/auth/profile` - 獲取用戶資料
- `PUT /api/v1/auth/change-password` - 修改密碼
- `POST /api/v1/auth/refresh` - 刷新 Token
- `GET /api/v1/auth/permissions` - 獲取用戶權限

### 用戶管理
- `GET /api/v1/users` - 用戶列表
- `GET /api/v1/users/{publicId}` - 用戶詳情
- `POST /api/v1/users` - 創建用戶
- `PUT /api/v1/users/{publicId}` - 更新用戶
- `PUT /api/v1/users/{publicId}/role` - 更新用戶角色
- `DELETE /api/v1/users/{publicId}` - 刪除用戶
- `GET /api/v1/users/overview` - 用戶概覽統計

### 商品管理
- `GET /api/v1/products` - 商品列表
- `GET /api/v1/products/{publicId}` - 商品詳情
- `POST /api/v1/products` - 創建商品
- `PUT /api/v1/products/{publicId}` - 更新商品
- `DELETE /api/v1/products/{publicId}` - 刪除商品
- `GET /api/v1/categories` - 分類列表
- `POST /api/v1/categories` - 創建分類

### 訂單管理
- `GET /api/v1/orders` - 訂單列表
- `GET /api/v1/orders/{publicId}` - 訂單詳情
- `POST /api/v1/orders` - 創建訂單
- `PUT /api/v1/orders/{publicId}/status` - 更新訂單狀態
- `POST /api/v1/orders/{publicId}/cancel` - 取消訂單
- `POST /api/v1/orders/{publicId}/refund` - 退款處理

### 購物車
- `GET /api/v1/cart` - 獲取購物車
- `POST /api/v1/cart/items` - 添加商品到購物車
- `PUT /api/v1/cart/items/{itemId}` - 更新購物車項目
- `DELETE /api/v1/cart/items/{itemId}` - 移除購物車項目
- `DELETE /api/v1/cart` - 清空購物車

### 推薦服務
- `GET /api/v1/recommendations` - 獲取推薦商品
- `GET /api/v1/recommendations/similar/{productId}` - 相似商品推薦
- `GET /api/v1/recommendations/personalized` - 個人化推薦

## 🔐 權限系統

### 角色定義

| 角色 | 描述 | 核心權限 |
|------|------|----------|
| **Customer** | 顧客 | view_products, create_order, write_review, manage_cart, manage_wishlist |
| **Seller** | 賣家 | create_product, update_product, delete_product, manage_inventory, view_orders |
| **Logistics** | 物流 | update_order_status, manage_shipments, view_logistics_reports |
| **Admin** | 管理員 | manage_users, process_refund, assign_roles, view_all_reports |
| **Analyst** | 分析人員 | view_reports, query_analytics, export_data, view_ai_insights |
| **Customer Service** | 客服 | view_orders, process_refund, process_return, manage_users |

### 權限檢查

```javascript
// 單一權限檢查
router.get('/products', checkPermission('view_products'), handler);

// 多權限檢查（任一）
router.post('/products', checkAnyPermission(['create_product', 'manage_products']), handler);

// 多權限檢查（全部）
router.delete('/products', checkAllPermissions(['delete_product', 'manage_products']), handler);

// 角色檢查
router.get('/admin', checkRole(['admin', 'analyst']), handler);

// 資源擁有者檢查
router.put('/users/:id', checkResourceOwner('users'), handler);
```

## 🗄️ 資料庫架構

### PostgreSQL (核心交易)
- **用戶系統**: users, user_address, user_roles
- **RBAC 系統**: roles, permissions, role_permissions, user_roles
- **商品系統**: products, categories, product_images
- **訂單系統**: orders, order_items, cart, cart_items
- **支付物流**: payments, shipments

### MongoDB (彈性資料)
- **用戶事件**: user_events (登入、瀏覽、購買行為)
- **商品詳情**: product_details (詳細描述、屬性)
- **用戶評論**: reviews (評論、評分、圖片)
- **推薦結果**: recommendations (AI 推薦結果)
- **特徵向量**: user_features, product_features

### Redis (快取)
- **Session 管理**: 用戶會話快取
- **權限快取**: 用戶權限快取 (1小時)
- **購物車快取**: 購物車數據快取
- **熱銷商品**: 熱銷商品列表快取

### ClickHouse (分析)
- **行為事件**: 用戶行為事件日誌
- **系統日誌**: API 調用日誌
- **分析報表**: 各種統計分析數據

## 🔍 監控與日誌

### 健康檢查
- **API 服務**: `GET /health` - 檢查所有資料庫連接
- **資料庫**: 各資料庫連接狀態檢查
- **容器**: Docker 容器健康檢查

### 日誌系統
- **API 日誌**: Morgan 中間件記錄 HTTP 請求
- **錯誤日誌**: 統一錯誤處理和記錄
- **業務日誌**: 重要業務操作記錄到 MongoDB
- **分析日誌**: 用戶行為記錄到 ClickHouse

### 性能監控
- **響應時間**: API 響應時間監控
- **錯誤率**: API 錯誤率統計
- **資料庫性能**: 連接池使用率監控
- **快取命中率**: Redis 快取命中率統計

## 🛠️ 開發指南

### 添加新路由

1. 在 `routes/` 目錄創建新路由檔案
2. 使用權限中間件保護路由
3. 在 `app.js` 中註冊路由
4. 更新 Swagger 文檔

### 添加新權限

1. 在 `scripts/new-database-schema.sql` 中添加權限定義
2. 在 `docs/rbac-permissions-matrix.md` 中更新權限矩陣
3. 重新部署資料庫架構

### 添加新資料庫

1. 在 `config/database.js` 中添加連接配置
2. 在 `docker-compose-api.yml` 中添加服務配置
3. 更新健康檢查邏輯

## 🚨 故障排除

### 常見問題

1. **端口衝突**
   ```bash
   # 檢查端口使用情況
   netstat -tlnp | grep :8000
   
   # 停止衝突的服務
   sudo systemctl stop <service-name>
   ```

2. **資料庫連接失敗**
   ```bash
   # 檢查資料庫狀態
   docker compose -f docker-compose-api.yml ps
   
   # 查看資料庫日誌
   docker compose -f docker-compose-api.yml logs postgres
   ```

3. **權限檢查失敗**
   ```bash
   # 檢查 Redis 連接
   docker compose -f docker-compose-api.yml exec redis redis-cli ping
   
   # 清除權限快取
   docker compose -f docker-compose-api.yml exec redis redis-cli flushdb
   ```

### 日誌查看

```bash
# 查看所有服務日誌
docker compose -f docker-compose-api.yml logs -f

# 查看特定服務日誌
docker compose -f docker-compose-api.yml logs -f api-node

# 查看 Nginx 日誌
docker compose -f docker-compose-api.yml logs -f nginx
```

## 📈 性能優化

### 資料庫優化
- **索引優化**: 為常用查詢添加適當索引
- **連接池調優**: 根據負載調整連接池大小
- **查詢優化**: 使用 EXPLAIN 分析查詢性能

### 快取策略
- **Redis 快取**: 權限、購物車、熱銷商品快取
- **HTTP 快取**: 靜態資源快取
- **資料庫快取**: 查詢結果快取

### 負載均衡
- **Nginx 負載均衡**: 多個 API 實例負載均衡
- **資料庫讀寫分離**: 讀寫分離提升性能
- **CDN 加速**: 靜態資源 CDN 加速

## 🔒 安全考量

### 認證安全
- **JWT Token**: 安全的 Token 認證機制
- **密碼加密**: bcrypt 密碼加密
- **會話管理**: Redis 會話快取

### 權限安全
- **最小權限原則**: 用戶只獲得必要權限
- **權限分離**: 敏感操作多重驗證
- **審計日誌**: 權限變更審計記錄

### 資料安全
- **SQL 注入防護**: 參數化查詢
- **XSS 防護**: 輸入驗證和輸出編碼
- **CSRF 防護**: CSRF Token 驗證

## 📞 支援

如有問題，請參考：
- **文檔**: `docs/` 目錄下的詳細文檔
- **API 文檔**: http://localhost/api-docs
- **健康檢查**: http://localhost/health
- **日誌**: 使用 `./scripts/deploy-api.sh logs` 查看日誌

---

**版本**: 2.0.0  
**更新日期**: 2025-01-08  
**維護團隊**: Ecommerce Development Team
