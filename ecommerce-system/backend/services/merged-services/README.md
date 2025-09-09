# 🚀 合併服務管理

## 📋 服務列表

| 服務 | 端口 | 功能 | 狀態 |
|------|------|------|------|
| **AUTH-SERVICE** | 3001 | 認證、用戶管理、權限管理 | ✅ |
| **PRODUCT-SERVICE** | 3002 | 商品管理、庫存管理、文件上傳 | ✅ |
| **ORDER-SERVICE** | 3003 | 訂單管理、支付處理、物流配送 | ✅ |
| **AI-SERVICE** | 3004 | 智能搜尋、推薦系統、分析 | ✅ |
| **SYSTEM-SERVICE** | 3005 | 系統配置、工具功能、監控 | ✅ |
| **ANALYTICS-SERVICE** | 3007 | 數據分析、報告生成 | ✅ |
| **DASHBOARD-SERVICE** | 3008 | 儀表板、概覽統計 | ✅ |

## 🛠️ 腳本使用

### 1. 啟動所有服務
```bash
./start-all-services.sh
```

### 2. 停止所有服務
```bash
./stop-all-services.sh
```

### 3. 檢查服務狀態
```bash
./check-services.sh
```

## 🔧 服務管理

### 啟動單個服務
```bash
# 進入服務目錄
cd auth-service

# 安裝依賴
npm install

# 啟動服務
node src/app.js
```

### 檢查服務日誌
```bash
# 查看所有日誌
tail -f logs/*.log

# 查看特定服務日誌
tail -f logs/auth-service.log
```

## 🌐 服務端點

### 健康檢查
- AUTH-SERVICE: http://localhost:3001/health
- PRODUCT-SERVICE: http://localhost:3002/health
- ORDER-SERVICE: http://localhost:3003/health
- AI-SERVICE: http://localhost:3004/health
- SYSTEM-SERVICE: http://localhost:3005/health
- ANALYTICS-SERVICE: http://localhost:3007/health
- DASHBOARD-SERVICE: http://localhost:3008/api/v1/health

### API 文檔
- AUTH-SERVICE: http://localhost:3001/api-docs
- PRODUCT-SERVICE: http://localhost:3002/api-docs
- ORDER-SERVICE: http://localhost:3003/api-docs
- AI-SERVICE: http://localhost:3004/api-docs
- SYSTEM-SERVICE: http://localhost:3005/api-docs
- ANALYTICS-SERVICE: http://localhost:3007/api-docs
- DASHBOARD-SERVICE: http://localhost:3008/api-docs

## 🗄️ 資料庫

### PostgreSQL (訂單服務)
- 主機: localhost
- 端口: 5432
- 用戶: admin
- 密碼: password123
- 資料庫: ecommerce_transactions

### MongoDB (其他服務)
- 主機: localhost
- 端口: 27017
- 用戶: ecommerce_user
- 密碼: ecommerce_password
- 資料庫: ecommerce

## 🔍 故障排除

### 服務無法啟動
1. 檢查端口是否被佔用
2. 檢查資料庫是否運行
3. 查看服務日誌
4. 確認環境變數配置

### 資料庫連接問題
1. 檢查資料庫服務狀態
2. 確認連接參數
3. 檢查防火牆設定

### 權限問題
1. 確認腳本有執行權限
2. 檢查文件權限
3. 確認用戶權限

## 📊 監控

### 系統監控
- 使用 SYSTEM-SERVICE 的監控功能
- 查看服務健康狀態
- 監控資源使用情況

### 日誌監控
- 所有服務日誌都在 `logs/` 目錄
- 使用 `tail -f` 實時查看日誌
- 定期清理舊日誌文件

## 🚀 部署

### 生產環境
1. 設置環境變數
2. 配置資料庫
3. 設置反向代理
4. 配置 SSL 證書
5. 設置監控和日誌

### Docker 部署
```bash
# 使用 Docker Compose
docker-compose up -d

# 檢查服務狀態
docker-compose ps
```

## 📝 開發

### 添加新服務
1. 創建服務目錄
2. 配置 package.json
3. 實現基本結構
4. 添加健康檢查
5. 更新啟動腳本

### 修改現有服務
1. 停止服務
2. 修改代碼
3. 重啟服務
4. 測試功能

---

*最後更新: 2025-01-09*