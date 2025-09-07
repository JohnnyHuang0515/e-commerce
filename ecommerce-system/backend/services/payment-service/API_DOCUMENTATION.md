# 💳 電商系統 Payment Service API 文檔

## 📋 概述

這是電商系統支付服務的 API 文檔，提供完整的支付處理功能，包括多種支付方式、交易管理、退款處理等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3009/api-docs/
- **健康檢查**: http://localhost:3009/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 💳 支付管理
- `POST /api/v1/payments` - 建立支付
- `GET /api/v1/payments` - 取得支付列表
- `GET /api/v1/payments/:paymentId` - 取得支付詳情
- `POST /api/v1/payments/:paymentId/confirm` - 確認支付
- `POST /api/v1/payments/:paymentId/cancel` - 取消支付
- `POST /api/v1/payments/:paymentId/refund` - 處理退款

### 🔗 Webhook 處理
- `POST /api/v1/payments/webhook/:provider` - 處理支付 Webhook

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3009/health
```

### 2. 建立 Stripe 支付
```bash
curl -X POST http://localhost:3009/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "amount": 1000,
    "currency": "TWD",
    "method": "stripe",
    "metadata": {
      "productName": "測試商品"
    }
  }'
```

### 3. 建立 PayPal 支付
```bash
curl -X POST http://localhost:3009/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "amount": 1000,
    "currency": "TWD",
    "method": "paypal"
  }'
```

### 4. 建立 Line Pay 支付
```bash
curl -X POST http://localhost:3009/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "amount": 1000,
    "currency": "TWD",
    "method": "line_pay"
  }'
```

### 5. 建立銀行轉帳支付
```bash
curl -X POST http://localhost:3009/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "amount": 1000,
    "currency": "TWD",
    "method": "bank_transfer"
  }'
```

### 6. 建立貨到付款
```bash
curl -X POST http://localhost:3009/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "68b7d361f9f4bfdffafa3350",
    "userId": "68b7d361f9f4bfdffafa3351",
    "amount": 1000,
    "currency": "TWD",
    "method": "cash_on_delivery"
  }'
```

### 7. 確認支付
```bash
curl -X POST http://localhost:3009/api/v1/payments/PAY_1234567890_ABC123/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "pi_1234567890",
    "amount": 1000,
    "currency": "TWD"
  }'
```

### 8. 處理退款
```bash
curl -X POST http://localhost:3009/api/v1/payments/PAY_1234567890_ABC123/refund \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "reason": "商品瑕疵"
  }'
```

## 📋 資料模型

### Payment (支付)
```json
{
  "_id": "string",
  "paymentId": "string (必填, 唯一)",
  "orderId": "string (必填, ObjectId)",
  "userId": "string (必填, ObjectId)",
  "paymentInfo": {
    "method": "string (enum: stripe, paypal, line_pay, bank_transfer, cash_on_delivery)",
    "provider": "string (enum: stripe, paypal, line_pay, bank, cash)",
    "amount": "number (必填, 最小值0)",
    "currency": "string (預設: TWD)",
    "status": "string (enum: pending, processing, success, failed, cancelled, refunded, partially_refunded)",
    "transactionId": "string (唯一)",
    "externalTransactionId": "string (外部交易ID)",
    "gatewayResponse": "object (支付閘道回應)",
    "fees": {
      "processing": "number (處理費)",
      "gateway": "number (閘道費)",
      "total": "number (總費用)"
    },
    "metadata": "object (額外資料)"
  },
  "refunds": [
    {
      "refundId": "string (唯一)",
      "amount": "number (退款金額)",
      "reason": "string (退款原因)",
      "status": "string (enum: pending, processing, success, failed)",
      "processedAt": "date-time",
      "externalRefundId": "string (外部退款ID)",
      "gatewayResponse": "object (閘道回應)"
    }
  ],
  "totalRefunded": "number (總退款金額)",
  "expiresAt": "date-time (過期時間)",
  "paidAt": "date-time (支付時間)",
  "cancelledAt": "date-time (取消時間)",
  "webhookEvents": [
    {
      "event": "string (事件類型)",
      "data": "object (事件資料)",
      "receivedAt": "date-time"
    }
  ],
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

## 🔍 查詢參數

### 支付列表篩選
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 10, 最大: 100)
- `status` - 支付狀態篩選
- `method` - 支付方式篩選
- `userId` - 用戶 ID 篩選
- `orderId` - 訂單 ID 篩選
- `sortBy` - 排序欄位 (預設: createdAt)
- `sortOrder` - 排序方向 (asc/desc, 預設: desc)

