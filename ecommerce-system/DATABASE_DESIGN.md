# 🗄️ 電商系統資料庫設計文檔

## 📋 概述

本文件定義電商系統的所有資料庫集合/表格結構，包含用戶、商品、訂單、分析等相關資料。

## ⚠️ 重要架構問題

**當前問題**: 所有服務都使用 MongoDB，這是不合理的架構！

**正確的數據庫架構應該是**:

### 🐘 PostgreSQL (關係型數據庫) - 適合結構化數據
- ✅ **User Service** (用戶、認證、個人資料)
- ✅ **Order Service** (訂單、支付、交易記錄)
- ✅ **Permission Service** (權限、角色、用戶角色)
- ✅ **Auth Service** (認證、授權、JWT 管理)
- ✅ **Settings Service** (系統設定、配置)

### 🍃 MongoDB (文檔數據庫) - 適合非結構化數據
- ✅ **Product Service** (商品信息、分類、庫存)
- ✅ **Analytics Service** (分析數據、日誌、統計)
- ✅ **MinIO Service** (文件元數據、媒體信息)

## 🏗️ 當前資料庫架構 (需要修正)

```
電商系統資料庫架構
├── 📊 用戶相關 (users, roles, permissions) - 應該用 PostgreSQL
├── 📦 商品相關 (products, categories, inventory) - 適合 MongoDB
├── 📋 訂單相關 (orders, order_items, payments) - 應該用 PostgreSQL
├── 📊 分析相關 (analytics, logs, notifications) - 適合 MongoDB
└── ⚙️ 系統相關 (settings, backups, files) - 應該用 PostgreSQL
```

## 👥 1. 用戶相關集合

