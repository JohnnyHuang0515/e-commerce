# ⚙️ 電商系統 Settings Service API 文檔

## 📋 概述

這是電商系統設定服務的 API 文檔，提供完整的系統設定管理功能，包括系統配置、支付設定、物流設定、通知設定等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3007/api-docs/
- **健康檢查**: http://localhost:3007/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### ⚙️ 系統設定
- `GET /api/v1/settings` - 取得系統設定
- `PUT /api/v1/settings` - 更新系統設定
- `GET /api/v1/settings/categories` - 取得設定分類
- `GET /api/v1/settings/:key` - 取得特定設定
- `PUT /api/v1/settings/:key` - 更新特定設定

### 💳 支付設定
- `GET /api/v1/settings/payment` - 取得支付設定
- `PUT /api/v1/settings/payment` - 更新支付設定
- `GET /api/v1/settings/payment/methods` - 取得支付方式
- `POST /api/v1/settings/payment/methods` - 新增支付方式
- `PUT /api/v1/settings/payment/methods/:id` - 更新支付方式
- `DELETE /api/v1/settings/payment/methods/:id` - 刪除支付方式

### 🚚 物流設定
- `GET /api/v1/settings/shipping` - 取得物流設定
- `PUT /api/v1/settings/shipping` - 更新物流設定
- `GET /api/v1/settings/shipping/zones` - 取得配送區域
- `POST /api/v1/settings/shipping/zones` - 新增配送區域
- `PUT /api/v1/settings/shipping/zones/:id` - 更新配送區域
- `DELETE /api/v1/settings/shipping/zones/:id` - 刪除配送區域

### 🔔 通知設定
- `GET /api/v1/settings/notifications` - 取得通知設定
- `PUT /api/v1/settings/notifications` - 更新通知設定
- `GET /api/v1/settings/notifications/templates` - 取得通知模板
- `POST /api/v1/settings/notifications/templates` - 新增通知模板
- `PUT /api/v1/settings/notifications/templates/:id` - 更新通知模板
- `DELETE /api/v1/settings/notifications/templates/:id` - 刪除通知模板

### 🔐 安全設定
- `GET /api/v1/settings/security` - 取得安全設定
- `PUT /api/v1/settings/security` - 更新安全設定
- `GET /api/v1/settings/security/policies` - 取得安全政策
- `PUT /api/v1/settings/security/policies` - 更新安全政策

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3007/health
```

### 2. 取得系統設定
```bash
curl http://localhost:3007/api/v1/settings
```

### 3. 更新系統設定
```bash
curl -X PUT http://localhost:3007/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "我的電商平台",
    "siteDescription": "優質商品，值得信賴",
    "currency": "TWD",
    "timezone": "Asia/Taipei",
    "language": "zh-TW"
  }'
```

### 4. 取得支付設定
```bash
curl http://localhost:3007/api/v1/settings/payment
```

### 5. 新增支付方式
```bash
curl -X POST http://localhost:3007/api/v1/settings/payment/methods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "信用卡",
    "type": "credit_card",
    "enabled": true,
    "config": {
      "merchantId": "merchant_123",
      "apiKey": "api_key_456",
      "testMode": true
    }
  }'
