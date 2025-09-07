# 🚀 電商系統快速啟動指南

## 📋 一鍵啟動/停止

### 🟢 啟動完整系統
```bash
./start-system.sh
```

### 🔴 停止完整系統
```bash
./stop-system.sh
```

## 🌐 訪問地址

啟動完成後，可以訪問以下地址：

- **前端管理系統**: http://localhost:3000
- **登入帳號**: admin / admin123

## 🔧 服務列表

| 服務 | 端口 | 地址 | 說明 |
|------|------|------|------|
| Product Service | 3001 | http://localhost:3001 | 商品管理 |
| User Service | 3002 | http://localhost:3002 | 用戶管理 |
| Order Service | 3003 | http://localhost:3003 | 訂單管理 |
| Auth Service | 3005 | http://localhost:3005 | 認證服務 |
| Analytics Service | 3006 | http://localhost:3006 | 分析服務 |
| Settings Service | 3007 | http://localhost:3007 | 設定服務 |
| MinIO Service | 3008 | http://localhost:3008 | 文件存儲 |
| Payment Service | 3009 | http://localhost:3009 | 支付服務 |
| Logistics Service | 3010 | http://localhost:3010 | 物流服務 |
| Dashboard Service | 3011 | http://localhost:3011 | 儀表板 |
| Inventory Service | 3012 | http://localhost:3012 | 庫存管理 |
| Permission Service | 3013 | http://localhost:3013 | 權限管理 |
| MinIO Console | 9001 | http://localhost:9001 | MinIO 管理界面 |

## 🛠️ 管理指令

### 檢查服務狀態
```bash
./check-new-services.sh
```

### 查看日誌
```bash
# 前端日誌
tail -f logs/frontend.log

# 特定服務日誌
tail -f backend/services/[service-name]/logs/[service-name]-service.log
```

### 重啟特定服務
```bash
# 重啟新服務 (Payment, Logistics, Inventory, Permission)
./restart-new-services.sh

# 重啟所有服務
./stop-system.sh && ./start-system.sh
```

## 🔍 故障排除

### 服務啟動失敗
1. 檢查 MongoDB 是否運行：
   ```bash
   sudo docker ps | grep mongodb
   ```

2. 檢查端口是否被佔用：
   ```bash
   lsof -ti:3001,3002,3003,3005,3006,3007,3008,3009,3010,3011,3012,3013
   ```

3. 查看服務日誌：
   ```bash
   tail -f backend/logs/[service-name]-service.log
   ```

### 前端無法訪問
1. 檢查前端是否啟動：
   ```bash
   curl http://localhost:3000
   ```

2. 檢查前端日誌：
   ```bash
   tail -f logs/frontend.log
   ```

## 📁 目錄結構

```
ecommerce-system/
├── start-system.sh          # 🟢 一鍵啟動腳本
├── stop-system.sh           # 🔴 一鍵停止腳本
├── start-all-services.sh    # 啟動所有微服務
├── start-new-services.sh    # 啟動新服務
├── stop-all-services.sh     # 停止所有微服務
├── stop-new-services.sh     # 停止新服務
├── check-new-services.sh    # 檢查服務狀態
├── restart-new-services.sh  # 重啟新服務
├── backend/                 # 後端服務
├── frontend/               # 前端應用
└── logs/                   # 日誌文件
```

## 💡 提示

- 首次啟動可能需要較長時間來安裝依賴
- 確保 MongoDB 容器正在運行
- 如果遇到權限問題，請檢查 MongoDB 連接配置
- 所有服務都會在後台運行，可以通過日誌監控狀態
