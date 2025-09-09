# 🗄️ 資料庫初始化指南

## 📋 概述

本系統使用統一的資料庫初始化腳本，一次性創建所有必要的表格、欄位、索引和初始數據。

## 🚀 快速開始

### 1. 初始化資料庫

```bash
# 執行完整的資料庫初始化
./scripts/init-complete-database.sh
```

### 2. 啟動服務

```bash
# 啟動所有合併服務
cd backend/services/merged-services
./start-all-services.sh
```

## 📊 資料庫架構

### PostgreSQL 表格 (結構化數據)

#### 用戶相關
- `users` - 用戶基本資料
- `user_profiles` - 用戶詳細資料
- `roles` - 角色定義
- `permissions` - 權限定義
- `role_permissions` - 角色權限關聯
- `user_roles` - 用戶角色關聯

#### 商品相關
- `products` - 商品基本資料
- `categories` - 商品分類
- `inventory` - 庫存管理
- `inventory_movements` - 庫存變動記錄

#### 訂單相關
- `orders` - 訂單主表
- `order_items` - 訂單項目
- `payments` - 支付記錄
- `logistics` - 物流資訊

#### 系統相關
- `system_settings` - 系統設定
- `user_settings` - 用戶設定
- `system_logs` - 系統日誌
- `notifications` - 通知管理
- `files` - 檔案管理

### MongoDB 集合 (非結構化數據)

#### 商品相關 (MongoDB)
- `products` - 商品詳細資料 (JSON格式)
- `categories` - 商品分類樹
- `product_reviews` - 商品評價

#### 分析相關 (MongoDB)
- `analytics_data` - 分析數據
- `user_behavior` - 用戶行為
- `sales_reports` - 銷售報告

## 🔧 配置說明

### 環境變數

```bash
# PostgreSQL 配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ecommerce_transactions
POSTGRES_USER=admin
POSTGRES_PASSWORD=password123

# MongoDB 配置
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin
```

### 服務配置

所有合併服務都使用統一的資料庫配置：

- **AUTH-SERVICE**: PostgreSQL + MongoDB
- **PRODUCT-SERVICE**: PostgreSQL + MongoDB  
- **ORDER-SERVICE**: PostgreSQL
- **AI-SERVICE**: MongoDB
- **SYSTEM-SERVICE**: PostgreSQL

## 📝 預設數據

### 管理員用戶
- **Email**: `admin@ecommerce.com`
- **密碼**: `admin123`
- **角色**: `ADMIN`

### 預設角色
- `ADMIN` - 系統管理員 (所有權限)
- `MERCHANT` - 商家 (商品和訂單管理)
- `STAFF` - 員工 (基本操作)
- `CUSTOMER` - 客戶 (客戶權限)
- `GUEST` - 訪客 (只讀權限)

### 預設商品分類
- 電子產品
  - 智慧型手機
  - 筆記型電腦
  - 平板電腦
- 服飾配件
- 家居生活
- 美妝保養
- 運動戶外

## 🔄 重新初始化

如果需要重新初始化資料庫：

```bash
# 1. 停止所有服務
pkill -f "node src/app.js"

# 2. 重新執行初始化腳本
./scripts/init-complete-database.sh

# 3. 重新啟動服務
cd backend/services/merged-services
./start-all-services.sh
```

## ⚠️ 注意事項

1. **資料庫初始化是一次性的**：不需要在每個服務中重複執行
2. **統一配置**：所有服務使用相同的資料庫連接配置
3. **預設數據**：初始化後會自動創建管理員用戶和基本設定
4. **索引優化**：所有表格都已建立必要的索引以提升查詢性能

## 🐛 故障排除

### PostgreSQL 連接失敗
```bash
# 檢查 PostgreSQL 是否運行
pg_isready -h localhost -p 5432 -U admin

# 啟動 PostgreSQL 容器
docker start ecommerce-postgresql
```

### MongoDB 連接失敗
```bash
# 檢查 MongoDB 是否運行
docker ps | grep mongodb

# 啟動 MongoDB 容器
docker start ecommerce-mongodb
```

### 權限問題
```bash
# 檢查資料庫權限
psql -h localhost -p 5432 -U admin -d ecommerce_transactions -c "\du"
```

---

*最後更新: 2025-09-09*
