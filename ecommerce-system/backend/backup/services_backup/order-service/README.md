# 📦 Order Service

電商系統 - 訂單管理服務

## 🚀 功能特色

- **訂單管理**: 完整的訂單 CRUD 操作
- **狀態管理**: 訂單狀態流轉 (pending → paid → shipped → delivered)
- **退款處理**: 支援部分和全額退款
- **統計分析**: 訂單統計和概覽資料
- **API 文檔**: 完整的 Swagger 文檔
- **認證授權**: JWT Token 認證 (簡化版本)
- **資料驗證**: 完整的輸入驗證
- **錯誤處理**: 統一的錯誤處理機制

## 📋 API 端點

### 訂單管理
- `GET /api/v1/orders` - 取得訂單列表
- `GET /api/v1/orders/{orderId}` - 取得單一訂單
- `POST /api/v1/orders` - 建立新訂單
- `PUT /api/v1/orders/{orderId}/status` - 更新訂單狀態
- `POST /api/v1/orders/{orderId}/cancel` - 取消訂單
- `POST /api/v1/orders/{orderId}/refund` - 退款處理

### 統計分析
- `GET /api/v1/orders/statistics` - 取得訂單統計
- `GET /api/v1/orders/overview` - 取得訂單概覽

### 系統
- `GET /health` - 健康檢查
- `GET /api-docs` - API 文檔

## 🗄️ 資料模型

### Order Schema
```javascript
{
  orderNumber: String,        // 訂單編號 (自動生成)
  userId: ObjectId,          // 用戶 ID
  status: String,            // 訂單狀態
  total: Number,             // 總金額
  subtotal: Number,          // 小計
  tax: Number,              // 稅金
  shipping: Number,         // 運費
  discount: Number,         // 折扣
  currency: String,         // 貨幣
  items: [OrderItem],       // 商品項目
  shippingAddress: Address, // 收貨地址
  billingAddress: Address,  // 帳單地址
  payment: Payment,         // 付款資訊
  shipping: Shipping,       // 物流資訊
  notes: String,            // 備註
  createdAt: Date,          // 建立時間
  updatedAt: Date          // 更新時間
}
```

### 訂單狀態
- `pending` - 待付款
- `paid` - 已付款
- `shipped` - 已出貨
- `delivered` - 已送達
- `cancelled` - 已取消
- `refunded` - 已退款

## 🛠️ 快速開始

### 環境需求
- Node.js 18+
- MongoDB 4.4+
- npm 或 yarn

### 安裝依賴
```bash
npm install
```

### 環境變數設定
建立 `.env` 檔案：
```env
PORT=3003
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin
JWT_SECRET=order-service-secret-key
CORS_ORIGIN=http://localhost:3000
```

### 啟動服務
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### Docker 部署
```bash
# 建立映像檔
docker build -t order-service .

# 執行容器
docker run -p 3003:3003 order-service
```

## 🔐 認證說明

目前使用簡化版本的認證機制：
- 所有 API 端點都需要 `Authorization: Bearer <token>` 標頭
- 簡化版本會自動通過認證，無需實際的 JWT Token
- 後續會整合完整的 Auth Service

## 📊 測試

### API 測試範例

#### 建立訂單
```bash
curl -X POST "http://localhost:3003/api/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "name": "測試商品",
        "price": 1000,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "name": "張三",
      "phone": "0912345678",
      "city": "台北市",
      "district": "大安區",
      "address": "復興南路一段1號",
      "zipCode": "106"
    },
    "billingAddress": {
      "name": "張三",
      "phone": "0912345678",
      "city": "台北市",
      "district": "大安區",
      "address": "復興南路一段1號",
      "zipCode": "106"
    },
    "payment": {
      "method": "credit_card"
    },
    "shipping": {
      "method": "home_delivery",
      "shippingFee": 100
    }
  }'
```

#### 取得訂單列表
```bash
curl -X GET "http://localhost:3003/api/v1/orders" \
  -H "Authorization: Bearer test-token"
```

#### 更新訂單狀態
```bash
curl -X PUT "http://localhost:3003/api/v1/orders/{orderId}/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "status": "paid"
  }'
```

## 📈 監控與日誌

### 健康檢查
```bash
curl http://localhost:3003/health
```

### 日誌格式
服務使用 Morgan 記錄 HTTP 請求日誌，格式為 `combined`。

## 🔧 開發指南

### 專案結構
```
src/
├── models/          # 資料模型
├── controllers/     # 控制器
├── routes/          # 路由定義
├── middleware/      # 中間件
├── utils/           # 工具函數
├── app.js           # 主應用程式
└── swagger.js       # Swagger 配置
```

### 新增功能
1. 在 `models/` 中定義資料模型
2. 在 `controllers/` 中實作業務邏輯
3. 在 `routes/` 中定義 API 路由
4. 更新 Swagger 文檔

### 程式碼風格
- 使用 ES6+ 語法
- 遵循 RESTful API 設計原則
- 統一的錯誤處理格式
- 完整的 JSDoc 註解

## 🤝 整合說明

### 與其他服務的整合
- **User Service**: 取得用戶資訊
- **Product Service**: 取得商品資訊
- **Dashboard Service**: 提供訂單統計資料

### 事件驅動
後續會實作事件驅動架構：
- 訂單狀態變更事件
- 付款完成事件
- 出貨通知事件

## 📝 更新日誌

### v1.0.0 (2024-01-XX)
- ✅ 基礎訂單 CRUD 功能
- ✅ 訂單狀態管理
- ✅ 退款處理邏輯
- ✅ 統計分析功能
- ✅ API 文檔
- ✅ Docker 支援

## 📞 支援

如有問題或建議，請聯繫開發團隊：
- Email: support@ecommerce.com
- 專案 Issues: [GitHub Issues](https://github.com/ecommerce/order-service/issues)
