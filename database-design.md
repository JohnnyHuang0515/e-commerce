# 電商系統資料庫架構設計文件

## 1. 整體架構概述

本電商系統採用多資料庫架構，根據不同資料特性選擇最適合的儲存方案：

### 資料庫分工

| 資料庫 | 用途 | 資料類型 |
|--------|------|----------|
| **PostgreSQL** | 交易型資料 | Users, Orders, Payments, Shipments, Products |
| **MongoDB** | 半結構化資料 | 商品描述、前端 JSON、日誌、客服紀錄 |
| **MinIO** | 物件儲存 | 商品圖片、影片、退貨證明、發票 PDF |
| **Redis** | 快取與 Session 管理 | 熱門商品、購物車、JWT Token |
| **Milvus** | 向量資料庫 | AI 推薦、相似商品檢索、個人化搜尋 |
| **ClickHouse** | 數據倉儲與分析 | 用戶行為、銷售報表、行銷數據 |

## 2. PostgreSQL 交易型資料庫設計（核心交易用）

### 設計原則
PostgreSQL 只儲存交易必須的核心欄位，用於：
- 下單 / 扣庫存
- 訂單明細關聯
- 報表、統計

### 2.1 User Domain（用戶領域）

#### Users 表
```sql
CREATE TABLE Users (
    user_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_status ON Users(status);
```

#### User_Address 表
```sql
CREATE TABLE User_Address (
    address_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    recipient_name VARCHAR(100) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_address_user_id ON User_Address(user_id);
CREATE INDEX idx_user_address_default ON User_Address(user_id, is_default);
```

### 2.2 Product Domain（商品領域）

#### Categories 表
```sql
CREATE TABLE Categories (
    category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES Categories(category_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON Categories(parent_id);
```

#### Products 表（核心交易欄位）
```sql
CREATE TABLE Products (
    product_id BIGSERIAL PRIMARY KEY,       -- 主鍵，交易系統唯一ID
    name VARCHAR(255) NOT NULL,             -- 商品名稱
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0), -- 售價
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- 庫存數量
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')), -- 狀態
    category_id BIGINT NOT NULL REFERENCES Categories(category_id), -- 類別
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON Products(category_id);
CREATE INDEX idx_products_status ON Products(status);
CREATE INDEX idx_products_price ON Products(price);
CREATE INDEX idx_products_stock ON Products(stock_quantity);
CREATE INDEX idx_products_name ON Products(name);
```

### 2.3 Order Domain（訂單領域）

#### Cart 表
```sql
CREATE TABLE Cart (
    cart_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_user_id ON Cart(user_id);
```

#### Cart_Items 表
```sql
CREATE TABLE Cart_Items (
    cart_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cart_id BIGINT NOT NULL REFERENCES Cart(cart_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart_id ON Cart_Items(cart_id);
CREATE INDEX idx_cart_items_product_id ON Cart_Items(product_id);
```

#### Orders 表
```sql
CREATE TABLE Orders (
    order_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'paid', 'shipped', 'delivered', 'canceled')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON Orders(user_id);
CREATE INDEX idx_orders_status ON Orders(order_status);
CREATE INDEX idx_orders_created_at ON Orders(created_at);
```

#### Order_Items 表
```sql
CREATE TABLE Order_Items (
    order_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL, -- 下單時商品名稱（快照）
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0), -- 下單時商品價格（快照）
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order_id ON Order_Items(order_id);
CREATE INDEX idx_order_items_product_id ON Order_Items(product_id);
```

### 2.4 Payment Domain（支付領域）

#### Payments 表
```sql
CREATE TABLE Payments (
    payment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON Payments(order_id);
CREATE INDEX idx_payments_status ON Payments(payment_status);
```

### 2.5 Logistics Domain（物流領域）

#### Shipments 表
```sql
CREATE TABLE Shipments (
    shipment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_order_id ON Shipments(order_id);
CREATE INDEX idx_shipments_tracking ON Shipments(tracking_number);
```

### 2.6 Marketing Domain（行銷領域）

#### Coupons 表
```sql
CREATE TABLE Coupons (
    coupon_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON Coupons(code);
CREATE INDEX idx_coupons_valid_period ON Coupons(valid_from, valid_to);
```

#### Reviews 表
```sql
CREATE TABLE Reviews (
    review_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id) -- 每個用戶對同一商品只能評論一次
);

CREATE INDEX idx_reviews_product_id ON Reviews(product_id);
CREATE INDEX idx_reviews_user_id ON Reviews(user_id);
CREATE INDEX idx_reviews_rating ON Reviews(rating);
```

#### Wishlist 表
```sql
CREATE TABLE Wishlist (
    wishlist_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wishlist_user_id ON Wishlist(user_id);
```

#### Wishlist_Items 表
```sql
CREATE TABLE Wishlist_Items (
    wishlist_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    wishlist_id BIGINT NOT NULL REFERENCES Wishlist(wishlist_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id, product_id) -- 避免重複加入
);

CREATE INDEX idx_wishlist_items_wishlist_id ON Wishlist_Items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON Wishlist_Items(product_id);
```

