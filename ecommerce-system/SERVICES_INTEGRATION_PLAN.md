# 🔄 服務整合計劃

## 📊 服務總覽分析

### 現有合併服務 (merged-services)
1. **AUTH-SERVICE** (Port 3001) - 認證授權
2. **PRODUCT-SERVICE** (Port 3002) - 商品管理
3. **ORDER-SERVICE** (Port 3003) - 訂單管理
4. **AI-SERVICE** (Port 3006) - AI 功能
5. **SYSTEM-SERVICE** (Port 3005) - 系統管理

### 備份服務 (services_backup) - 需要整合
1. **ai-search-service** - AI 搜尋服務
2. **analytics-service** - 數據分析服務
3. **auth-service** - 認證服務 (已存在)
4. **dashboard-service** - 儀表板服務
5. **inventory-service** - 庫存管理服務
6. **log-service** - 日誌管理服務
7. **logistics-service** - 物流服務
8. **minio-service** - 圖片存儲服務
9. **notification-service** - 通知服務
10. **order-service** - 訂單服務 (已存在)
11. **payment-service** - 支付服務
12. **permission-service** - 權限管理服務
13. **product-service** - 商品服務 (已存在)
14. **settings-service** - 設定服務
15. **user-service** - 用戶服務
16. **utility-service** - 工具服務

## 🎯 整合策略

### 階段 1: 核心服務整合 (優先級 1)
1. **analytics-service** → 整合到 **AI-SERVICE** 或創建獨立 **ANALYTICS-SERVICE**
2. **dashboard-service** → 整合到 **SYSTEM-SERVICE** 或創建獨立 **DASHBOARD-SERVICE**
3. **inventory-service** → 整合到 **PRODUCT-SERVICE**
4. **payment-service** → 整合到 **ORDER-SERVICE**

### 階段 2: 管理服務整合 (優先級 2)
5. **permission-service** → 整合到 **AUTH-SERVICE**
6. **settings-service** → 整合到 **SYSTEM-SERVICE**
7. **user-service** → 整合到 **AUTH-SERVICE**
8. **log-service** → 整合到 **SYSTEM-SERVICE**

### 階段 3: 功能服務整合 (優先級 3)
9. **logistics-service** → 整合到 **ORDER-SERVICE**
10. **notification-service** → 整合到 **SYSTEM-SERVICE**
11. **minio-service** → 整合到 **PRODUCT-SERVICE** 或創建獨立 **FILE-SERVICE**
12. **utility-service** → 整合到 **SYSTEM-SERVICE**

### 階段 4: 特殊服務整合 (優先級 4)
13. **ai-search-service** → 整合到 **AI-SERVICE**

## 📋 詳細整合計劃

### 1. Analytics Service 整合
- **目標**: 創建獨立的 ANALYTICS-SERVICE (Port 3007)
- **原因**: 分析功能複雜，需要獨立服務
- **整合內容**:
  - 銷售分析
  - 用戶分析
  - 商品分析
  - 營收分析
  - 庫存分析

### 2. Dashboard Service 整合
- **目標**: 創建獨立的 DASHBOARD-SERVICE (Port 3008)
- **原因**: 儀表板需要聚合多個服務數據
- **整合內容**:
  - 概覽統計
  - 即時數據
  - 分析圖表
  - 小工具管理

### 3. Inventory Service 整合
- **目標**: 整合到 PRODUCT-SERVICE
- **原因**: 庫存與商品密切相關
- **整合內容**:
  - 庫存管理
  - 庫存調整
  - 庫存統計
  - 低庫存警告

### 4. Payment Service 整合
- **目標**: 整合到 ORDER-SERVICE
- **原因**: 支付與訂單密切相關
- **整合內容**:
  - 支付處理
  - 支付方式管理
  - 退款處理
  - 支付統計

### 5. Permission Service 整合
- **目標**: 整合到 AUTH-SERVICE
- **原因**: 權限與認證密切相關
- **整合內容**:
  - 角色管理
  - 權限管理
  - 權限檢查
  - 用戶角色分配

