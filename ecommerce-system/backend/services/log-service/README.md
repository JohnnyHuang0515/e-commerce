# Log Service

## 概述
Log Service 是電商系統的日誌管理服務，負責收集、存儲、查詢和分析系統日誌。

## 功能特色
- 📝 **日誌收集** - 從各服務收集結構化日誌
- 🔍 **日誌查詢** - 支援複雜查詢和過濾條件
- 📊 **實時監控** - WebSocket 實時推送日誌
- 📈 **日誌分析** - 統計分析和圖表展示
- 🗂️ **日誌分類** - 按服務、級別、類型分類
- ⏰ **日誌保留** - 自動清理過期日誌

## 技術架構
- **後端**: Node.js + Express
- **資料庫**: MongoDB
- **實時通信**: Socket.IO
- **日誌框架**: Winston
- **驗證**: Joi

## API 端點

### 日誌管理
- `POST /api/v1/logs` - 創建日誌
- `GET /api/v1/logs` - 查詢日誌
- `GET /api/v1/logs/:id` - 獲取單一日誌
- `DELETE /api/v1/logs/:id` - 刪除日誌

### 日誌統計
- `GET /api/v1/logs/stats` - 獲取日誌統計
- `GET /api/v1/logs/stats/by-service` - 按服務統計
- `GET /api/v1/logs/stats/by-level` - 按級別統計

### 健康檢查
- `GET /api/v1/health` - 服務健康狀態

## 啟動方式

### 開發環境
```bash
npm install
npm run dev
```

### 生產環境
```bash
npm install
npm start
```

## 環境變數
複製 `env.example` 為 `.env` 並配置相關參數。

## 端口配置
- **HTTP API**: 3016
- **WebSocket**: 3017