### 2.7 Return Domain（退貨領域）

#### Return_Requests 表
```sql
CREATE TABLE Return_Requests (
    return_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'received', 'refunded', 'completed')),
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_return_requests_order_id ON Return_Requests(order_id);
CREATE INDEX idx_return_requests_user_id ON Return_Requests(user_id);
CREATE INDEX idx_return_requests_status ON Return_Requests(status);
```

#### Return_Items 表
```sql
CREATE TABLE Return_Items (
    return_item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    return_id BIGINT NOT NULL REFERENCES Return_Requests(return_id) ON DELETE CASCADE,
    order_item_id BIGINT NOT NULL REFERENCES Order_Items(order_item_id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount >= 0)
);

CREATE INDEX idx_return_items_return_id ON Return_Items(return_id);
CREATE INDEX idx_return_items_order_item_id ON Return_Items(order_item_id);
```

#### Refunds 表
```sql
CREATE TABLE Refunds (
    refund_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    return_id BIGINT NOT NULL REFERENCES Return_Requests(return_id) ON DELETE RESTRICT,
    payment_id BIGINT NOT NULL REFERENCES Payments(payment_id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    refund_status VARCHAR(20) DEFAULT 'pending' CHECK (refund_status IN ('pending', 'success', 'failed')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refunds_return_id ON Refunds(return_id);
CREATE INDEX idx_refunds_payment_id ON Refunds(payment_id);
CREATE INDEX idx_refunds_status ON Refunds(refund_status);
```

## 3. AI 相關資料表設計

### 3.1 行為數據 (User Events / Logs)

#### User_Events 表
```sql
CREATE TABLE User_Events (
    event_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES Users(user_id) ON DELETE SET NULL,
    product_id BIGINT REFERENCES Products(product_id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'add_to_cart', 'purchase', 'search', 'remove_from_cart', 'wishlist_add', 'review')),
    metadata JSONB, -- 其他資訊（如瀏覽時間、來源頁、搜尋關鍵字等）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_events_user_id ON User_Events(user_id);
CREATE INDEX idx_user_events_product_id ON User_Events(product_id);
CREATE INDEX idx_user_events_type ON User_Events(event_type);
CREATE INDEX idx_user_events_created_at ON User_Events(created_at);
CREATE INDEX idx_user_events_metadata ON User_Events USING GIN(metadata);
```

### 3.2 特徵數據 (Features Store)

#### User_Features 表
```sql
CREATE TABLE User_Features (
    user_id BIGINT PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    age_group VARCHAR(20), -- 年齡層
    gender VARCHAR(10), -- 性別
    avg_order_value DECIMAL(10,2) DEFAULT 0, -- 平均消費金額
    purchase_frequency FLOAT DEFAULT 0, -- 購買頻率（次/月）
    last_active_at TIMESTAMP, -- 最近活躍時間
    embedding_vector JSONB, -- 使用者向量（JSON 格式儲存）
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_features_age_group ON User_Features(age_group);
CREATE INDEX idx_user_features_gender ON User_Features(gender);
CREATE INDEX idx_user_features_avg_order ON User_Features(avg_order_value);
CREATE INDEX idx_user_features_frequency ON User_Features(purchase_frequency);
```

#### Product_Features 表
```sql
CREATE TABLE Product_Features (
    product_id BIGINT PRIMARY KEY REFERENCES Products(product_id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES Categories(category_id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    popularity_score FLOAT DEFAULT 0, -- 熱門分數
    embedding_vector JSONB, -- 商品向量（JSON 格式儲存）
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_features_category ON Product_Features(category_id);
CREATE INDEX idx_product_features_price ON Product_Features(price);
CREATE INDEX idx_product_features_popularity ON Product_Features(popularity_score);
```

### 3.3 AI 結果數據 (Recommendations / Predictions)

#### Recommendations 表
```sql
CREATE TABLE Recommendations (
    rec_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1), -- 推薦分數
    model_version VARCHAR(50) NOT NULL, -- 使用的模型版本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_user_id ON Recommendations(user_id);
CREATE INDEX idx_recommendations_product_id ON Recommendations(product_id);
CREATE INDEX idx_recommendations_score ON Recommendations(score);
CREATE INDEX idx_recommendations_model ON Recommendations(model_version);
CREATE INDEX idx_recommendations_created_at ON Recommendations(created_at);
```

#### Predictions 表
```sql
CREATE TABLE Predictions (
    pred_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('churn', 'LTV', 'demand', 'price_sensitivity')),
    value FLOAT NOT NULL, -- 預測結果
    model_version VARCHAR(50) NOT NULL, -- 模型版本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_user_id ON Predictions(user_id);
CREATE INDEX idx_predictions_type ON Predictions(prediction_type);
CREATE INDEX idx_predictions_model ON Predictions(model_version);
CREATE INDEX idx_predictions_created_at ON Predictions(created_at);
```

## 4. MongoDB 半結構化資料設計（商品詳情用）

