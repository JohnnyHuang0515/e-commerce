# 📦 電商系統 Inventory Service API 文檔

## 📋 概述

這是電商系統庫存管理服務的 API 文檔，提供完整的庫存管理功能，包括庫存追蹤、預留管理、自動補貨、低庫存預警等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3011/api-docs/
- **健康檢查**: http://localhost:3011/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 📦 庫存管理
- `GET /api/v1/inventory` - 取得庫存列表
- `POST /api/v1/inventory` - 建立庫存記錄
- `GET /api/v1/inventory/:productId` - 取得庫存詳情
- `PUT /api/v1/inventory/:productId` - 更新庫存
- `POST /api/v1/inventory/bulk` - 批量更新庫存

### 🔒 庫存預留
- `POST /api/v1/inventory/:productId/reserve` - 預留庫存
- `POST /api/v1/inventory/:productId/release` - 釋放預留庫存
- `POST /api/v1/inventory/:productId/ship` - 確認出庫

### 📊 交易記錄
- `GET /api/v1/inventory/:productId/transactions` - 取得庫存交易記錄

### 📈 統計分析
- `GET /api/v1/inventory/stats` - 取得庫存統計
- `GET /api/v1/inventory/alerts` - 取得低庫存預警

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3011/health
```

### 2. 建立庫存記錄
```bash
curl -X POST http://localhost:3011/api/v1/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "68b7d361f9f4bfdffafa3350",
    "sku": "PROD-001",
    "initialStock": 100,
    "minStock": 10,
    "maxStock": 1000,
    "unitCost": 50,
    "location": {
      "warehouse": "main",
      "zone": "A",
      "shelf": "01",
      "position": "01"
    },
    "supplier": {
      "supplierId": "68b7d361f9f4bfdffafa3351",
      "supplierName": "測試供應商",
      "supplierSku": "SUP-001"
    },
    "expiryDate": "2025-12-31T23:59:59.000Z",
    "batchNumber": "BATCH-001",
    "metadata": {
      "category": "electronics",
      "brand": "test"
    }
  }'
```

### 3. 取得庫存列表
```bash
curl "http://localhost:3011/api/v1/inventory?page=1&limit=10&status=in_stock"
```

### 4. 取得庫存詳情
```bash
curl http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350
```

### 5. 更新庫存
```bash
curl -X PUT http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "type": "purchase",
    "reason": "manual_adjustment",
    "referenceId": "PURCHASE-001",
    "notes": "進貨補庫"
  }'
```

### 6. 批量更新庫存
```bash
curl -X POST http://localhost:3011/api/v1/inventory/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "productId": "68b7d361f9f4bfdffafa3350",
        "quantity": 20,
        "type": "sale",
        "reason": "order_placed",
        "referenceId": "ORDER-001",
        "notes": "訂單出庫"
      },
      {
        "productId": "68b7d361f9f4bfdffafa3351",
        "quantity": 30,
        "type": "purchase",
        "reason": "manual_adjustment",
        "referenceId": "PURCHASE-002",
        "notes": "進貨補庫"
      }
    ]
  }'
```

### 7. 預留庫存
```bash
curl -X POST http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "orderId": "ORDER-001"
  }'
```

### 8. 釋放預留庫存
```bash
curl -X POST http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350/release \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "orderId": "ORDER-001"
  }'
```

### 9. 確認出庫
```bash
curl -X POST http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350/ship \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "orderId": "ORDER-001"
  }'
