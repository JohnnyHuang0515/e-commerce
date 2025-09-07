# 🛒 電商系統管理後台

## 📋 專案概述

現代化電商系統管理後台，採用微服務架構，提供完整的電商管理功能，包含認證授權、用戶管理、商品管理、訂單管理、營運分析等。

## ✨ 主要特色

### 🏗️ 微服務架構
- **服務解耦**: 每個功能模組獨立部署
- **技術多樣性**: 支援不同技術棧
- **擴展性**: 可獨立擴展各服務
- **容錯性**: 單一服務故障不影響整體

### 🔐 認證授權系統
- **JWT Token**: 安全的身份驗證
- **角色權限**: 細粒度權限控制
- **簡化開發**: 目前為簡化版本，方便測試

### 📊 完整的管理功能
- **用戶管理**: 用戶 CRUD、角色管理、行為分析
- **商品管理**: 商品 CRUD、分類管理、庫存管理、圖片管理
- **訂單管理**: 訂單處理、狀態管理、退款處理
- **圖片存儲**: MinIO 圖片存儲、圖片處理、縮略圖生成
- **營運分析**: 銷售分析、用戶分析、商品分析

### 🤖 AI 驅動功能
- **智能搜尋**: 語意搜尋、搜尋建議
- **推薦系統**: 協同過濾、內容基礎推薦
- **預測分析**: 銷售預測、庫存預測

## 🚀 快速開始

### 環境需求
- Node.js 20.x
- MongoDB 7.x
- MinIO Server (圖片存儲)
- Docker (可選)

### 安裝與啟動

#### 1. 克隆專案
```bash
git clone <repository-url>
cd ecommerce-system
```

#### 2. 啟動 Auth Service
```bash
cd backend/services/auth-service
npm install
cp env.example .env
npm start
```

#### 3. 啟動 User Service
```bash
cd backend/services/user-service
npm install
cp env.example .env
npm start
```

#### 4. 啟動 Product Service
```bash
cd backend/services/product-service
npm install
cp env.example .env
npm start
```

#### 5. 啟動 AI Search Service
```bash
cd backend/services/ai-search-service
pip install -r requirements.txt
cp env.example .env
python -m uvicorn src.app:app --host 0.0.0.0 --port 3014
```

#### 6. 啟動 Log Service
```bash
cd backend/services/log-service
npm install
cp env.example .env
npm start
```

### 驗證安裝
```bash
# 檢查 Auth Service
curl http://localhost:3001/health

# 檢查 User Service
curl http://localhost:3002/health

# 檢查 AI Search Service
curl http://localhost:3014/api/v1/health

# 檢查 Log Service
curl http://localhost:3018/api/v1/health

# 檢查 Notification Service
curl http://localhost:3017/api/v1/health

# 檢查 Utility Service
curl http://localhost:3019/api/v1/health

# 測試登入
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecommerce.com", "password": "admin123"}'
```

## 📊 服務狀態