### 1.1 users (用戶)
```javascript
{
  _id: ObjectId,
  email: String,           // 必填，唯一
  password: String,        // 必填，加密
  name: String,           // 必填
  phone: String,          // 可選
  avatar: String,         // 頭像 URL
  role: String,           // user, vip, admin
  status: String,         // active, inactive, banned
  permissions: [String],   // 權限列表
  profile: {
    birthday: Date,
    gender: String,        // male, female, other
    address: {
      country: String,
      city: String,
      district: String,
      address: String,
      zipCode: String
    }
  },
  preferences: {
    language: String,     // zh-TW, en-US
    currency: String,      // TWD, USD
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    }
  },
  statistics: {
    totalOrders: Number,
    totalSpent: Number,
    lastLoginAt: Date,
    loginCount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 1.2 roles (角色)
```javascript
{
  _id: ObjectId,
  name: String,           // 必填，唯一
  description: String,    // 可選
  permissions: [String],  // 權限列表
  isDefault: Boolean,     // 是否為預設角色
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3 permissions (權限)
```javascript
{
  _id: ObjectId,
  code: String,           // 必填，唯一，如 users:read
  name: String,           // 顯示名稱
  description: String,    // 描述
  module: String,         // 模組名稱
  createdAt: Date
}
```

## 📦 2. 商品相關集合

### 2.1 products (商品)
```javascript
{
  _id: ObjectId,
  name: String,           // 必填
  description: String,    // 必填
  price: Number,          // 必填，價格
  originalPrice: Number,  // 原價
  categoryId: ObjectId,   // 必填，分類 ID
  brand: String,          // 品牌
  sku: String,            // SKU 編號
  stock: Number,          // 庫存數量
  status: String,         // active, inactive, sold_out
  attributes: {
    color: String,
    size: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  images: [String],       // 圖片 URL 列表
  tags: [String],         // 標籤
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  statistics: {
    views: Number,
    sales: Number,
    rating: Number,
    reviewCount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 categories (分類)
```javascript
{
  _id: ObjectId,
  name: String,           // 必填
  description: String,    // 可選
  parentId: ObjectId,     // 父分類 ID
  level: Number,          // 分類層級
  sortOrder: Number,      // 排序
  image: String,          // 分類圖片
  status: String,         // active, inactive
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 inventory (庫存)
```javascript
{
  _id: ObjectId,
  productId: ObjectId,    // 商品 ID
  variantId: ObjectId,    // 變體 ID (可選)
  warehouseId: ObjectId,  // 倉庫 ID
  quantity: Number,       // 數量
  reserved: Number,       // 預留數量
  available: Number,      // 可用數量
  lowStockThreshold: Number, // 低庫存警告閾值
  lastUpdated: Date
}
```

## 📋 3. 訂單相關集合

### 3.1 orders (訂單)
```javascript
{
  _id: ObjectId,
  orderNumber: String,    // 訂單編號，唯一
  userId: ObjectId,       // 用戶 ID
  status: String,         // pending, paid, shipped, delivered, cancelled, refunded
  total: Number,          // 總金額
  subtotal: Number,       // 小計
  tax: Number,            // 稅金
  shipping: Number,       // 運費
  discount: Number,       // 折扣
  currency: String,       // 貨幣
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    total: Number
  }],
  shippingAddress: {
    name: String,
    phone: String,
    country: String,
    city: String,
    district: String,
    address: String,
    zipCode: String
  },
  billingAddress: {
    name: String,
    phone: String,
    country: String,
    city: String,
    district: String,
    address: String,
    zipCode: String
  },
  payment: {
    method: String,       // credit_card, bank_transfer, cash_on_delivery
    status: String,       // pending, paid, failed
    transactionId: String,
    paidAt: Date
  },
  shipping: {
    method: String,       // home_delivery, convenience_store
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  notes: String,          // 訂單備註
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 order_items (訂單項目)
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,      // 訂單 ID
  productId: ObjectId,    // 商品 ID
  name: String,           // 商品名稱
  price: Number,          // 單價
  quantity: Number,       // 數量
  total: Number,          // 小計
  attributes: Object,     // 商品屬性
  createdAt: Date
}
```

### 3.3 payments (付款)
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,      // 訂單 ID
  amount: Number,         // 付款金額
  method: String,         // 付款方式
  status: String,         // pending, success, failed, refunded
  transactionId: String,  // 交易 ID
  gateway: String,        // 付款閘道
  gatewayResponse: Object, // 閘道回應
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 📊 4. 分析相關集合

### 4.1 analytics (分析資料)
```javascript
{
  _id: ObjectId,
  type: String,           // sales, users, products, inventory
  period: String,         // daily, weekly, monthly, yearly
  date: Date,            // 日期
  data: Object,          // 分析資料
  createdAt: Date
}
```

### 4.2 user_analytics (用戶分析)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // 用戶 ID
  date: Date,            // 日期
  actions: [{
    type: String,         // login, view_product, add_to_cart, purchase
    timestamp: Date,
    data: Object          // 相關資料
  }],
  statistics: {
    pageViews: Number,
    sessionDuration: Number,
    productsViewed: Number,
    ordersPlaced: Number
  },
  createdAt: Date
}
```

### 4.3 product_analytics (商品分析)
```javascript
{
  _id: ObjectId,
  productId: ObjectId,    // 商品 ID
  date: Date,            // 日期
  views: Number,         // 瀏覽次數
  sales: Number,         // 銷售數量
  revenue: Number,       // 營收
  conversionRate: Number, // 轉換率
  createdAt: Date
}
```

## 📝 5. 日誌相關集合

### 5.1 system_logs (系統日誌)
```javascript
{
  _id: ObjectId,
  level: String,          // info, warning, error, debug
  message: String,        // 日誌訊息
  module: String,         // 模組名稱
  userId: ObjectId,       // 用戶 ID (可選)
  ip: String,            // IP 位址
  userAgent: String,     // 用戶代理
  data: Object,          // 相關資料
  createdAt: Date
}
```

### 5.2 user_actions (用戶操作)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // 用戶 ID
  action: String,         // 操作類型
  resource: String,      // 資源類型
  resourceId: ObjectId,   // 資源 ID
  details: Object,       // 操作詳情
  ip: String,            // IP 位址
  userAgent: String,     // 用戶代理
  createdAt: Date
}
```

### 5.3 api_access (API 存取)
```javascript
{
  _id: ObjectId,
  endpoint: String,       // API 端點
  method: String,         // HTTP 方法
  userId: ObjectId,       // 用戶 ID
  statusCode: Number,     // 狀態碼
  responseTime: Number,   // 回應時間 (ms)
  ip: String,            // IP 位址
  userAgent: String,     // 用戶代理
  requestBody: Object,   // 請求內容
  responseBody: Object,  // 回應內容
  createdAt: Date
}
```

## 🔔 6. 通知相關集合

### 6.1 notifications (通知)
```javascript
{
  _id: ObjectId,
  type: String,           // system, order, user, product
  title: String,          // 標題
  message: String,        // 內容
  recipients: [ObjectId], // 收件人
  readBy: [ObjectId],    // 已讀用戶
  priority: String,       // low, normal, high, urgent
  data: Object,          // 相關資料
  expiresAt: Date,       // 過期時間
  createdAt: Date
}
```

## ⚙️ 7. 系統相關集合

### 7.1 settings (系統設定)
```javascript
{
  _id: ObjectId,
  key: String,           // 設定鍵，唯一
  value: Object,         // 設定值
  type: String,          // string, number, boolean, object, array
  description: String,   // 描述
  category: String,      // site, payment, shipping, email
  isPublic: Boolean,    // 是否公開
  createdAt: Date,
  updatedAt: Date
}
```

### 7.2 files (檔案)
```javascript
{
  _id: ObjectId,
  filename: String,       // 檔案名稱
  originalName: String,   // 原始檔案名稱
  mimeType: String,       // MIME 類型
  size: Number,          // 檔案大小
  path: String,          // 檔案路徑
  url: String,           // 檔案 URL
  uploadedBy: ObjectId,  // 上傳者
  category: String,      // image, document, video
  metadata: Object,      // 檔案元資料
  createdAt: Date
}
```

### 7.3 backups (備份)
```javascript
{
  _id: ObjectId,
  name: String,          // 備份名稱
  type: String,          // full, incremental
  size: Number,          // 備份大小
  path: String,          // 備份路徑
  status: String,        // creating, completed, failed
  createdBy: ObjectId,   // 建立者
  createdAt: Date,
  completedAt: Date
}
```

## 🔍 8. 搜尋相關集合

### 8.1 search_index (搜尋索引)
```javascript
{
  _id: ObjectId,
  type: String,           // product, user, order
  entityId: ObjectId,     // 實體 ID
  content: String,        // 搜尋內容
  keywords: [String],     // 關鍵字
  metadata: Object,       // 元資料
  createdAt: Date,
  updatedAt: Date
}
```

### 8.2 recommendations (推薦)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // 用戶 ID
  type: String,           // product, category
  items: [{
    itemId: ObjectId,     // 推薦項目 ID
    score: Number,        // 推薦分數
    reason: String        // 推薦原因
  }],
  algorithm: String,      // 演算法
  createdAt: Date,
  expiresAt: Date
}
```

## 📊 9. 索引設計

### 9.1 用戶相關索引
```javascript
// users 集合
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "status": 1 })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "createdAt": -1 })