### 範例查詢
```bash
# 取得待處理支付
curl "http://localhost:3009/api/v1/payments?status=pending&limit=20"

# 取得特定用戶的支付
curl "http://localhost:3009/api/v1/payments?userId=68b7d361f9f4bfdffafa3350"

# 取得特定訂單的支付
curl "http://localhost:3009/api/v1/payments?orderId=68b7d361f9f4bfdffafa3350"

# 取得 Stripe 支付
curl "http://localhost:3009/api/v1/payments?method=stripe"
```

## 💳 支援的支付方式

### 1. Stripe (信用卡)
- **提供者**: Stripe
- **支援貨幣**: TWD, USD, EUR, JPY
- **手續費**: 2.9% + $0.30 (USD)
- **處理時間**: 即時
- **退款**: 支援

### 2. PayPal
- **提供者**: PayPal
- **支援貨幣**: TWD, USD, EUR, JPY
- **手續費**: 3.4% + 固定費用
- **處理時間**: 即時
- **退款**: 支援

### 3. Line Pay
- **提供者**: Line Pay
- **支援貨幣**: TWD, JPY
- **手續費**: 2.5%
- **處理時間**: 即時
- **退款**: 支援

### 4. 銀行轉帳
- **提供者**: 銀行
- **支援貨幣**: TWD
- **手續費**: 0%
- **處理時間**: 1-3 個工作天
- **退款**: 手動處理

### 5. 貨到付款
- **提供者**: 現金
- **支援貨幣**: TWD
- **手續費**: 固定費用
- **處理時間**: 配送時
- **退款**: 手動處理

## 🔄 支付流程

### 1. 建立支付
```
用戶選擇支付方式 → 建立支付記錄 → 調用支付閘道 → 返回支付資訊
```

### 2. 確認支付
```
用戶完成支付 → 支付閘道通知 → 確認支付狀態 → 更新訂單狀態
```

### 3. 退款流程
```
申請退款 → 驗證退款條件 → 調用退款 API → 更新支付狀態
```

## 🔒 錯誤處理

### 常見錯誤碼
- `400` - 請求參數錯誤
- `401` - 未授權
- `403` - 權限不足
- `404` - 支付記錄不存在
- `409` - 支付狀態衝突
- `422` - 驗證失敗
- `500` - 伺服器錯誤

### 錯誤回應格式
```json
{
  "success": false,
  "message": "支付建立失敗",
  "error": "詳細錯誤資訊"
}
```

## 🔄 業務邏輯

### 支付建立
1. 驗證支付參數
2. 檢查金額限制
3. 生成支付 ID
4. 調用支付閘道
5. 建立支付記錄
6. 設定過期時間

### 支付確認
1. 驗證支付狀態
2. 檢查過期時間
3. 調用確認 API
4. 更新支付狀態
5. 記錄支付時間

### 退款處理
1. 驗證退款條件
2. 檢查可退款金額
3. 調用退款 API
4. 更新退款狀態
5. 記錄退款資訊

## 🧪 測試案例

### 單元測試
- 支付 CRUD 操作
- 支付狀態轉換
- 退款邏輯
- 驗證規則

### 整合測試
- 與支付閘道整合
- Webhook 處理
- 錯誤處理
- 效能測試

### 端到端測試
- 完整支付流程
- 退款流程
- 多種支付方式
- 異常情況處理

## 📈 效能考量

### 資料庫索引
- `paymentId` - 支付 ID 查詢優化
- `orderId` - 訂單查詢優化
- `userId` - 用戶查詢優化
- `status` - 狀態篩選優化
- `createdAt` - 時間排序優化

### 快取策略
- 支付狀態快取 (5分鐘)
- 支付閘道回應快取 (1小時)
- 用戶支付歷史快取 (10分鐘)

## 🔐 安全性

### 資料保護
- 敏感資料加密
- 支付資訊隔離
- 存取權限控制
- 審計日誌

### 支付安全
- Webhook 驗證
- 交易簽名
- 重複支付防護
- 金額驗證

## 📊 監控與告警

### 關鍵指標
- 支付成功率
- 支付處理時間
- 退款率
- 錯誤率

### 告警規則
- 支付失敗率過高
- 支付處理時間過長
- 支付閘道異常
- 系統錯誤

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Order Service API](../order-service/API_DOCUMENTATION.md)
- [Settings Service API](../settings-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-05)
- 初始版本發布
- 支援多種支付方式
- 支付確認功能
- 退款處理功能
- Webhook 處理

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.0.0  
**維護者**: 電商系統開發團隊