| 服務 | 端口 | 狀態 | 進度 | 文檔 |
|------|------|------|------|------|
| Auth Service | 3005 | ✅ 運行中 | 100% | [API 文檔](http://localhost:3005/api-docs) |
| User Service | 3002 | ✅ 運行中 | 100% | [API 文檔](http://localhost:3002/api-docs) |
| Product Service | 3001 | ✅ 運行中 | 100% | [API 文檔](http://localhost:3001/api-docs) |
| Order Service | 3003 | ✅ 運行中 | 100% | [API 文檔](http://localhost:3003/api-docs) |
| Analytics Service | 3006 | ✅ 運行中 | 100% | [API 文檔](http://localhost:3006/api-docs) |
| Settings Service | 3007 | ✅ 運行中 | 100% | [API 文檔](http://localhost:3007/api-docs) |
| Dashboard Service | 3011 | ❌ 未啟動 | 0% | 設計完成 |

## 🔧 API 端點

### Auth Service (認證授權) - Port 3005
- `POST /api/v1/auth/login` - 管理員登入
- `POST /api/v1/auth/logout` - 管理員登出
- `GET /api/v1/auth/profile` - 取得管理員資料
- `PUT /api/v1/auth/password` - 修改密碼
- `POST /api/v1/auth/refresh` - 重新整理 Token

### User Service (用戶管理) - Port 3002
- `GET /api/v1/users` - 用戶列表
- `GET /api/v1/users/overview` - 用戶概覽統計
- `GET /api/v1/users/{userId}` - 用戶詳情
- `POST /api/v1/users` - 建立新用戶
- `PUT /api/v1/users/{userId}` - 更新用戶資料
- `DELETE /api/v1/users/{userId}` - 刪除用戶
- `PUT /api/v1/users/{userId}/role` - 更新用戶角色
- `GET /api/v1/users/{userId}/analytics` - 取得用戶統計

### Product Service (商品管理) - Port 3001
- `GET /api/v1/products` - 商品列表
- `GET /api/v1/products/{id}` - 商品詳情
- `POST /api/v1/products` - 新增商品
- `PUT /api/v1/products/{id}` - 更新商品
- `DELETE /api/v1/products/{id}` - 刪除商品
- `GET /api/v1/categories` - 分類列表
- `POST /api/v1/categories` - 新增分類

### Order Service (訂單管理) - Port 3003
- `GET /api/v1/orders` - 訂單列表
- `GET /api/v1/orders/{orderId}` - 訂單詳情
- `POST /api/v1/orders` - 建立新訂單
- `PUT /api/v1/orders/{orderId}/status` - 更新訂單狀態
- `POST /api/v1/orders/{orderId}/cancel` - 取消訂單
- `POST /api/v1/orders/{orderId}/refund` - 退款處理
- `GET /api/v1/orders/statistics` - 訂單統計
- `GET /api/v1/orders/overview` - 訂單概覽

## 🏗️ 專案結構

```
ecommerce-system/
├── backend/
│   └── services/
│       ├── auth-service/          # 認證授權服務 ✅
│       ├── user-service/          # 用戶管理服務 ✅
│       ├── product-service/       # 商品管理服務 ✅
│       ├── order-service/         # 訂單管理服務 ✅
│       ├── analytics-service/     # 營運分析服務 (計劃中)
│       └── settings-service/      # 系統設定服務 (計劃中)
├── frontend/                      # 前端管理後台 (設計完成)
├── ai-services/                   # AI 服務 (計劃中)
├── infrastructure/               # 基礎設施配置 (計劃中)
├── docs/                         # 專案文檔
├── tests/                        # 測試檔案
└── scripts/                      # 部署腳本
```

## 📚 文檔

### 核心文檔
- [API 設計文檔](API_DESIGN.md) - 完整的 API 設計規範
- [API 端點清單](API_ENDPOINTS.md) - 所有 API 端點狀態
- [資料庫設計](DATABASE_DESIGN.md) - 資料庫結構設計
- [API 實作計劃](API_IMPLEMENTATION_PLAN.md) - API 開發計劃
- [開發 TODO 清單](TODO.md) - 開發進度追蹤

### 服務文檔
- [Auth Service API](backend/services/auth-service/API_TEST.md) - 認證服務測試文檔
- [User Service API](backend/services/user-service/README.md) - 用戶服務文檔
- [Product Service API](backend/services/product-service/API_DOCUMENTATION.md) - 商品服務文檔
- [Order Service API](backend/services/order-service/README.md) - 訂單服務文檔
- [Analytics Service API](backend/services/analytics-service/README.md) - 分析服務文檔
- [Settings Service API](backend/services/settings-service/README.md) - 設定服務文檔
- [Dashboard Service Design](DASHBOARD_SERVICE_DESIGN.md) - 儀表板服務設計文檔
- [Frontend Guide](FRONTEND_GUIDE.md) - 前端開發指南
- [Design System](DESIGN_SYSTEM.md) - 設計系統文檔

## 🔐 認證說明

### 簡化版本特色
目前實作的是簡化版本，方便開發測試：

1. **登入**: 任何 email/password 都會成功
2. **Token 驗證**: 直接通過，不檢查 JWT 有效性
3. **權限檢查**: 直接通過，不檢查權限

### 後續實作項目
標記為 `TODO` 的部分將在後續實作：
- [ ] 真實的密碼驗證
- [ ] JWT Token 驗證
- [ ] 權限檢查
- [ ] 角色驗證
- [ ] Token 黑名單
- [ ] 速率限制

## 🧪 測試

### 執行測試
```bash
# Auth Service 測試
cd backend/services/auth-service
npm test

# User Service 測試
cd backend/services/user-service
npm test

# Product Service 測試
cd backend/services/product-service
npm test
```

### API 測試
```bash
# 測試 Auth Service
curl http://localhost:3001/health

# 測試登入
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecommerce.com", "password": "admin123"}'

# 測試用戶列表
curl http://localhost:3002/api/v1/users/overview

# 測試商品列表
curl http://localhost:3003/api/v1/products
```

## 🚀 部署

### Docker 部署
```bash
# 建立所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

### 手動部署
```bash
# 啟動 Auth Service
cd backend/services/auth-service
npm start

# 啟動 User Service
cd backend/services/user-service
npm start

# 啟動 Product Service
cd backend/services/product-service
npm start
```

## 🔧 開發

### 開發環境設定
```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 程式碼檢查
npm run lint

# 測試
npm test
```

### 新增服務
```bash
# 建立新服務目錄
mkdir backend/services/new-service
cd backend/services/new-service

# 初始化專案
npm init -y

# 安裝依賴
npm install express mongoose cors helmet morgan dotenv
npm install --save-dev nodemon jest supertest
```

## 📈 監控

### 健康檢查
- Auth Service: http://localhost:3001/health
- User Service: http://localhost:3002/health
- Product Service: http://localhost:3003/health

### API 文檔
- Auth Service: http://localhost:3001/api-docs
- User Service: http://localhost:3002/api-docs
- Product Service: http://localhost:3003/api-docs

## 🤝 貢獻

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 支援

- **技術問題**: 請開啟 [Issue](../../issues)
- **功能建議**: 請開啟 [Discussion](../../discussions)
- **緊急問題**: 請聯繫開發團隊

---

**最後更新**: 2025-09-03  
**版本**: v1.0.0  
**狀態**: 開發中
