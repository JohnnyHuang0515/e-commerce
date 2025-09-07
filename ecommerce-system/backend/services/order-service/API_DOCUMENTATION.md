# 🛒 電商系統 Order Service API 文檔

## 📋 概述

這是電商系統訂單服務的 API 文檔，提供完整的訂單管理功能，包括訂單 CRUD、狀態管理、退款處理等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3003/api-docs/
- **健康檢查**: http://localhost:3003/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 📦 訂單管理
- `GET /api/v1/orders` - 取得訂單列表
- `GET /api/v1/orders/:orderId` - 取得訂單詳情
- `POST /api/v1/orders` - 建立新訂單
- `PUT /api/v1/orders/:orderId` - 更新訂單
- `DELETE /api/v1/orders/:orderId` - 刪除訂單

### 🔄 訂單狀態管理
- `PUT /api/v1/orders/:orderId/status` - 更新訂單狀態
- `POST /api/v1/orders/:orderId/cancel` - 取消訂單
- `POST /api/v1/orders/:orderId/refund` - 退款處理

### 📊 訂單統計
- `GET /api/v1/orders/statistics` - 取得訂單統計
- `GET /api/v1/orders/overview` - 取得訂單概覽

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3003/health
```

### 2. 取得訂單列表
```bash
curl http://localhost:3003/api/v1/orders
```

### 3. 建立新訂單
```bash
curl -X POST http://localhost:3003/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68b7d361f9f4bfdffafa3350",
    "items": [
      {
        "productId": "68b7d361f9f4bfdffafa3351",
        "quantity": 2,
        "price": 1000
      }
    ],
    "shipping": {
      "address": "台北市信義區信義路五段7號",
      "city": "台北市",
      "postalCode": "110",
      "country": "台灣"
    },
    "payment": {
      "method": "credit_card",
      "status": "pending"
    }
  }'
```

### 4. 更新訂單狀態
```bash
curl -X PUT http://localhost:3003/api/v1/orders/68b7d361f9f4bfdffafa3352/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

### 5. 取得訂單統計
```bash
curl http://localhost:3003/api/v1/orders/statistics
```

## 📋 資料模型

### Order (訂單)
```json
{
  "_id": "string",
  "orderNumber": "string (自動生成)",
  "userId": "string (必填, ObjectId)",
  "items": [
    {
      "productId": "string (必填, ObjectId)",
      "quantity": "number (必填, 最小值1)",
      "price": "number (必填, 最小值0)"
    }
  ],
  "subtotal": "number (自動計算)",
  "tax": "number (預設0)",
  "shippingCost": "number (預設0)",
  "total": "number (自動計算)",
  "status": "string (enum: pending, confirmed, shipped, delivered, cancelled, refunded)",
  "shipping": {
    "address": "string (必填)",
    "city": "string (必填)",
    "postalCode": "string (必填)",
    "country": "string (必填)"
  },
  "payment": {
    "method": "string (enum: credit_card, bank_transfer, cash_on_delivery)",
    "status": "string (enum: pending, paid, failed, refunded)",
    "transactionId": "string (可選)"
  },
  "notes": "string (可選)",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Order Statistics (訂單統計)
```json
{
  "total": "number",
  "pending": "number",
  "confirmed": "number",
  "shipped": "number",
  "delivered": "number",
  "cancelled": "number",
  "refunded": "number",
  "totalRevenue": "number",
  "averageOrderValue": "number",
  "todayOrders": "number",
  "thisWeekOrders": "number",
  "thisMonthOrders": "number"
}
```

## 🔍 查詢參數

### 訂單列表篩選
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 10, 最大: 100)
- `status` - 訂單狀態篩選
- `userId` - 用戶 ID 篩選
- `startDate` - 開始日期 (ISO 8601)
- `endDate` - 結束日期 (ISO 8601)
- `sortBy` - 排序欄位 (預設: createdAt)
- `sortOrder` - 排序方向 (asc/desc, 預設: desc)

### 範例查詢
```bash
# 取得待處理訂單
curl "http://localhost:3003/api/v1/orders?status=pending&limit=20"

# 取得特定用戶的訂單
curl "http://localhost:3003/api/v1/orders?userId=68b7d361f9f4bfdffafa3350"

# 取得本月訂單
curl "http://localhost:3003/api/v1/orders?startDate=2025-09-01&endDate=2025-09-30"
```

## 📊 狀態流程

### 訂單狀態轉換
```
pending → confirmed → shipped → delivered
   ↓         ↓         ↓         ↓
cancelled  cancelled  cancelled  refunded
```

### 狀態說明
- **pending** - 待處理：訂單已建立，等待確認
- **confirmed** - 已確認：訂單已確認，準備出貨
- **shipped** - 已出貨：商品已出貨，運送中
- **delivered** - 已送達：商品已送達客戶
- **cancelled** - 已取消：訂單被取消
- **refunded** - 已退款：訂單已退款

## 🔒 錯誤處理

### 常見錯誤碼
- `400` - 請求參數錯誤
- `401` - 未授權
- `403` - 權限不足
- `404` - 訂單不存在
- `409` - 訂單狀態衝突
- `422` - 驗證失敗
- `500` - 伺服器錯誤

### 錯誤回應格式
```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "訂單不存在",
    "details": "Order with ID 68b7d361f9f4bfdffafa3352 not found"
  }
}
```

## 🔄 業務邏輯

### 訂單建立
1. 驗證用戶存在
2. 驗證商品存在和庫存
3. 計算訂單總額
4. 生成訂單號碼
5. 建立訂單記錄

### 狀態更新
1. 驗證狀態轉換合法性
2. 更新訂單狀態
3. 記錄狀態變更歷史
4. 觸發相關業務邏輯

### 退款處理
1. 驗證訂單可退款
2. 計算退款金額
3. 更新訂單狀態
4. 記錄退款資訊

## 🧪 測試案例

### 單元測試
- 訂單 CRUD 操作
- 狀態轉換邏輯
- 金額計算
- 驗證規則

### 整合測試
- 與 User Service 整合
- 與 Product Service 整合
- 與 Payment Service 整合

### 端到端測試
- 完整訂單流程
- 退款流程
- 統計功能

## 📈 效能考量

### 資料庫索引
- `userId` - 用戶查詢優化
- `status` - 狀態篩選優化
- `createdAt` - 時間排序優化
- `orderNumber` - 訂單號查詢優化

### 快取策略
- 訂單統計快取 (5分鐘)
- 熱門商品快取 (1小時)
- 用戶訂單快取 (10分鐘)

## 🔐 安全性

### 權限控制
- 管理員：所有操作
- 用戶：僅能查看自己的訂單
- 客服：可查看和更新訂單狀態

### 資料驗證
- 輸入參數驗證
- SQL 注入防護
- XSS 防護
- 速率限制

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [User Service API](../user-service/API_DOCUMENTATION.md)
- [Product Service API](../product-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-04)
- 初始版本發布
- 基本 CRUD 功能
- 狀態管理
- 統計功能

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.0.0  
**維護者**: 電商系統開發團隊
