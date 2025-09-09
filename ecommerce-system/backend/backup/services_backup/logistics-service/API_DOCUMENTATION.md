# 🚚 電商系統 Logistics Service API 文檔

## 📋 概述

這是電商系統物流服務的 API 文檔，提供完整的物流配送功能，包括多種配送方式、物流追蹤、費用計算等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3010/api-docs/
- **健康檢查**: http://localhost:3010/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 🚚 配送管理
- `POST /api/v1/logistics/shipments` - 建立配送
- `GET /api/v1/logistics/shipments` - 取得配送列表
- `GET /api/v1/logistics/shipments/:shipmentId` - 取得配送詳情
- `GET /api/v1/logistics/shipments/:shipmentId/track` - 追蹤配送
- `POST /api/v1/logistics/shipments/:shipmentId/cancel` - 取消配送

### 💰 費用計算
- `POST /api/v1/logistics/calculate-cost` - 計算配送費用

### 📊 統計分析
- `GET /api/v1/logistics/stats` - 取得配送統計

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3010/health
```

### 2. 建立宅配配送
```bash
curl -X POST http://localhost:3010/api/v1/logistics/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "shippingAddress": {
      "name": "張三",
      "phone": "0912345678",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "returnAddress": {
      "name": "電商系統",
      "phone": "0223456789",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "packageInfo": {
      "weight": 1000,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 10
      },
      "value": 1000,
      "description": "測試商品"
    },
    "shippingMethod": "home_delivery",
    "specialInstructions": "請小心輕放",
    "insurance": {
      "enabled": true,
      "amount": 1000
    },
    "signatureRequired": true,
    "fragile": false
  }'
```

### 3. 建立超商取貨配送
```bash
curl -X POST http://localhost:3010/api/v1/logistics/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "shippingAddress": {
      "name": "李四",
      "phone": "0912345678",
      "storeCode": "7ELEVEN_001",
      "storeName": "7-ELEVEN 信義店",
      "storeAddress": "台北市信義區信義路五段7號"
    },
    "returnAddress": {
      "name": "電商系統",
      "phone": "0223456789",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "packageInfo": {
      "weight": 500,
      "dimensions": {
        "length": 25,
        "width": 15,
        "height": 8
      },
      "value": 500,
      "description": "測試商品"
    },
    "shippingMethod": "convenience_store"
  }'
```

### 4. 建立郵局配送
```bash
curl -X POST http://localhost:3010/api/v1/logistics/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "shippingAddress": {
      "name": "王五",
      "phone": "0912345678",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "returnAddress": {
      "name": "電商系統",
      "phone": "0223456789",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "packageInfo": {
      "weight": 800,
      "dimensions": {
        "length": 28,
        "width": 18,
        "height": 12
      },
      "value": 800,
      "description": "測試商品"
    },
    "shippingMethod": "post_office"
  }'
```

### 5. 建立快遞配送
```bash
curl -X POST http://localhost:3010/api/v1/logistics/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "shippingAddress": {
      "name": "趙六",
      "phone": "0912345678",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "returnAddress": {
      "name": "電商系統",
      "phone": "0223456789",
      "city": "台北市",
      "district": "信義區",
      "address": "信義路五段7號",
      "zipCode": "110"
    },
    "packageInfo": {
      "weight": 1200,
      "dimensions": {
        "length": 35,
        "width": 25,
        "height": 15
      },
      "value": 1200,
      "description": "測試商品"
    },
    "shippingMethod": "express"
  }'
```

### 6. 追蹤配送
```bash
curl http://localhost:3010/api/v1/logistics/shipments/SHIP_1234567890_ABC123/track
```

### 7. 取消配送
```bash
curl -X POST http://localhost:3010/api/v1/logistics/shipments/SHIP_1234567890_ABC123/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "客戶要求取消"
  }'
```

### 8. 計算配送費用
```bash
curl -X POST http://localhost:3010/api/v1/logistics/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "packageInfo": {
      "weight": 1000,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 10
      },
      "value": 1000,
      "description": "測試商品"
    },
    "shippingMethod": "home_delivery",
    "shippingAddress": {
      "city": "台北市",
      "district": "信義區"
    },
    "returnAddress": {
      "city": "台北市",
      "district": "信義區"
    }
  }'