// roles 集合
db.roles.createIndex({ "name": 1 }, { unique: true })

// permissions 集合
db.permissions.createIndex({ "code": 1 }, { unique: true })
db.permissions.createIndex({ "module": 1 })
```

### 9.2 商品相關索引
```javascript
// products 集合
db.products.createIndex({ "name": "text", "description": "text" })
db.products.createIndex({ "categoryId": 1 })
db.products.createIndex({ "status": 1 })
db.products.createIndex({ "price": 1 })
db.products.createIndex({ "createdAt": -1 })

// categories 集合
db.categories.createIndex({ "parentId": 1 })
db.categories.createIndex({ "level": 1 })
db.categories.createIndex({ "status": 1 })

// inventory 集合
db.inventory.createIndex({ "productId": 1 })
db.inventory.createIndex({ "warehouseId": 1 })
db.inventory.createIndex({ "available": 1 })
```

### 9.3 訂單相關索引
```javascript
// orders 集合
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "createdAt": -1 })
db.orders.createIndex({ "payment.status": 1 })

// order_items 集合
db.order_items.createIndex({ "orderId": 1 })
db.order_items.createIndex({ "productId": 1 })

// payments 集合
db.payments.createIndex({ "orderId": 1 })
db.payments.createIndex({ "status": 1 })
db.payments.createIndex({ "createdAt": -1 })
```

### 9.4 分析相關索引
```javascript
// analytics 集合
db.analytics.createIndex({ "type": 1, "period": 1, "date": 1 })

