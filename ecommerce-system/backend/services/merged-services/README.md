# 🔄 電商系統合併服務架構

## 📋 概述

本目錄包含電商系統的合併服務架構，將原本的 17 個微服務合併為 5 個主要服務，提高系統的可維護性和性能。

## 🏗️ 合併架構

### 服務劃分

| 合併後服務 | 端口 | 包含原服務 | 資料庫 | 職責 |
|-----------|------|-----------|--------|------|
| **AUTH-SERVICE** | 3001 | Auth + User + Permission | PostgreSQL + MongoDB | 認證、用戶、權限管理 |
| **PRODUCT-SERVICE** | 3002 | Product + Inventory + MinIO | MongoDB + PostgreSQL | 商品、庫存、檔案管理 |
| **ORDER-SERVICE** | 3003 | Order + Payment + Logistics | PostgreSQL | 訂單、支付、物流 |
| **AI-SERVICE** | 3004 | AI Search + AI Recommendation + Analytics | MongoDB + Vector DB | AI功能、分析、推薦 |
| **SYSTEM-SERVICE** | 3005 | Settings + Dashboard + Notification + Log + Utility | MongoDB + PostgreSQL | 系統管理、監控、工具 |

## 🚀 快速開始

### 1. 啟動合併服務

```bash
# 啟動所有合併服務
./start-merged-system.sh

# 停止所有合併服務
./stop-merged-system.sh
```

### 2. 單獨啟動服務

```bash
# 啟動 AUTH-SERVICE
cd backend/services/merged-services/auth-service
npm install
npm start

# 啟動 PRODUCT-SERVICE
cd backend/services/merged-services/product-service
npm install
npm start

# 啟動 ORDER-SERVICE
cd backend/services/merged-services/order-service
npm install
npm start

# 啟動 AI-SERVICE
cd backend/services/merged-services/ai-service
npm install
npm start

# 啟動 SYSTEM-SERVICE
cd backend/services/merged-services/system-service
npm install
npm start
```

## 📊 服務詳情

### AUTH-SERVICE (端口 3001)

**功能**：認證、用戶管理、權限控制

**API 端點**：
- `/api/v1/auth` - 認證相關
- `/api/v1/users` - 用戶管理
- `/api/v1/permissions` - 權限管理

**資料庫**：
- PostgreSQL: 用戶資料、角色、權限
- MongoDB: 認證令牌、會話資料

### PRODUCT-SERVICE (端口 3002)

**功能**：商品管理、庫存控制、檔案管理

**API 端點**：
- `/api/v1/products` - 商品管理
- `/api/v1/inventory` - 庫存管理
- `/api/v1/files` - 檔案管理

**資料庫**：
- MongoDB: 商品資料、分類、屬性
- PostgreSQL: 庫存資料、庫存變動記錄

### ORDER-SERVICE (端口 3003)

**功能**：訂單處理、支付管理、物流追蹤

**API 端點**：
- `/api/v1/orders` - 訂單管理
- `/api/v1/payments` - 支付處理
- `/api/v1/logistics` - 物流管理

**資料庫**：
- PostgreSQL: 訂單、支付、物流資料

### AI-SERVICE (端口 3004)

**功能**：AI搜尋、推薦系統、數據分析

**API 端點**：
- `/api/v1/search` - AI搜尋
- `/api/v1/recommendations` - 推薦系統
- `/api/v1/analytics` - 數據分析

**資料庫**：
- MongoDB: 搜尋索引、推薦資料
- Vector DB: 向量搜尋資料

### SYSTEM-SERVICE (端口 3005)

**功能**：系統設定、監控儀表板、通知、日誌

**API 端點**：
- `/api/v1/settings` - 系統設定
- `/api/v1/dashboard` - 監控儀表板
- `/api/v1/notifications` - 通知管理
- `/api/v1/logs` - 日誌管理
- `/api/v1/utilities` - 工具服務

**資料庫**：
- MongoDB: 設定、通知、日誌資料
- PostgreSQL: 系統配置、監控資料

## 🔧 開發指南

### 目錄結構

```
merged-services/
├── auth-service/          # 認證服務
│   ├── src/
│   │   ├── config/        # 資料庫配置
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中間件
│   │   ├── models/        # 資料模型
│   │   ├── routes/        # 路由
│   │   └── utils/         # 工具函數
│   ├── package.json
│   └── env.example
├── product-service/       # 商品服務
├── order-service/         # 訂單服務
├── ai-service/           # AI服務
├── system-service/       # 系統服務
└── README.md
```

### 環境配置

每個服務都有自己的環境配置文件：

```bash
# 複製環境配置模板
cp env.example .env

# 修改配置
nano .env
```

### 資料庫遷移

合併服務使用統一的資料庫配置：

- **PostgreSQL**: `ecommerce_transactions`
- **MongoDB**: `ecommerce` (主資料庫)

## 📈 性能優化

### 1. 連接池配置

每個服務都配置了適當的資料庫連接池：

```javascript
pool: {
  max: 10,        // 最大連接數
  min: 0,         // 最小連接數
  acquire: 30000, // 獲取連接超時
  idle: 10000     // 空閒連接超時
}
```

### 2. 快取策略

- Redis 用於會話快取
- 記憶體快取用於頻繁查詢的資料
- CDN 用於靜態資源

### 3. 負載均衡

- 使用 Nginx 進行負載均衡
- 服務間通信使用 HTTP/gRPC
- 消息佇列用於異步處理

## 🔍 監控與日誌

### 健康檢查

每個服務都提供健康檢查端點：

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

### 日誌管理

- 統一日誌格式
- 結構化日誌輸出
- 日誌輪轉和歸檔
- 集中式日誌收集

## 🚨 故障排除

### 常見問題

1. **服務啟動失敗**
   - 檢查資料庫連接
   - 確認端口未被佔用
   - 查看服務日誌

2. **資料庫連接問題**
   - 確認 PostgreSQL 和 MongoDB 運行狀態
   - 檢查連接配置
   - 驗證用戶權限

3. **API 調用失敗**
   - 檢查服務健康狀態
   - 確認 API 端點正確
   - 查看錯誤日誌

### 日誌位置

```
logs/
├── auth-service.log
├── product-service.log
├── order-service.log
├── ai-service.log
├── system-service.log
└── frontend.log
```

## 📚 API 文檔

每個服務都提供 Swagger API 文檔：

- AUTH-SERVICE: http://localhost:3001/api-docs
- PRODUCT-SERVICE: http://localhost:3002/api-docs
- ORDER-SERVICE: http://localhost:3003/api-docs
- AI-SERVICE: http://localhost:3004/api-docs
- SYSTEM-SERVICE: http://localhost:3005/api-docs

## 🔄 從微服務遷移

### 遷移步驟

1. **停止原微服務**
   ```bash
   ./stop-system.sh
   ```

2. **啟動合併服務**
   ```bash
   ./start-merged-system.sh
   ```

3. **更新前端配置**
   - 修改 API 端點
   - 更新服務地址
   - 測試功能完整性

4. **資料庫遷移**
   - 備份現有資料
   - 執行遷移腳本
   - 驗證資料完整性

## 📞 支援

如有問題，請查看：

1. 服務日誌文件
2. API 文檔
3. 健康檢查端點
4. 系統監控儀表板

---

**注意**: 目前只有 AUTH-SERVICE 已完全實現，其他服務正在開發中。