### 設計原則
MongoDB 存放商品詳細資訊，包含：
- 完整描述（長字串）
- 多規格 JSON
- 圖片、SEO、評論

### 4.1 商品詳細描述集合
```javascript
// MongoDB: products_detail 集合
{
  "_id": ObjectId("..."),              // MongoDB 主鍵
  "product_pg_id": 12345,              // 對應 PostgreSQL product_id
  "name": "高階藍牙耳機",
  "description": "支援降噪、長效電池 ...",
  "specs": {                           // 規格 JSON
    "color": ["黑", "白"],
    "battery_life": "20h",
    "bluetooth": "5.3",
    "brand": "Sony",
    "model": "WH-1000XM5",
    "dimensions": {
      "length": 25.5,
      "width": 20.5,
      "height": 8.5,
      "weight": 250
    },
    "materials": ["塑膠", "金屬"],
    "sizes": ["標準"]
  },
  "images": [
    "https://cdn.example.com/p/12345/img1.jpg",
    "https://cdn.example.com/p/12345/img2.jpg"
  ],
  "features": ["降噪", "長效電池", "快速充電"],
  "care_instructions": "請避免潮濕環境...",
  "warranty_info": "2年保固",
  "seo": {
    "title": "最佳藍牙耳機",
    "keywords": ["耳機", "降噪", "音樂"]
  },
  "reviews": [],                       // 用戶評論
  "created_at": ISODate("2025-09-16T10:00:00Z"),
  "updated_at": ISODate("2025-09-16T10:00:00Z")
}
```

### 4.2 前端配置集合
```javascript
// frontend_configs 集合
{
  _id: ObjectId,
  config_type: String, // 'homepage', 'category_page', 'product_page', 'checkout'
  config_data: {
    layout: Object,
    components: [Object],
    styles: Object,
    behaviors: Object
  },
  version: String,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### 4.3 系統日誌集合
```javascript
// system_logs 集合
{
  _id: ObjectId,
  level: String, // 'info', 'warn', 'error', 'debug'
  service: String, // 'auth', 'payment', 'inventory', 'recommendation'
  message: String,
  context: {
    user_id: Number,
    session_id: String,
    request_id: String,
    ip_address: String,
    user_agent: String
  },
  data: Object, // 額外的結構化資料
  timestamp: Date
}
```

### 4.4 客服紀錄集合
```javascript
// customer_service_records 集合
{
  _id: ObjectId,
  ticket_id: String,
  user_id: Number,
  agent_id: Number,
  category: String, // 'order_inquiry', 'product_question', 'complaint', 'return_request'
  priority: String, // 'low', 'medium', 'high', 'urgent'
  status: String, // 'open', 'in_progress', 'resolved', 'closed'
  messages: [{
    sender: String, // 'user', 'agent', 'system'
    content: String,
    timestamp: Date,
    attachments: [String] // 檔案 URL
  }],
  resolution: String,
  satisfaction_rating: Number, // 1-5
  created_at: Date,
  updated_at: Date,
  closed_at: Date
}
```

## 5. Redis 快取設計

### 5.1 Session 管理
```
Key Pattern: session:{session_id}
Value: {
  user_id: 123,
  login_time: "2024-01-01T10:00:00Z",
  last_activity: "2024-01-01T10:30:00Z",
  permissions: ["read", "write"],
  cart_items: [{"product_id": 1, "quantity": 2}]
}
TTL: 24 hours
```

### 5.2 JWT Token 管理
```
Key Pattern: jwt:{token_hash}
Value: {
  user_id: 123,
  issued_at: "2024-01-01T10:00:00Z",
  expires_at: "2024-01-01T11:00:00Z",
  blacklisted: false
}
TTL: 1 hour
```

### 5.3 購物車快取
```
Key Pattern: cart:{user_id}
Value: {
  items: [
    {
      product_id: 1,
      product_name: "商品名稱",
      price: 100.00,
      quantity: 2,
      subtotal: 200.00
    }
  ],
  total_amount: 200.00,
  updated_at: "2024-01-01T10:00:00Z"
}
TTL: 7 days
```

### 5.4 熱門商品快取
```
Key Pattern: popular_products:{category_id}:{time_range}
Value: [
  {
    product_id: 1,
    name: "商品名稱",
    price: 100.00,
    sales_count: 150,
    view_count: 2000
  }
]
TTL: 1 hour
```

### 5.5 商品庫存快取
```
Key Pattern: stock:{product_id}
Value: {
  available_quantity: 50,
  reserved_quantity: 10,
  last_updated: "2024-01-01T10:00:00Z"
}
TTL: 5 minutes
```

## 6. MinIO 物件儲存設計

### 6.1 目錄結構
```
ecommerce-storage/
├── products/
│   ├── {product_id}/
│   │   ├── main/          # 主圖
│   │   ├── gallery/       # 商品圖庫
│   │   ├── thumbnails/     # 縮圖
│   │   └── videos/        # 商品影片
├── users/
│   ├── {user_id}/
│   │   ├── avatars/       # 用戶頭像
│   │   └── documents/     # 身份證明文件
├── orders/
│   ├── {order_id}/
│   │   ├── invoices/      # 發票 PDF
│   │   └── receipts/      # 收據
├── returns/
│   ├── {return_id}/
│   │   ├── proof_images/  # 退貨證明圖片
│   │   └── damage_photos/ # 損壞照片
└── system/
    ├── logos/             # 系統 Logo
    ├── banners/           # 橫幅圖片
    └── documents/         # 系統文件