### 6. Settings Service 整合
- **目標**: 整合到 SYSTEM-SERVICE
- **原因**: 設定屬於系統管理範疇
- **整合內容**:
  - 系統設定
  - 支付設定
  - 物流設定
  - 通知設定

### 7. User Service 整合
- **目標**: 整合到 AUTH-SERVICE
- **原因**: 用戶管理與認證密切相關
- **整合內容**:
  - 用戶管理
  - 用戶統計
  - 用戶分析
  - 用戶角色管理

### 8. Log Service 整合
- **目標**: 整合到 SYSTEM-SERVICE
- **原因**: 日誌屬於系統管理範疇
- **整合內容**:
  - 系統日誌
  - 用戶操作日誌
  - API 存取日誌
  - 日誌統計

### 9. Logistics Service 整合
- **目標**: 整合到 ORDER-SERVICE
- **原因**: 物流與訂單密切相關
- **整合內容**:
  - 物流管理
  - 配送追蹤
  - 物流統計
  - 物流商整合

### 10. Notification Service 整合
- **目標**: 整合到 SYSTEM-SERVICE
- **原因**: 通知屬於系統管理範疇
- **整合內容**:
  - 通知管理
  - 通知模板
  - 通知統計
  - 多通道通知

### 11. MinIO Service 整合
- **目標**: 創建獨立的 FILE-SERVICE (Port 3009)
- **原因**: 檔案管理需要獨立服務
- **整合內容**:
  - 圖片上傳
  - 檔案管理
  - 檔案統計
  - 多存儲桶管理

### 12. Utility Service 整合
- **目標**: 整合到 SYSTEM-SERVICE
- **原因**: 工具功能屬於系統管理範疇
- **整合內容**:
  - 備份還原
  - 資料匯入匯出
  - 系統清理
  - 工具功能

### 13. AI Search Service 整合
- **目標**: 整合到 AI-SERVICE
- **原因**: 搜尋功能屬於 AI 範疇
- **整合內容**:
  - 語義搜尋
  - 搜尋建議
  - 搜尋分析
  - 向量搜尋

## 🚀 執行順序

### 第一輪: 核心服務 (1-4)
1. Analytics Service → ANALYTICS-SERVICE
2. Dashboard Service → DASHBOARD-SERVICE  
3. Inventory Service → PRODUCT-SERVICE
4. Payment Service → ORDER-SERVICE

### 第二輪: 管理服務 (5-8)
5. Permission Service → AUTH-SERVICE
6. Settings Service → SYSTEM-SERVICE
7. User Service → AUTH-SERVICE
8. Log Service → SYSTEM-SERVICE

### 第三輪: 功能服務 (9-12)
9. Logistics Service → ORDER-SERVICE
10. Notification Service → SYSTEM-SERVICE
11. MinIO Service → FILE-SERVICE
12. Utility Service → SYSTEM-SERVICE

### 第四輪: 特殊服務 (13)
13. AI Search Service → AI-SERVICE

## 📊 最終服務架構

### 合併後服務列表
1. **AUTH-SERVICE** (Port 3001) - 認證、用戶、權限管理
2. **PRODUCT-SERVICE** (Port 3002) - 商品、庫存管理
3. **ORDER-SERVICE** (Port 3003) - 訂單、支付、物流管理
4. **SYSTEM-SERVICE** (Port 3005) - 系統、設定、日誌、通知、工具管理
5. **AI-SERVICE** (Port 3006) - AI、搜尋功能
6. **ANALYTICS-SERVICE** (Port 3007) - 數據分析
7. **DASHBOARD-SERVICE** (Port 3008) - 儀表板
8. **FILE-SERVICE** (Port 3009) - 檔案管理

## ✅ 檢查清單

### 每個服務整合時需要檢查
- [ ] 端口配置
- [ ] 資料庫連接
- [ ] API 端點
- [ ] 中間件配置
- [ ] 錯誤處理
- [ ] 日誌記錄
- [ ] 健康檢查
- [ ] Swagger 文檔
- [ ] 環境變數
- [ ] 依賴關係

---

*計劃制定時間: 2025-09-09 15:00*
*預計完成時間: 2025-09-09 18:00*