```

### 9. 取得配送統計
```bash
curl "http://localhost:3010/api/v1/logistics/stats?period=month"
```

## 📋 資料模型

### Shipment (配送)
```json
{
  "_id": "string",
  "shipmentId": "string (必填, 唯一)",
  "orderId": "string (必填, ObjectId)",
  "userId": "string (必填, ObjectId)",
  "status": "string (enum: pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned, cancelled)",
  "shippingAddress": {
    "name": "string (必填)",
    "phone": "string (必填)",
    "city": "string (必填)",
    "district": "string (必填)",
    "address": "string (必填)",
    "zipCode": "string (必填)",
    "coordinates": {
      "latitude": "number",
      "longitude": "number"
    }
  },
  "returnAddress": {
    "name": "string (必填)",
    "phone": "string (必填)",
    "city": "string (必填)",
    "district": "string (必填)",
    "address": "string (必填)",
    "zipCode": "string (必填)"
  },
  "packageInfo": {
    "weight": "number (必填, 最小值0, 最大值30000)",
    "dimensions": {
      "length": "number (必填, 最小值0, 最大值150)",
      "width": "number (必填, 最小值0, 最大值150)",
      "height": "number (必填, 最小值0, 最大值150)"
    },
    "value": "number (必填, 最小值0)",
    "description": "string (必填)",
    "items": [
      {
        "name": "string",
        "quantity": "number",
        "value": "number"
      }
    ]
  },
  "shippingInfo": {
    "method": "string (enum: home_delivery, convenience_store, post_office, express, standard)",
    "provider": "string (enum: black_cat, post_office, convenience_store, express)",
    "trackingNumber": "string (唯一)",
    "externalTrackingId": "string (外部追蹤ID)",
    "estimatedDelivery": "date-time",
    "actualDelivery": "date-time",
    "deliveryAttempts": "number (預設: 0)",
    "deliveryNotes": "string",
    "signature": "string",
    "photo": "string"
  },
  "costInfo": {
    "baseFee": "number (必填, 最小值0)",
    "weightFee": "number (預設: 0, 最小值0)",
    "distanceFee": "number (預設: 0, 最小值0)",
    "specialFee": "number (預設: 0, 最小值0)",
    "totalFee": "number (必填, 最小值0)",
    "currency": "string (預設: TWD)"
  },
  "trackingEvents": [
    {
      "status": "string (enum: pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned, cancelled)",
      "description": "string (必填)",
      "location": "string",
      "timestamp": "date-time (預設: 現在時間)",
      "provider": "string (enum: black_cat, post_office, convenience_store, express)",
      "externalData": "object (預設: {})"
    }
  ],
  "specialInstructions": "string",
  "insurance": {
    "enabled": "boolean (預設: false)",
    "amount": "number (預設: 0)"
  },
  "signatureRequired": "boolean (預設: true)",
  "fragile": "boolean (預設: false)",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

## 🔍 查詢參數

### 配送列表篩選
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 10, 最大: 100)
- `status` - 配送狀態篩選
- `method` - 配送方式篩選
- `userId` - 用戶 ID 篩選
- `orderId` - 訂單 ID 篩選
- `sortBy` - 排序欄位 (預設: createdAt)
- `sortOrder` - 排序方向 (asc/desc, 預設: desc)

### 統計查詢參數
- `period` - 統計週期 (day/week/month/year, 預設: month)
- `startDate` - 開始日期 (ISO 8601 格式)
- `endDate` - 結束日期 (ISO 8601 格式)

### 範例查詢
```bash
# 取得待處理配送
curl "http://localhost:3010/api/v1/logistics/shipments?status=pending&limit=20"

# 取得特定用戶的配送
curl "http://localhost:3010/api/v1/logistics/shipments?userId=68b7d361f9f4bfdffafa3350"

# 取得特定訂單的配送
curl "http://localhost:3010/api/v1/logistics/shipments?orderId=68b7d361f9f4bfdffafa3350"

# 取得宅配配送
curl "http://localhost:3010/api/v1/logistics/shipments?method=home_delivery"

# 取得本月統計
curl "http://localhost:3010/api/v1/logistics/stats?period=month"

# 取得指定日期範圍統計
curl "http://localhost:3010/api/v1/logistics/stats?startDate=2025-01-01&endDate=2025-01-31"
```

## 🚚 支援的配送方式