```

### 6.2 檔案命名規範
- 商品圖片: `{product_id}_{image_type}_{timestamp}.{ext}`
- 用戶頭像: `{user_id}_avatar_{timestamp}.{ext}`
- 發票: `{order_id}_invoice_{timestamp}.pdf`
- 退貨證明: `{return_id}_proof_{timestamp}.{ext}`

## 7. Milvus 向量資料庫設計

### 7.1 商品向量集合
```python
# 商品向量 schema
{
    "collection_name": "product_vectors",
    "description": "商品特徵向量集合",
    "fields": [
        {
            "name": "product_id",
            "type": DataType.INT64,
            "is_primary_key": True
        },
        {
            "name": "embedding",
            "type": DataType.FLOAT_VECTOR,
            "dim": 512  # 向量維度
        },
        {
            "name": "category_id",
            "type": DataType.INT64
        },
        {
            "name": "price_range",
            "type": DataType.INT64  # 價格區間編碼
        }
    ]
}
```

### 7.2 用戶向量集合
```python
# 用戶向量 schema
{
    "collection_name": "user_vectors",
    "description": "用戶行為特徵向量集合",
    "fields": [
        {
            "name": "user_id",
            "type": DataType.INT64,
            "is_primary_key": True
        },
        {
            "name": "embedding",
            "type": DataType.FLOAT_VECTOR,
            "dim": 256  # 向量維度
        },
        {
            "name": "age_group",
            "type": DataType.INT64
        },
        {
            "name": "preference_category",
            "type": DataType.INT64
        }
    ]
}
```

## 8. ClickHouse 數據倉儲設計

### 8.1 用戶行為事件表
```sql
CREATE TABLE user_behavior_events (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    session_id String,
    event_type String,
    product_id Nullable(UInt64),
    category_id Nullable(UInt64),
    page_url String,
    referrer String,
    device_type String,
    browser String,
    os String,
    country String,
    city String,
    duration UInt32, -- 停留時間（秒）
    metadata String -- JSON 格式的額外資料
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_time, user_id);
```

### 8.2 銷售數據表
```sql
CREATE TABLE sales_data (
    order_date Date,
    order_time DateTime,
    order_id UInt64,
    user_id UInt64,
    product_id UInt64,
    category_id UInt64,
    quantity UInt32,
    unit_price Decimal(10,2),
    total_amount Decimal(10,2),
    discount_amount Decimal(10,2),
    payment_method String,
    shipping_method String,
    country String,
    city String,
    age_group String,
    gender String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, order_time, order_id);
```

### 8.3 商品表現數據表
```sql
CREATE TABLE product_performance (
    date Date,
    product_id UInt64,
    category_id UInt64,
    views UInt32,
    clicks UInt32,
    add_to_cart UInt32,
    purchases UInt32,
    revenue Decimal(12,2),
    conversion_rate Float32,
    avg_session_duration UInt32,
    bounce_rate Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, product_id);
```

## 9. 資料同步策略

### 9.1 PostgreSQL ↔ MongoDB 同步策略

#### 方法 A：應用層同步（簡單）
在商品建立 API 內：
1. 先寫入 MongoDB（商品詳細資訊）
2. 取回 ObjectId
3. 把必要欄位寫入 PostgreSQL.Products

```javascript
// 範例：商品建立流程
async function createProduct(productData) {
  // 1. 寫入 MongoDB
  const mongoResult = await mongoDb.collection('products_detail').insertOne({
    name: productData.name,
    description: productData.description,
    specs: productData.specs,
    images: productData.images,
    seo: productData.seo,
    created_at: new Date()
  });
  
  // 2. 寫入 PostgreSQL
  const pgResult = await pgClient.query(`
    INSERT INTO products (name, price, stock_quantity, status, category_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING product_id
  `, [productData.name, productData.price, productData.stock_quantity, 
      productData.status, productData.category_id]);
  
  // 3. 更新 MongoDB 關聯
  await mongoDb.collection('products_detail').updateOne(
    { _id: mongoResult.insertedId },
    { $set: { product_pg_id: pgResult.rows[0].product_id } }
  );
}
```

#### 方法 B：事件驅動（推薦）
1. 寫入 MongoDB → 發送 `product.created` 事件（Kafka / RabbitMQ）
2. Worker 消費事件 → 寫入 PostgreSQL.Products
3. 後續修改（更新價格、上下架） → 同步事件 `product.updated`

```javascript
// 事件驅動範例
async function createProductWithEvent(productData) {
  // 1. 寫入 MongoDB
  const mongoResult = await mongoDb.collection('products_detail').insertOne({
    name: productData.name,
    description: productData.description,
    specs: productData.specs,
    images: productData.images,
    seo: productData.seo,
    created_at: new Date()
  });
  
  // 2. 發送事件
  await eventBus.publish('product.created', {
    mongoId: mongoResult.insertedId,
    productData: {
      name: productData.name,
      price: productData.price,
      stock_quantity: productData.stock_quantity,
      status: productData.status,
      category_id: productData.category_id
    }
  });
}

