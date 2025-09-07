# 🛒 電商系統管理後台

[![GitHub stars](https://img.shields.io/github/stars/JohnnyHuang0515/e-commerce.svg)](https://github.com/JohnnyHuang0515/e-commerce/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/JohnnyHuang0515/e-commerce.svg)](https://github.com/JohnnyHuang0515/e-commerce/network)
[![GitHub issues](https://img.shields.io/github/issues/JohnnyHuang0515/e-commerce.svg)](https://github.com/JohnnyHuang0515/e-commerce/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> 現代化電商系統管理後台，採用微服務架構，提供完整的電商管理功能

## 📋 專案概述

這是一個完整的電商系統管理後台，採用微服務架構設計，提供用戶管理、商品管理、訂單處理、數據分析、AI 智能搜尋等核心功能。系統支援混合資料庫架構，結合了 MongoDB、PostgreSQL、Redis 和 Milvus 向量資料庫的優勢。

## ✨ 主要特色

### 🏗️ 微服務架構
- **服務解耦**: 每個功能模組獨立部署和擴展
- **技術多樣性**: 支援 Node.js、Python、React 等技術棧
- **高可用性**: 單一服務故障不影響整體系統
- **容器化部署**: 支援 Docker 和 Docker Compose

### 🔐 認證授權系統
- **JWT Token**: 安全的身份驗證機制
- **角色權限**: 細粒度權限控制 (RBAC)
- **多層安全**: 中間件認證、API 權限驗證

### 📊 完整的管理功能
- **用戶管理**: 用戶 CRUD、角色管理、行為分析
- **商品管理**: 商品 CRUD、分類管理、庫存管理、圖片上傳
- **訂單管理**: 訂單處理、狀態管理、退款處理
- **圖片存儲**: MinIO 圖片存儲、圖片處理、縮略圖生成
- **營運分析**: 銷售分析、用戶分析、商品分析
- **系統設定**: 全域設定、通知管理、日誌管理

### 🤖 AI 驅動功能
- **智能搜尋**: 基於 sentence-transformers 的語意搜尋
- **向量資料庫**: Milvus 向量資料庫支援
- **搜尋建議**: 智能搜尋建議和自動完成
- **快取機制**: Redis 快取提升搜尋性能

### 🗄️ 混合資料庫架構
- **MongoDB**: 商品、分析等非結構化數據
- **PostgreSQL**: 用戶、訂單、權限等交易數據
- **Redis**: 快取和會話存儲
- **Milvus**: 向量搜尋和 AI 功能

## 🚀 快速開始

### 環境需求

- **Node.js**: 20.x 或更高版本
- **Python**: 3.9+ (AI 搜尋服務)
- **MongoDB**: 7.x
- **PostgreSQL**: 15.x
- **Redis**: 6.x
- **MinIO**: 最新版本
- **Docker**: 可選，用於容器化部署

### 安裝與啟動

#### 1. 克隆專案
```bash
git clone https://github.com/JohnnyHuang0515/e-commerce.git
cd e-commerce
```

#### 2. 環境配置
```bash
# 複製環境變數範例文件
cp ecommerce-system/backend/services/*/env.example ecommerce-system/backend/services/*/.env

# 根據需要修改各服務的環境變數
```

#### 3. 啟動資料庫服務
```bash
# 使用 Docker Compose 啟動所有資料庫
cd ecommerce-system
docker-compose up -d mongodb postgresql redis minio
```

#### 4. 啟動後端服務

**認證服務 (Auth Service)**
```bash
cd ecommerce-system/backend/services/auth-service
npm install
npm start
# 服務運行在 http://localhost:3005
```

**用戶服務 (User Service)**
```bash
cd ecommerce-system/backend/services/user-service
npm install
npm start
# 服務運行在 http://localhost:3002
```

**商品服務 (Product Service)**
```bash
cd ecommerce-system/backend/services/product-service
npm install
npm start
# 服務運行在 http://localhost:3001
```

**AI 搜尋服務 (AI Search Service)**
```bash
cd ecommerce-system/backend/services/ai-search-service
pip install -r requirements.txt
python -m uvicorn src.app:app --host 0.0.0.0 --port 3014
# 服務運行在 http://localhost:3014
```

#### 5. 啟動前端應用
```bash
cd ecommerce-system/frontend
npm install
npm run dev
# 前端運行在 http://localhost:5173
```

### 使用 Docker Compose (推薦)

```bash
cd ecommerce-system
docker-compose up -d
```

## 📊 服務架構

| 服務 | 端口 | 技術棧 | 資料庫 | 狀態 |
|------|------|--------|--------|------|
| **Product Service** | 3001 | Node.js + Express | MongoDB | ✅ 完成 |
| **User Service** | 3002 | Node.js + Express | PostgreSQL | ✅ 完成 |
| **Order Service** | 3003 | Node.js + Express | PostgreSQL | ✅ 完成 |
| **Auth Service** | 3005 | Node.js + Express | MongoDB | ✅ 完成 |
| **Analytics Service** | 3006 | Node.js + Express | MongoDB | ✅ 完成 |
| **Settings Service** | 3007 | Node.js + Express | MongoDB | ✅ 完成 |
| **MinIO Service** | 3008 | Node.js + Express | MinIO | ✅ 完成 |
| **Dashboard Service** | 3011 | Node.js + Express | MongoDB | ✅ 完成 |
| **Permission Service** | 3013 | Node.js + Express | PostgreSQL | ✅ 完成 |
| **AI Search Service** | 3014 | Python + FastAPI | Milvus + Redis | ✅ 完成 |
| **Notification Service** | 3017 | Node.js + Express | MongoDB | ✅ 完成 |
| **Log Service** | 3018 | Node.js + Express | MongoDB | ✅ 完成 |
| **Utility Service** | 3019 | Node.js + Express | MongoDB | ✅ 完成 |
| **Frontend** | 5173 | React + TypeScript | - | ✅ 完成 |

## 🔧 API 文檔

各服務都提供 Swagger API 文檔：

- **Auth Service**: http://localhost:3005/api-docs
- **User Service**: http://localhost:3002/api-docs
- **Product Service**: http://localhost:3001/api-docs
- **Order Service**: http://localhost:3003/api-docs
- **Analytics Service**: http://localhost:3006/api-docs
- **AI Search Service**: http://localhost:3014/api-docs

## 🧪 測試

### 健康檢查
```bash
# 檢查所有服務健康狀態
curl http://localhost:3005/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3001/health  # Product Service
curl http://localhost:3014/api/v1/health  # AI Search Service
```

### API 測試
```bash
# 測試登入
curl -X POST http://localhost:3005/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecommerce.com", "password": "admin123"}'

# 測試 AI 搜尋
curl -X POST http://localhost:3014/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "手機", "limit": 5, "threshold": 0.7}'
```

## 📁 專案結構

```
e-commerce/
├── docs/                          # 專案文檔
│   ├── 00_project_brief_prd_summary.md
│   ├── 01_adr_001_microservices_architecture.md
│   ├── 02_system_architecture_document.md
│   └── ...
├── ecommerce-system/
│   ├── backend/services/           # 後端微服務
│   │   ├── auth-service/          # 認證服務
│   │   ├── user-service/          # 用戶服務
│   │   ├── product-service/       # 商品服務
│   │   ├── ai-search-service/     # AI 搜尋服務
│   │   └── ...
│   ├── frontend/                  # 前端應用
│   │   ├── src/
│   │   │   ├── components/        # React 組件
│   │   │   ├── pages/            # 頁面組件
│   │   │   ├── services/         # API 服務
│   │   │   └── ...
│   │   └── package.json
│   ├── scripts/                   # 資料庫初始化腳本
│   ├── docker-compose.yml         # Docker 配置
│   └── README.md                  # 詳細文檔
└── README.md                      # 專案總覽
```

## 🛠️ 開發指南

### 添加新服務
1. 在 `backend/services/` 下創建新服務目錄
2. 實現基本的 Express 應用和路由
3. 添加 Swagger 文檔
4. 更新 `docker-compose.yml`
5. 更新前端 API 服務

### 資料庫遷移
- **MongoDB**: 使用 Mongoose 模型
- **PostgreSQL**: 使用 Sequelize ORM
- **Redis**: 使用 ioredis 客戶端
- **Milvus**: 使用 pymilvus Python 客戶端

### 前端開發
- 使用 React + TypeScript
- Ant Design 組件庫
- Vite 構建工具
- Less 樣式預處理器

## 📈 功能特色

### 🔍 AI 智能搜尋
- 語意搜尋：理解用戶意圖，提供精準搜尋結果
- 向量資料庫：使用 Milvus 進行高效相似度搜尋
- 搜尋建議：智能建議和自動完成功能
- 快取優化：Redis 快取提升搜尋性能

### 📊 數據分析
- 銷售分析：銷售趨勢、熱門商品分析
- 用戶分析：用戶行為、留存率分析
- 商品分析：商品表現、庫存分析
- 即時儀表板：關鍵指標即時監控

### 🖼️ 圖片管理
- MinIO 存儲：分散式圖片存儲
- 圖片處理：自動縮略圖生成
- 批量上傳：支援多圖片批量上傳
- CDN 支援：可整合 CDN 加速

### 🔐 權限管理
- RBAC 模型：角色基礎的存取控制
- 細粒度權限：功能級別的權限控制
- 動態權限：支援權限動態分配
- 審計日誌：完整的操作記錄

## 🤝 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 📞 聯絡資訊

- **開發者**: Johnny Huang
- **GitHub**: [@JohnnyHuang0515](https://github.com/JohnnyHuang0515)
- **專案連結**: [https://github.com/JohnnyHuang0515/e-commerce](https://github.com/JohnnyHuang0515/e-commerce)

## 🙏 致謝

感謝所有開源專案和技術社群的支持，特別是：
- [Express.js](https://expressjs.com/) - Node.js Web 框架
- [React](https://reactjs.org/) - 前端框架
- [Ant Design](https://ant.design/) - UI 組件庫
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web 框架
- [MongoDB](https://www.mongodb.com/) - NoSQL 資料庫
- [PostgreSQL](https://www.postgresql.org/) - 關聯式資料庫
- [Milvus](https://milvus.io/) - 向量資料庫

---

⭐ 如果這個專案對你有幫助，請給它一個 Star！