### 1. 宅配 (Home Delivery)
- **提供者**: 黑貓宅急便
- **配送時間**: 1-3 個工作天
- **費用**: 基礎費用 + 重量費用
- **特色**: 門到門配送、簽收確認

### 2. 超商取貨 (Convenience Store)
- **提供者**: 7-ELEVEN、全家、萊爾富
- **配送時間**: 2-4 個工作天
- **費用**: 基礎費用的 80%
- **特色**: 24小時取貨、免運費門檻

### 3. 郵局配送 (Post Office)
- **提供者**: 中華郵政
- **配送時間**: 2-5 個工作天
- **費用**: 基礎費用的 60%
- **特色**: 全台覆蓋、價格實惠

### 4. 快遞 (Express)
- **提供者**: 快遞公司
- **配送時間**: 當日或隔日
- **費用**: 基礎費用的 200%
- **特色**: 快速配送、優先處理

### 5. 標準配送 (Standard)
- **提供者**: 黑貓宅急便
- **配送時間**: 3-5 個工作天
- **費用**: 基礎費用
- **特色**: 經濟實惠、穩定可靠

## 🔄 配送流程

### 1. 建立配送
```
用戶下單 → 選擇配送方式 → 建立配送記錄 → 調用物流商 API → 生成追蹤號碼
```

### 2. 配送追蹤
```
物流商取件 → 運輸中 → 配送中 → 送達 → 簽收確認
```

### 3. 狀態更新
```
定時任務 → 查詢物流商 API → 更新配送狀態 → 記錄追蹤事件
```

## 🔒 錯誤處理

### 常見錯誤碼
- `400` - 請求參數錯誤
- `401` - 未授權
- `403` - 權限不足
- `404` - 配送記錄不存在
- `409` - 配送狀態衝突
- `422` - 驗證失敗
- `500` - 伺服器錯誤

### 錯誤回應格式
```json
{
  "success": false,
  "message": "配送建立失敗",
  "error": "詳細錯誤資訊"
}
```

## 🔄 業務邏輯

### 配送建立
1. 驗證配送參數
2. 檢查包裹重量和尺寸
3. 生成配送 ID
4. 調用物流商 API
5. 建立配送記錄
6. 計算配送費用

### 配送追蹤
1. 查詢物流商 API
2. 更新配送狀態
3. 記錄追蹤事件
4. 通知相關方

### 費用計算
1. 基礎費用計算
2. 重量費用計算
3. 距離費用計算
4. 特殊費用計算
5. 總費用計算

## 🧪 測試案例

### 單元測試
- 配送 CRUD 操作
- 配送狀態轉換
- 費用計算邏輯
- 驗證規則

### 整合測試
- 與物流商 API 整合
- 追蹤功能
- 錯誤處理
- 效能測試

### 端到端測試
- 完整配送流程
- 多種配送方式
- 異常情況處理
- 定時任務

## 📈 效能考量

### 資料庫索引
- `shipmentId` - 配送 ID 查詢優化
- `orderId` - 訂單查詢優化
- `userId` - 用戶查詢優化
- `status` - 狀態篩選優化
- `trackingNumber` - 追蹤號碼查詢優化
- `createdAt` - 時間排序優化

### 快取策略
- 配送狀態快取 (5分鐘)
- 物流商 API 回應快取 (10分鐘)
- 費用計算結果快取 (1小時)

### 定時任務
- 配送狀態更新 (每5分鐘)
- 過期追蹤記錄清理 (每天凌晨2點)

## 🔐 安全性

### 資料保護
- 敏感資料加密
- 配送資訊隔離
- 存取權限控制
- 審計日誌

### 物流安全
- API 認證
- 追蹤號碼驗證
- 配送狀態驗證
- 異常監控

## 📊 監控與告警

### 關鍵指標
- 配送成功率
- 配送準時率
- 配送費用
- 客戶滿意度

### 告警規則
- 配送失敗率過高
- 配送延遲過長
- 物流商 API 異常
- 系統錯誤

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Order Service API](../order-service/API_DOCUMENTATION.md)
- [Payment Service API](../payment-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-05)
- 初始版本發布
- 支援多種配送方式
- 配送追蹤功能
- 費用計算功能
- 定時任務更新

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.0.0  
**維護者**: 電商系統開發團隊