// Worker 處理事件
eventBus.subscribe('product.created', async (event) => {
  const pgResult = await pgClient.query(`
    INSERT INTO products (name, price, stock_quantity, status, category_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING product_id
  `, [event.productData.name, event.productData.price, 
      event.productData.stock_quantity, event.productData.status, 
      event.productData.category_id]);
  
  // 更新 MongoDB 關聯
  await mongoDb.collection('products_detail').updateOne(
    { _id: event.mongoId },
    { $set: { product_pg_id: pgResult.rows[0].product_id } }
  );
});
```

### 9.2 讀取邏輯

#### 商品清單 / 下單頁
```sql
-- 只查 PostgreSQL，快速載入
SELECT product_id, name, price, stock_quantity, status, category_id
FROM products 
WHERE status = 'active' 
ORDER BY created_at DESC;
```

#### 商品詳情頁
```javascript
// PostgreSQL + MongoDB join
async function getProductDetail(productId) {
  // 1. 查詢 PostgreSQL 核心資料
  const pgResult = await pgClient.query(`
    SELECT product_id, name, price, stock_quantity, status, category_id
    FROM products 
    WHERE product_id = $1
  `, [productId]);
  
  if (pgResult.rows.length === 0) {
    throw new Error('Product not found');
  }
  
  // 2. 查詢 MongoDB 詳細資訊
  const mongoResult = await mongoDb.collection('products_detail').findOne({
    product_pg_id: productId
  });
  
  // 3. 合併資料
  return {
    ...pgResult.rows[0],
    ...mongoResult,
    product_pg_id: undefined // 移除內部關聯欄位
  };
}
```

#### AI 推薦 / 搜索
```javascript
// Milvus + PostgreSQL + MongoDB
async function getRecommendations(userId) {
  // 1. 從 Milvus 取得相似商品向量
  const vectorResults = await milvusClient.search({
    collection: 'product_vectors',
    vector: userVector,
    limit: 20
  });
  
  // 2. 從 PostgreSQL 取得商品核心資訊
  const productIds = vectorResults.map(r => r.product_id);
  const pgResults = await pgClient.query(`
    SELECT product_id, name, price, stock_quantity, status
    FROM products 
    WHERE product_id = ANY($1) AND status = 'active'
  `, [productIds]);
  
  // 3. 從 MongoDB 取得商品詳細資訊
  const mongoResults = await mongoDb.collection('products_detail').find({
    product_pg_id: { $in: productIds }
  }).toArray();
  
  // 4. 合併並排序
  return mergeProductData(pgResults.rows, mongoResults);
}
```

### 9.3 其他資料庫同步
- **PostgreSQL → Redis**：用戶 Session、購物車、熱門商品、庫存快取（即時同步）
- **PostgreSQL → Milvus**：商品向量、用戶向量（批次更新，每日）
- **PostgreSQL → ClickHouse**：用戶行為、銷售數據（即時同步）

## 10. 效能優化建議

### 10.1 PostgreSQL 優化（交易型）
- **索引策略**：針對交易查詢建立複合索引
  ```sql
  -- 商品查詢優化
  CREATE INDEX idx_products_category_status ON products(category_id, status);
  CREATE INDEX idx_products_price_range ON products(price) WHERE status = 'active';
  
  -- 訂單查詢優化
  CREATE INDEX idx_orders_user_status ON orders(user_id, order_status);
  CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
  ```
- **分區策略**：按時間分區大表（如 User_Events）
- **連線池**：使用 PgBouncer 管理連線
- **讀寫分離**：交易寫入主庫，查詢使用讀庫

### 10.2 MongoDB 優化（商品詳情）
- **索引策略**：針對商品查詢建立索引
  ```javascript
  // 商品詳情查詢索引
  db.products_detail.createIndex({ "product_pg_id": 1 });
  db.products_detail.createIndex({ "name": "text", "description": "text" });
  db.products_detail.createIndex({ "specs.brand": 1, "specs.color": 1 });
  ```
- **文檔設計**：避免過深的嵌套，使用適當的陣列大小
- **分片策略**：按 product_pg_id 進行分片

### 10.3 Redis 優化（快取層）
- **記憶體管理**：設定 maxmemory 和淘汰策略
- **資料結構選擇**：
  ```redis
  # 購物車使用 Hash
  HSET cart:123 product:1 2
  HSET cart:123 product:2 1
  
  # 熱門商品使用 Sorted Set
  ZADD popular_products:electronics 100 product:1
  ZADD popular_products:electronics 95 product:2
  ```
- **Cluster 模式**：水平擴展和故障轉移

### 10.4 Milvus 優化（向量搜尋）
- **索引選擇**：
  - IVF_FLAT：高精度，適合小規模
  - IVF_SQ8：平衡精度和記憶體
  - IVF_PQ：高壓縮比，適合大規模
- **參數調優**：
  ```python
  # 索引參數
  index_params = {
      "metric_type": "L2",
      "index_type": "IVF_SQ8",
      "params": {"nlist": 1024}
  }
  ```

### 10.5 ClickHouse 優化（分析型）
- **分區策略**：按日期分區
  ```sql
  PARTITION BY toYYYYMM(event_date)
  ```
- **物化視圖**：預聚合常用統計
  ```sql
  CREATE MATERIALIZED VIEW daily_sales_mv
  ENGINE = SummingMergeTree()
  AS SELECT
    toDate(order_date) as date,
    category_id,
    sum(quantity) as total_quantity,
    sum(total_amount) as total_revenue
  FROM sales_data
  GROUP BY date, category_id;
  ```

## 11. 監控與維護

### 11.1 資料庫監控指標

#### PostgreSQL（交易型）
- **效能指標**：QPS、平均查詢時間、慢查詢
- **資源指標**：CPU、記憶體、磁碟 I/O
- **業務指標**：訂單處理速度、庫存更新延遲

#### MongoDB（商品詳情）
- **效能指標**：讀寫 QPS、查詢延遲
- **資源指標**：記憶體使用、磁碟空間
- **業務指標**：商品詳情載入時間

#### Redis（快取）
- **效能指標**：命中率、延遲
- **資源指標**：記憶體使用率
- **業務指標**：購物車載入速度、熱門商品更新頻率

#### Milvus（向量搜尋）
- **效能指標**：搜尋延遲、QPS
- **資源指標**：GPU 使用率、記憶體
- **業務指標**：推薦準確率、搜尋相關性

#### ClickHouse（分析）
- **效能指標**：查詢執行時間、並發查詢數
- **資源指標**：CPU、記憶體、磁碟
- **業務指標**：報表生成時間、數據新鮮度

### 11.2 備份策略

#### PostgreSQL
```bash
# 每日全量備份
pg_dump -h localhost -U postgres ecommerce > backup_$(date +%Y%m%d).sql