```

### 6. 取得物流設定
```bash
curl http://localhost:3007/api/v1/settings/shipping
```

## 📋 資料模型

### System Settings (系統設定)
```json
{
  "_id": "string",
  "key": "string (必填, 唯一)",
  "value": "any (設定值)",
  "category": "string (enum: general, payment, shipping, notification, security)",
  "type": "string (enum: string, number, boolean, object, array)",
  "description": "string (設定說明)",
  "isPublic": "boolean (是否公開, 預設false)",
  "isRequired": "boolean (是否必填, 預設false)",
  "validation": {
    "min": "number (最小值)",
    "max": "number (最大值)",
    "pattern": "string (正則表達式)",
    "options": ["string"] (可選值)
  },
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Payment Settings (支付設定)
```json
{
  "defaultCurrency": "string (預設: TWD)",
  "supportedCurrencies": ["string"],
  "paymentMethods": [
    {
      "_id": "string",
      "name": "string (必填)",
      "type": "string (enum: credit_card, bank_transfer, digital_wallet, cash_on_delivery)",
      "enabled": "boolean (預設: true)",
      "config": {
        "merchantId": "string",
        "apiKey": "string",
        "secretKey": "string",
        "testMode": "boolean (預設: true)",
        "webhookUrl": "string",
        "returnUrl": "string",
        "cancelUrl": "string"
      },
      "fees": {
        "fixed": "number (固定手續費)",
        "percentage": "number (百分比手續費)"
      },
      "processingTime": "string (處理時間)",
      "minAmount": "number (最小金額)",
      "maxAmount": "number (最大金額)"
    }
  ],
  "refundPolicy": {
    "enabled": "boolean",
    "timeLimit": "number (天數)",
    "autoApproval": "boolean",
    "conditions": ["string"]
  }
}
```

### Shipping Settings (物流設定)
```json
{
  "defaultShippingMethod": "string",
  "shippingZones": [
    {
      "_id": "string",
      "name": "string (必填)",
      "countries": ["string"],
      "regions": ["string"],
      "methods": [
        {
          "name": "string (必填)",
          "type": "string (enum: standard, express, overnight)",
          "enabled": "boolean (預設: true)",
          "cost": {
            "fixed": "number (固定費用)",
            "perKg": "number (每公斤費用)",
            "freeThreshold": "number (免運門檻)"
          },
          "deliveryTime": {
            "min": "number (最小天數)",
            "max": "number (最大天數)"
          },
          "weightLimit": "number (重量限制)",
          "sizeLimit": {
            "length": "number",
            "width": "number",
            "height": "number"
          }
        }
      ]
    }
  ],
  "packaging": {
    "defaultBoxSize": "string",
    "boxSizes": [
      {
        "name": "string",
        "dimensions": {
          "length": "number",
          "width": "number",
          "height": "number"
        },
        "maxWeight": "number",
        "cost": "number"
      }
    ]
  }
}
```

### Notification Settings (通知設定)
```json
{
  "email": {
    "enabled": "boolean (預設: true)",
    "smtp": {
      "host": "string",
      "port": "number",
      "secure": "boolean",
      "auth": {
        "user": "string",
        "pass": "string"
      }
    },
    "from": {
      "name": "string",
      "email": "string"
    },
    "templates": [
      {
        "_id": "string",
        "name": "string (必填)",
        "type": "string (enum: order_confirmation, shipping_notification, payment_receipt)",
        "subject": "string (必填)",
        "html": "string (必填)",
        "text": "string (可選)",
        "variables": ["string"],
        "enabled": "boolean (預設: true)"
      }
    ]
  },
  "sms": {
    "enabled": "boolean (預設: false)",
    "provider": "string",
    "apiKey": "string",
    "templates": [
      {
        "_id": "string",
        "name": "string (必填)",
        "type": "string",
        "message": "string (必填)",
        "variables": ["string"],
        "enabled": "boolean (預設: true)"
      }
    ]
  },
  "push": {
    "enabled": "boolean (預設: true)",
    "firebase": {
      "serverKey": "string",
      "projectId": "string"
    }
  }
}
```

### Security Settings (安全設定)
```json
{
  "password": {
    "minLength": "number (預設: 8)",
    "requireUppercase": "boolean (預設: true)",
    "requireLowercase": "boolean (預設: true)",
    "requireNumbers": "boolean (預設: true)",
    "requireSpecialChars": "boolean (預設: true)",
    "maxAge": "number (天數, 預設: 90)",
    "historyCount": "number (預設: 5)"
  },
  "session": {
    "timeout": "number (分鐘, 預設: 30)",
    "maxConcurrent": "number (預設: 3)",
    "secure": "boolean (預設: true)",
    "httpOnly": "boolean (預設: true)",
    "sameSite": "string (預設: strict)"
  },
  "rateLimiting": {
    "enabled": "boolean (預設: true)",
    "windowMs": "number (毫秒, 預設: 900000)",
    "maxRequests": "number (預設: 100)",
    "skipSuccessfulRequests": "boolean (預設: false)"
  },
  "twoFactor": {
    "enabled": "boolean (預設: false)",
    "requiredForAdmin": "boolean (預設: true)",
    "methods": ["string"] (enum: sms, email, authenticator)
  },
  "ipWhitelist": {
    "enabled": "boolean (預設: false)",
    "ips": ["string"],
    "ranges": ["string"]
  }
}
```

## 🔍 查詢參數

### 設定查詢
- `category` - 設定分類篩選
- `isPublic` - 是否公開篩選
- `isRequired` - 是否必填篩選
- `search` - 搜尋關鍵字

### 範例查詢
```bash
# 取得所有公開設定
curl "http://localhost:3007/api/v1/settings?isPublic=true"

# 取得支付相關設定
curl "http://localhost:3007/api/v1/settings?category=payment"

# 搜尋特定設定
curl "http://localhost:3007/api/v1/settings?search=currency"
```

## 🔄 業務邏輯

### 設定更新
1. 驗證設定值格式
2. 檢查權限
3. 更新設定
4. 記錄變更歷史
5. 通知相關服務
6. 更新快取

### 設定驗證
1. 檢查必填設定
2. 驗證資料格式
3. 檢查業務規則
4. 驗證相依性
5. 生成驗證報告

### 設定初始化
1. 載入預設設定
2. 檢查環境變數
3. 驗證設定完整性
4. 建立設定快取
5. 通知其他服務

## 🧪 測試案例

### 單元測試
- 設定 CRUD 操作
- 資料驗證
- 權限檢查
- 設定初始化

### 整合測試
- 與其他服務整合
- 設定同步
- 快取更新
- 通知機制

### 端到端測試
- 完整設定流程
- 設定變更影響
- 系統重啟恢復
- 設定備份還原

## 📈 效能考量

### 資料庫優化
- 設定索引優化
- 分類分區策略
- 查詢優化
- 資料壓縮

### 快取策略
- Redis 快取熱門設定
- 分層快取架構
- 快取失效策略
- 設定預載入

### 資料處理
- 批次設定更新
- 異步設定同步
- 增量更新策略
- 設定壓縮存儲

## 🔐 安全性

### 資料保護
- 敏感設定加密
- 存取權限控制
- 設定變更審計
- 備份加密

### 權限控制
- 角色基礎存取控制
- API 權限驗證
- 設定範圍限制
- 操作日誌記錄

### 安全設定
- 密碼政策
- 會話管理
- 速率限制
- IP 白名單

## 📊 監控與告警

### 關鍵指標
- API 回應時間
- 設定更新頻率
- 快取命中率
- 錯誤率

### 告警規則
- 設定驗證失敗
- 敏感設定變更
- 系統錯誤告警
- 效能下降告警

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Auth Service API](../auth-service/API_TEST.md)
- [Analytics Service API](../analytics-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-04)
- 初始版本發布
- 基本設定管理
- 支付設定
- 物流設定
- 通知設定
- 安全設定

### v1.1.0 (2025-09-05)
- 新增設定驗證
- 新增設定歷史
- 優化查詢效能
- 增強安全性

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.1.0  
**維護者**: 電商系統開發團隊
