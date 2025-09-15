// MongoDB 集合初始化腳本
// 基於設計文件創建的 MongoDB 架構

// 切換到電商資料庫
use('ecommerce');

// =============================================
// 1. 創建核心集合
// =============================================

// 用戶行為事件集合
db.createCollection('user_events', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "event_type", "created_at"],
      properties: {
        user_id: { bsonType: "int" },
        event_type: { 
          bsonType: "string",
          enum: ["page_view", "product_view", "add_to_cart", "remove_from_cart", 
                "purchase", "search", "review", "login", "logout"]
        },
        product_id: { bsonType: "int" },
        event_data: { bsonType: "object" },
        metadata: { bsonType: "object" },
        created_at: { bsonType: "date" }
      }
    }
  }
});

// 商品評論集合
db.createCollection('reviews', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["review_id", "product_id", "user_id", "rating", "created_at"],
      properties: {
        review_id: { bsonType: "string" },
        product_id: { bsonType: "int" },
        user_id: { bsonType: "int" },
        rating: { 
          bsonType: "int",
          minimum: 1,
          maximum: 5
        },
        comment: { bsonType: "string" },
        images: { bsonType: "array" },
        helpful_count: { bsonType: "int" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// 用戶特徵集合
db.createCollection('user_features', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "features", "version", "created_at"],
      properties: {
        user_id: { bsonType: "int" },
        features: { bsonType: "object" },
        version: { bsonType: "string" },
        model_version: { bsonType: "string" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// 商品特徵集合
db.createCollection('product_features', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_id", "features", "version", "created_at"],
      properties: {
        product_id: { bsonType: "int" },
        features: { bsonType: "object" },
        version: { bsonType: "string" },
        model_version: { bsonType: "string" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// 推薦結果集合
db.createCollection('recommendations', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "recommended_products", "version", "created_at"],
      properties: {
        user_id: { bsonType: "int" },
        recommended_products: { bsonType: "array" },
        algorithm: { bsonType: "string" },
        version: { bsonType: "string" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// 商品詳細資訊集合 (彈性屬性)
db.createCollection('product_details', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_id", "version", "created_at"],
      properties: {
        product_id: { bsonType: "int" },
        attributes: { bsonType: "object" },
        description_html: { bsonType: "string" },
        specifications: { bsonType: "object" },
        images: { bsonType: "array" },
        tags: { bsonType: "array" },
        seo_data: { bsonType: "object" },
        version: { bsonType: "int" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// =============================================
// 2. 創建索引
// =============================================

// 用戶事件索引
db.user_events.createIndex({ "user_id": 1, "created_at": -1 });
db.user_events.createIndex({ "event_type": 1 });
db.user_events.createIndex({ "product_id": 1 });
db.user_events.createIndex({ "created_at": -1 });

// 評論索引
db.reviews.createIndex({ "product_id": 1, "created_at": -1 });
db.reviews.createIndex({ "user_id": 1 });
db.reviews.createIndex({ "rating": 1 });
db.reviews.createIndex({ "created_at": -1 });

// 特徵索引
db.user_features.createIndex({ "user_id": 1 });
db.user_features.createIndex({ "version": 1 });
db.product_features.createIndex({ "product_id": 1 });
db.product_features.createIndex({ "version": 1 });

// 推薦索引
db.recommendations.createIndex({ "user_id": 1 });
db.recommendations.createIndex({ "algorithm": 1 });
db.recommendations.createIndex({ "created_at": -1 });

// 商品詳細資訊索引
db.product_details.createIndex({ "product_id": 1 });
db.product_details.createIndex({ "version": 1 });

// =============================================
// 3. 插入測試數據
// =============================================

// 插入測試用戶事件
db.user_events.insertMany([
  {
    user_id: 1,
    event_type: "page_view",
    event_data: {
      page: "/products",
      referrer: "https://google.com"
    },
    metadata: {
      user_agent: "Mozilla/5.0...",
      ip_address: "192.168.1.100"
    },
    created_at: new Date()
  },
  {
    user_id: 1,
    event_type: "product_view",
    product_id: 1,
    event_data: {
      product_name: "iPhone 15",
      category: "電子產品"
    },
    created_at: new Date()
  },
  {
    user_id: 1,
    event_type: "add_to_cart",
    product_id: 1,
    event_data: {
      quantity: 1,
      price: 35000
    },
    created_at: new Date()
  }
]);

// 插入測試評論
db.reviews.insertMany([
  {
    review_id: "rev-001",
    product_id: 1,
    user_id: 1,
    rating: 5,
    comment: "非常好的商品，推薦購買！",
    images: ["https://example.com/review1.jpg"],
    helpful_count: 3,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    review_id: "rev-002",
    product_id: 1,
    user_id: 2,
    rating: 4,
    comment: "品質不錯，但價格有點貴",
    helpful_count: 1,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// 插入測試用戶特徵
db.user_features.insertOne({
  user_id: 1,
  features: {
    preferences: ["electronics", "smartphones", "gadgets"],
    behavior_score: 0.85,
    purchase_frequency: "high",
    avg_order_value: 1500.00,
    preferred_categories: ["電子產品", "配件"],
    price_sensitivity: "medium",
    brand_loyalty: 0.7
  },
  version: "v1.0",
  model_version: "behavior_analysis_v2.1",
  created_at: new Date(),
  updated_at: new Date()
});

// 插入測試商品特徵
db.product_features.insertOne({
  product_id: 1,
  features: {
    category: "電子產品",
    subcategory: "智慧型手機",
    price_range: "premium",
    popularity_score: 0.92,
    quality_score: 0.88,
    tags: ["apple", "iphone", "premium", "smartphone"],
    brand_strength: 0.95,
    seasonal_trend: "stable"
  },
  version: "v1.0",
  model_version: "product_analysis_v2.1",
  created_at: new Date(),
  updated_at: new Date()
});

// 插入測試推薦結果
db.recommendations.insertOne({
  user_id: 1,
  recommended_products: [
    { product_id: 2, score: 0.95, reason: "similar_category" },
    { product_id: 3, score: 0.88, reason: "collaborative_filtering" },
    { product_id: 4, score: 0.82, reason: "content_based" }
  ],
  algorithm: "hybrid_recommendation",
  version: "v1.0",
  created_at: new Date(),
  updated_at: new Date()
});

// 插入測試商品詳細資訊
db.product_details.insertOne({
  product_id: 1,
  attributes: {
    color: "太空黑",
    storage: "256GB",
    screen_size: "6.1吋",
    camera: "48MP主鏡頭",
    battery: "3349mAh"
  },
  description_html: "<p>iPhone 15 搭載 A17 Pro 晶片，提供卓越性能...</p>",
  specifications: {
    processor: "A17 Pro",
    memory: "8GB",
    storage_options: ["128GB", "256GB", "512GB"],
    connectivity: ["5G", "Wi-Fi 6E", "Bluetooth 5.3"]
  },
  images: [
    "https://example.com/iphone15-1.jpg",
    "https://example.com/iphone15-2.jpg"
  ],
  tags: ["apple", "iphone", "smartphone", "premium"],
  seo_data: {
    title: "iPhone 15 太空黑 256GB - 官方授權店",
    description: "iPhone 15 搭載 A17 Pro 晶片，提供卓越性能與攝影體驗",
    keywords: ["iPhone 15", "蘋果手機", "智慧型手機"]
  },
  version: 1,
  created_at: new Date(),
  updated_at: new Date()
});

// =============================================
// 4. 創建 MongoDB RBAC 角色和用戶
// =============================================

// 創建管理員角色
db.createRole({
  role: "ecommerce_admin",
  privileges: [
    { 
      resource: { db: "ecommerce", collection: "" }, 
      actions: ["find", "insert", "update", "remove", "createCollection", "dropCollection"] 
    }
  ],
  roles: []
});

// 創建分析師角色
db.createRole({
  role: "ecommerce_analyst",
  privileges: [
    { 
      resource: { db: "ecommerce", collection: "user_events" }, 
      actions: ["find"] 
    },
    { 
      resource: { db: "ecommerce", collection: "reviews" }, 
      actions: ["find"] 
    },
    { 
      resource: { db: "ecommerce", collection: "user_features" }, 
      actions: ["find", "insert", "update"] 
    },
    { 
      resource: { db: "ecommerce", collection: "product_features" }, 
      actions: ["find", "insert", "update"] 
    },
    { 
      resource: { db: "ecommerce", collection: "recommendations" }, 
      actions: ["find", "insert", "update"] 
    }
  ],
  roles: []
});

// 創建普通用戶角色
db.createRole({
  role: "ecommerce_customer",
  privileges: [
    { 
      resource: { db: "ecommerce", collection: "user_events" }, 
      actions: ["find", "insert"] 
    },
    { 
      resource: { db: "ecommerce", collection: "reviews" }, 
      actions: ["find", "insert"] 
    },
    { 
      resource: { db: "ecommerce", collection: "recommendations" }, 
      actions: ["find"] 
    }
  ],
  roles: []
});

// 創建 MongoDB 用戶
db.createUser({
  user: "ecommerce_admin_user",
  pwd: "admin_password_123",
  roles: [
    { role: "ecommerce_admin", db: "ecommerce" }
  ]
});

db.createUser({
  user: "ecommerce_analyst_user",
  pwd: "analyst_password_123",
  roles: [
    { role: "ecommerce_analyst", db: "ecommerce" }
  ]
});

db.createUser({
  user: "ecommerce_customer_user",
  pwd: "customer_password_123",
  roles: [
    { role: "ecommerce_customer", db: "ecommerce" }
  ]
});

print('MongoDB 集合初始化完成！');
print('已創建集合:', db.getCollectionNames());
print('已創建索引:', db.user_events.getIndexes().length + db.reviews.getIndexes().length + 
      db.user_features.getIndexes().length + db.product_features.getIndexes().length + 
      db.recommendations.getIndexes().length + db.product_details.getIndexes().length);
print('已插入測試數據');
print('已創建 RBAC 角色和用戶');