# WAL 歸檔備份
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

#### MongoDB
```bash
# 每日備份
mongodump --host localhost:27017 --db ecommerce --out /backup/mongodb/$(date +%Y%m%d)
```

#### Redis
```bash
# RDB 快照備份
redis-cli BGSAVE
# 複製 RDB 檔案到備份位置
```

#### MinIO
```bash
# 跨區域複製設定
mc mirror --overwrite /local/bucket s3://backup-bucket/
```

### 11.3 災難恢復

#### 恢復優先級
1. **PostgreSQL**：最高優先級（交易資料）
2. **Redis**：高優先級（Session 和快取）
3. **MongoDB**：中優先級（商品詳情）
4. **Milvus**：中優先級（推薦系統）
5. **ClickHouse**：低優先級（分析資料）

#### 恢復流程
```bash
# 1. 恢復 PostgreSQL
psql -h localhost -U postgres ecommerce < backup_20240101.sql

# 2. 恢復 MongoDB
mongorestore --host localhost:27017 --db ecommerce /backup/mongodb/20240101/ecommerce

# 3. 恢復 Redis
redis-cli --rdb /backup/redis/dump.rdb

# 4. 驗證資料一致性
node scripts/verify-data-consistency.js
```

### 11.4 資料一致性檢查

#### PostgreSQL ↔ MongoDB 一致性
```javascript
// 檢查商品資料一致性
async function checkProductConsistency() {
  const pgProducts = await pgClient.query('SELECT product_id, name FROM products');
  const mongoProducts = await mongoDb.collection('products_detail').find({}).toArray();
  
  const inconsistencies = [];
  
  for (const pgProduct of pgProducts.rows) {
    const mongoProduct = mongoProducts.find(p => p.product_pg_id === pgProduct.product_id);
    
    if (!mongoProduct) {
      inconsistencies.push({
        type: 'missing_mongo',
        product_id: pgProduct.product_id,
        name: pgProduct.name
      });
    } else if (pgProduct.name !== mongoProduct.name) {
      inconsistencies.push({
        type: 'name_mismatch',
        product_id: pgProduct.product_id,
        pg_name: pgProduct.name,
        mongo_name: mongoProduct.name
      });
    }
  }
  
  return inconsistencies;
}
```

### 11.5 自動化維護

#### 定期任務
```bash
# 每日 2:00 執行備份
0 2 * * * /scripts/daily-backup.sh

# 每週日 3:00 執行資料一致性檢查
0 3 * * 0 /scripts/weekly-consistency-check.sh

# 每月 1 日 4:00 執行效能分析
0 4 1 * * /scripts/monthly-performance-analysis.sh
```