```

### 10. 取得庫存交易記錄
```bash
curl "http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350/transactions?page=1&limit=10"
```

### 11. 取得庫存統計
```bash
curl "http://localhost:3011/api/v1/inventory/stats?period=month"
```

### 12. 取得低庫存預警
```bash
curl "http://localhost:3011/api/v1/inventory/alerts?threshold=10"
```

## 📋 資料模型

### Inventory (庫存)
```json
{
  "_id": "string",
  "productId": "string (必填, ObjectId, 唯一)",
  "sku": "string (必填, 唯一)",
  "currentStock": "number (必填, 最小值0)",
  "reservedStock": "number (預設: 0, 最小值0)",
  "availableStock": "number (虛擬欄位: currentStock - reservedStock)",
  "minStock": "number (預設: 0, 最小值0)",
  "maxStock": "number (預設: 10000, 最小值0)",
  "status": "string (enum: in_stock, low_stock, out_of_stock, discontinued)",
  "unitCost": "number (預設: 0, 最小值0)",
  "totalValue": "number (預設: 0, 最小值0)",
  "lastUpdated": "date-time (預設: 現在時間)",
  "lastTransaction": "string (ObjectId, 最後交易記錄)",
  "stockAlerts": {
    "lowStockThreshold": "number (預設: 10)",
    "criticalStockThreshold": "number (預設: 5)",
    "highStockThreshold": "number (預設: 1000)",
    "alertEnabled": "boolean (預設: true)",
    "alertChannels": ["string (enum: email, sms, webhook, dashboard)"],
    "alertRecipients": ["string"]
  },
  "safetyStock": {
    "enabled": "boolean (預設: true)",
    "days": "number (預設: 7)",
    "percentage": "number (預設: 20)",
    "calculatedQuantity": "number (預設: 0)"
  },
  "autoReorder": {
    "enabled": "boolean (預設: false)",
    "threshold": "number (預設: 20)",
    "quantity": "number (預設: 100)",
    "supplierId": "string (ObjectId)",
    "lastReorderDate": "date-time",
    "nextReorderDate": "date-time"
  },
  "location": {
    "warehouse": "string (預設: main)",
    "zone": "string (預設: A)",
    "shelf": "string (預設: 01)",
    "position": "string (預設: 01)"
  },
  "expiryDate": "date-time",
  "batchNumber": "string",
  "supplier": {
    "supplierId": "string (ObjectId)",
    "supplierName": "string",
    "supplierSku": "string"
  },
  "metadata": "object (預設: {})",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### InventoryTransaction (庫存交易)
```json
{
  "_id": "string",
  "transactionId": "string (必填, 唯一)",
  "productId": "string (必填, ObjectId)",
  "type": "string (enum: purchase, sale, return, adjustment, transfer, damage, expired, initial)",
  "reason": "string (enum: order_placed, order_cancelled, order_returned, stock_adjustment, damage_loss, expiration, transfer_in, transfer_out, initial_stock, manual_adjustment)",
  "quantity": "number (必填)",
  "previousStock": "number (必填)",
  "newStock": "number (必填)",
  "unitCost": "number (預設: 0)",
  "totalCost": "number (預設: 0)",
  "referenceId": "string",
  "referenceType": "string (enum: order, purchase, transfer, adjustment, return)",
  "notes": "string",
  "performedBy": "string (ObjectId)",
  "performedAt": "date-time (預設: 現在時間)"
}
```

## 🔍 查詢參數

### 庫存列表篩選
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 10, 最大: 100)
- `status` - 庫存狀態篩選
- `lowStock` - 低庫存篩選 (true/false)
- `search` - 搜尋關鍵字 (SKU、供應商名稱、供應商SKU)
- `sortBy` - 排序欄位 (預設: lastUpdated)
- `sortOrder` - 排序方向 (asc/desc, 預設: desc)

### 交易記錄篩選
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 10)
- `type` - 交易類型篩選
- `reason` - 交易原因篩選
- `startDate` - 開始日期 (ISO 8601 格式)
- `endDate` - 結束日期 (ISO 8601 格式)

### 統計查詢參數
- `period` - 統計週期 (day/week/month/year, 預設: month)
- `startDate` - 開始日期 (ISO 8601 格式)
- `endDate` - 結束日期 (ISO 8601 格式)

### 預警查詢參數
- `threshold` - 預警閾值 (預設: 10)

### 範例查詢
```bash
# 取得低庫存商品
curl "http://localhost:3011/api/v1/inventory?lowStock=true&limit=20"

# 取得特定狀態的庫存
curl "http://localhost:3011/api/v1/inventory?status=low_stock"

# 搜尋庫存
curl "http://localhost:3011/api/v1/inventory?search=PROD-001"

# 取得特定時間範圍的交易記錄
curl "http://localhost:3011/api/v1/inventory/68b7d361f9f4bfdffafa3350/transactions?startDate=2025-01-01&endDate=2025-01-31"

# 取得本月統計
curl "http://localhost:3011/api/v1/inventory/stats?period=month"

# 取得低庫存預警
curl "http://localhost:3011/api/v1/inventory/alerts?threshold=5"
```

## 📦 庫存管理功能