// user_analytics 集合
db.user_analytics.createIndex({ "userId": 1, "date": 1 })

// product_analytics 集合
db.product_analytics.createIndex({ "productId": 1, "date": 1 })
```

### 9.5 日誌相關索引
```javascript
// system_logs 集合
db.system_logs.createIndex({ "level": 1 })
db.system_logs.createIndex({ "createdAt": -1 })
db.system_logs.createIndex({ "module": 1 })

// user_actions 集合
db.user_actions.createIndex({ "userId": 1 })
db.user_actions.createIndex({ "action": 1 })
db.user_actions.createIndex({ "createdAt": -1 })

// api_access 集合
db.api_access.createIndex({ "endpoint": 1 })
db.api_access.createIndex({ "userId": 1 })
db.api_access.createIndex({ "createdAt": -1 })
```

## 🚀 10. 資料庫配置

### 10.1 MongoDB 配置
```javascript
// 啟用文字搜尋
db.adminCommand({
  setParameter: 1,
  textSearchEnabled: true
})

// 設定 WiredTiger 快取大小
db.adminCommand({
  setParameter: 1,
  wiredTigerConcurrentReadTransactions: 128,
  wiredTigerConcurrentWriteTransactions: 128
})
```

### 10.2 連線池設定
```javascript
// 連線字串範例
mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin&maxPoolSize=10&minPoolSize=5&maxIdleTimeMS=30000
```

### 10.3 備份策略
```bash
# 每日完整備份
mongodump --uri="mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin" --out=/backup/daily/$(date +%Y%m%d)

# 每小時增量備份
mongodump --uri="mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin" --out=/backup/hourly/$(date +%Y%m%d_%H)
```

---

## 🔧 架構修正計劃

### 階段 1: 添加 PostgreSQL 服務
- [ ] 在 docker-compose.yml 中添加 PostgreSQL 服務
- [ ] 配置 PostgreSQL 環境變數
- [ ] 創建數據庫初始化腳本

### 階段 2: 遷移服務到 PostgreSQL
- [ ] **User Service**: Mongoose → Sequelize/TypeORM
- [ ] **Order Service**: Mongoose → Sequelize/TypeORM  
- [ ] **Permission Service**: Mongoose → Sequelize/TypeORM
- [ ] **Auth Service**: Mongoose → Sequelize/TypeORM
- [ ] **Settings Service**: Mongoose → Sequelize/TypeORM

### 階段 3: 保留 MongoDB 服務
- [ ] **Product Service**: 繼續使用 MongoDB (適合商品數據)
- [ ] **Analytics Service**: 繼續使用 MongoDB (適合分析數據)
- [ ] **MinIO Service**: 繼續使用 MongoDB (適合文件元數據)

### 階段 4: 數據遷移
- [ ] 創建數據遷移腳本
- [ ] 備份現有數據
- [ ] 執行數據遷移
- [ ] 驗證數據完整性

### 階段 5: 測試與驗證
- [ ] 更新 API 測試
- [ ] 更新前端集成測試
- [ ] 性能測試
- [ ] 數據一致性驗證

### 📝 修正理由
1. **數據一致性**: PostgreSQL 的 ACID 特性更適合交易數據
2. **查詢性能**: 關係型查詢在用戶、訂單、權限方面更高效
3. **數據完整性**: 外鍵約束確保數據關係正確
4. **擴展性**: PostgreSQL 在複雜查詢和報表方面更強
5. **標準化**: 符合企業級應用的數據庫選擇標準

### ⚠️ 注意事項
- 數據遷移期間需要停機維護
- 需要更新所有相關的 API 文檔
- 前端可能需要調整數據格式
- 需要重新設計數據備份策略

---

*最後更新: 2025-09-06 (添加架構修正計劃)*