#### 監控告警
- **PostgreSQL**：慢查詢 > 1秒、連線數 > 80%
- **MongoDB**：查詢延遲 > 500ms、記憶體使用 > 85%
- **Redis**：命中率 < 90%、記憶體使用 > 90%
- **Milvus**：搜尋延遲 > 100ms、GPU 使用 > 95%
- **ClickHouse**：查詢失敗率 > 5%、磁碟使用 > 80%

---

## 12. RBAC 權限管理系統設計

### 12.1 電商 RBAC 架構概述

電商系統的權限管理需要支援多種角色和複雜的業務場景，包括：
- **顧客**：瀏覽商品、下單、退貨
- **賣家**：商品管理、訂單處理
- **物流**：配送狀態更新
- **管理員**：用戶管理、退款處理、角色分配
- **分析人員**：報表查詢、數據分析

### 12.2 PostgreSQL RBAC 表設計

#### 12.2.1 Roles（角色表）
```sql
CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 電商角色範例
INSERT INTO roles (role_name, description) VALUES
('admin', '系統管理員'),
('seller', '賣家'),
('customer', '顧客'),
('logistics', '物流人員'),
('analyst', '分析人員');
```

#### 12.2.2 Permissions（權限表）
```sql
CREATE TABLE permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource_type VARCHAR(50), -- 資源類型：product, order, user, report
    action_type VARCHAR(50),    -- 操作類型：create, read, update, delete
    created_at TIMESTAMP DEFAULT NOW()
);

-- 電商權限範例
INSERT INTO permissions (permission_name, description, resource_type, action_type) VALUES
-- 商品相關權限
('create_product', '建立商品', 'product', 'create'),
('read_product', '查看商品', 'product', 'read'),
('update_product', '更新商品', 'product', 'update'),
('delete_product', '刪除商品', 'product', 'delete'),

-- 訂單相關權限
('create_order', '建立訂單', 'order', 'create'),
('read_order', '查看訂單', 'order', 'read'),
('update_order', '更新訂單', 'order', 'update'),
('update_order_status', '更新訂單狀態', 'order', 'update'),
('delete_order', '刪除訂單', 'order', 'delete'),

-- 用戶相關權限
('manage_users', '管理用戶', 'user', 'manage'),
('assign_roles', '分配角色', 'user', 'assign'),

-- 退貨相關權限
('request_return', '申請退貨', 'return', 'create'),
('process_return', '處理退貨', 'return', 'update'),
('refund_orders', '退款處理', 'refund', 'process'),

-- 報表相關權限
('view_reports', '查看報表', 'report', 'read'),
('query_clickhouse', '查詢分析數據', 'analytics', 'read');
```

#### 12.2.3 Role_Permissions（角色權限關聯表）
```sql
CREATE TABLE role_permissions (
    role_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 角色權限分配
-- 顧客權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'customer' 
AND p.permission_name IN ('read_product', 'create_order', 'request_return');

-- 賣家權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'seller' 
AND p.permission_name IN ('create_product', 'update_product', 'read_order', 'update_order');

-- 物流權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'logistics' 
AND p.permission_name IN ('read_order', 'update_order_status');

-- 管理員權限（所有權限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'admin';

-- 分析人員權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'analyst' 
AND p.permission_name IN ('view_reports', 'query_clickhouse');
```

#### 12.2.4 User_Roles（用戶角色關聯表）
```sql
CREATE TABLE user_roles (
    user_role_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by BIGINT REFERENCES users(user_id), -- 分配者
    assigned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- 角色過期時間（可選）
    UNIQUE(user_id, role_id)
);

-- 建立索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active);
```

### 12.3 RBAC 電商案例實作

#### 12.3.1 角色權限對應表

| 角色 | 權限 | 說明 |
|------|------|------|
| **顧客 (Customer)** | | |
| | `read_product` | 瀏覽商品 |
| | `create_order` | 下單購買 |
| | `request_return` | 申請退貨 |
| **賣家 (Seller)** | | |
| | `create_product` | 建立商品 |
| | `update_product` | 更新商品 |
| | `read_order` | 查看訂單 |
| | `update_order` | 處理訂單 |
| **物流 (Logistics)** | | |
| | `read_order` | 查看訂單 |
| | `update_order_status` | 更新配送狀態 |
| **管理員 (Admin)** | | |
| | `manage_users` | 管理用戶 |
| | `refund_orders` | 退款處理 |
| | `assign_roles` | 分配角色 |
| | `*` | 所有權限 |
| **分析人員 (Analyst)** | | |
| | `view_reports` | 查看報表 |
| | `query_clickhouse` | 查詢分析數據 |

#### 12.3.2 權限檢查函數

```sql
-- 檢查用戶是否有特定權限
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id BIGINT,
    p_permission_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = p_user_id
        AND ur.is_active = TRUE
        AND p.permission_name = p_permission_name
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- 獲取用戶所有權限
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id BIGINT)
RETURNS TABLE(permission_name VARCHAR(100), description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.permission_name, p.description
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    JOIN role_permissions rp ON r.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE u.user_id = p_user_id
    AND ur.is_active = TRUE
    ORDER BY p.permission_name;
END;
$$ LANGUAGE plpgsql;
```