### 1. 庫存追蹤
- **即時庫存**: 追蹤當前庫存數量
- **預留庫存**: 管理訂單預留的庫存
- **可用庫存**: 計算實際可用的庫存
- **庫存狀態**: 自動更新庫存狀態

### 2. 庫存變動
- **進貨**: 增加庫存數量
- **出庫**: 減少庫存數量
- **調整**: 手動調整庫存
- **轉移**: 庫存位置轉移
- **損耗**: 記錄庫存損耗

### 3. 庫存預留
- **預留**: 為訂單預留庫存
- **釋放**: 取消訂單時釋放庫存
- **確認**: 確認出庫時扣減庫存
- **追蹤**: 追蹤預留庫存狀態

### 4. 自動化功能
- **狀態同步**: 自動更新庫存狀態
- **低庫存預警**: 自動發送預警通知
- **自動補貨**: 自動觸發補貨流程
- **過期檢查**: 檢查商品過期日期

## 🔄 庫存流程

### 1. 庫存建立
```
商品建立 → 初始化庫存 → 設定庫存參數 → 建立交易記錄
```

### 2. 訂單處理
```
訂單建立 → 預留庫存 → 支付確認 → 確認出庫 → 扣減庫存
```

### 3. 庫存調整
```
庫存盤點 → 發現差異 → 手動調整 → 記錄交易 → 更新狀態
```

### 4. 自動補貨
```
庫存監控 → 觸發補貨 → 自動下單 → 進貨入庫 → 更新庫存
```

## 🔒 錯誤處理

### 常見錯誤碼
- `400` - 請求參數錯誤
- `401` - 未授權
- `403` - 權限不足
- `404` - 庫存記錄不存在
- `409` - 庫存記錄已存在
- `422` - 驗證失敗
- `500` - 伺服器錯誤

### 錯誤回應格式
```json
{
  "success": false,
  "message": "庫存更新失敗",
  "error": "詳細錯誤資訊"
}
```

## 🔄 業務邏輯

### 庫存建立
1. 驗證商品 ID 和 SKU
2. 檢查庫存記錄是否已存在
3. 建立庫存記錄
4. 建立初始交易記錄
5. 設定庫存參數

### 庫存更新
1. 驗證庫存記錄存在
2. 檢查庫存數量是否足夠
3. 更新庫存數量
4. 建立交易記錄
5. 更新庫存狀態

### 庫存預留
1. 檢查可用庫存
2. 預留庫存數量
3. 建立交易記錄
4. 更新庫存狀態

### 庫存釋放
1. 檢查預留庫存
2. 釋放預留庫存
3. 建立交易記錄
4. 更新庫存狀態

## 🧪 測試案例

### 單元測試
- 庫存 CRUD 操作
- 庫存變動邏輯
- 預留庫存管理
- 驗證規則

### 整合測試
- 庫存同步功能
- 自動化任務
- 錯誤處理
- 效能測試

### 端到端測試
- 完整庫存流程
- 多商品庫存管理
- 異常情況處理
- 定時任務

## 📈 效能考量

### 資料庫索引
- `productId` - 商品查詢優化
- `sku` - SKU 查詢優化
- `status` - 狀態篩選優化
- `currentStock` - 庫存數量查詢優化
- `lastUpdated` - 時間排序優化
- `location.warehouse` - 倉庫查詢優化

### 快取策略
- 庫存狀態快取 (5分鐘)
- 低庫存預警快取 (10分鐘)
- 庫存統計快取 (1小時)

### 定時任務
- 庫存狀態同步 (每5分鐘)
- 低庫存預警檢查 (每天上午9點)
- 自動補貨檢查 (每天上午10點)

## 🔐 安全性

### 資料保護
- 敏感資料加密
- 庫存資訊隔離
- 存取權限控制
- 審計日誌

### 庫存安全
- 庫存數量驗證
- 交易記錄追蹤
- 異常監控
- 防重複操作

## 📊 監控與告警

### 關鍵指標
- 庫存準確率
- 庫存週轉率
- 低庫存率
- 自動補貨成功率

### 告警規則
- 庫存不足預警
- 庫存異常變動
- 自動補貨失敗
- 系統錯誤

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Product Service API](../product-service/API_DOCUMENTATION.md)
- [Order Service API](../order-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-05)
- 初始版本發布
- 庫存管理功能
- 庫存預留功能
- 自動化任務
- 低庫存預警

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.0.0  
**維護者**: 電商系統開發團隊