### 12.4 權限管理最佳實踐

#### 12.4.1 最小權限原則
- 用戶只獲得完成工作所需的最小權限
- 定期審查和撤銷不必要的權限
- 使用角色過期機制

#### 12.4.2 權限繼承
```sql
-- 支援角色繼承（可選）
CREATE TABLE role_hierarchy (
    parent_role_id BIGINT REFERENCES roles(role_id),
    child_role_id BIGINT REFERENCES roles(role_id),
    PRIMARY KEY (parent_role_id, child_role_id)
);

-- 範例：管理員角色包含賣家角色
INSERT INTO role_hierarchy VALUES (
    (SELECT role_id FROM roles WHERE role_name = 'admin'),
    (SELECT role_id FROM roles WHERE role_name = 'seller')
);
```

#### 12.4.3 動態權限
```sql
-- 支援條件式權限（基於業務規則）
CREATE TABLE conditional_permissions (
    permission_id BIGINT REFERENCES permissions(permission_id),
    condition_type VARCHAR(50), -- 'time_based', 'location_based', 'amount_based'
    condition_value TEXT,        -- JSON 格式的條件
    created_at TIMESTAMP DEFAULT NOW()
);

-- 範例：賣家只能在營業時間內更新商品
INSERT INTO conditional_permissions VALUES (
    (SELECT permission_id FROM permissions WHERE permission_name = 'update_product'),
    'time_based',
    '{"start_time": "09:00", "end_time": "18:00", "timezone": "Asia/Taipei"}'
);
```

### 12.5 權限審計與監控

#### 12.5.1 權限變更日誌
```sql
CREATE TABLE permission_audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    action VARCHAR(50), -- 'grant', 'revoke', 'modify'
    role_id BIGINT REFERENCES roles(role_id),
    permission_id BIGINT REFERENCES permissions(permission_id),
    performed_by BIGINT REFERENCES users(user_id),
    performed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- 建立觸發器記錄權限變更
CREATE OR REPLACE FUNCTION log_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO permission_audit_log (user_id, action, role_id, performed_by)
        VALUES (NEW.user_id, 'grant', NEW.role_id, NEW.assigned_by);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_audit_log (user_id, action, role_id, performed_by)
        VALUES (OLD.user_id, 'revoke', OLD.role_id, OLD.assigned_by);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_audit_trigger
    AFTER INSERT OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION log_permission_changes();
```

#### 12.5.2 權限使用統計
```sql
-- 權限使用統計視圖
CREATE VIEW permission_usage_stats AS
SELECT 
    p.permission_name,
    COUNT(DISTINCT ur.user_id) as active_users,
    COUNT(DISTINCT r.role_name) as roles_with_permission,
    p.description
FROM permissions p
LEFT JOIN role_permissions rp ON p.permission_id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.role_id
LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = TRUE
GROUP BY p.permission_id, p.permission_name, p.description
ORDER BY active_users DESC;
```

### 12.6 效能優化

#### 12.6.1 權限快取策略
```sql
-- 建立權限快取表（定期更新）
CREATE TABLE user_permission_cache (
    user_id BIGINT PRIMARY KEY REFERENCES users(user_id),
    permissions JSONB, -- 快取的權限列表
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

-- 更新權限快取的函數
CREATE OR REPLACE FUNCTION refresh_permission_cache(p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT jsonb_agg(p.permission_name)
    INTO user_permissions
    FROM get_user_permissions(p_user_id) p;
    
    INSERT INTO user_permission_cache (user_id, permissions)
    VALUES (p_user_id, user_permissions)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        permissions = EXCLUDED.permissions,
        cached_at = NOW(),
        expires_at = NOW() + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

#### 12.6.2 查詢優化
```sql
-- 為權限查詢建立複合索引
CREATE INDEX idx_user_roles_permission_lookup 
ON user_roles(user_id, role_id, is_active);

CREATE INDEX idx_role_permissions_lookup 
ON role_permissions(role_id, permission_id);

-- 權限查詢優化視圖
CREATE VIEW user_permissions_view AS
SELECT 
    u.user_id,
    u.email,
    jsonb_agg(DISTINCT p.permission_name) as permissions,
    jsonb_agg(DISTINCT r.role_name) as roles
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = TRUE
JOIN roles r ON ur.role_id = r.role_id
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
GROUP BY u.user_id, u.email;
```

### 12.7 安全考量

#### 12.7.1 權限提升防護
- 實施雙重認證進行敏感操作
- 記錄所有權限變更操作
- 定期審計權限分配

#### 12.7.2 會話管理
```sql
-- 會話權限表
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(user_id),
    permissions JSONB, -- 會話快取的權限
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
    ip_address INET,
    user_agent TEXT
);
```

這個 RBAC 設計提供了完整的電商權限管理解決方案，支援多角色、細粒度權限控制、審計追蹤和效能優化。
