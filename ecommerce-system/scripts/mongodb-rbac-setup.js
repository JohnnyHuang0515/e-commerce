// MongoDB RBAC 設定腳本
// 用於初始化電商平台的 MongoDB 權限系統

// 切換到電商資料庫
use('ecommerce');

// 1. 創建角色集合
db.createCollection('roles');

// 2. 插入預設角色
db.roles.insertMany([
  {
    role: 'admin',
    permissions: ['*'],
    description: '系統管理員，擁有所有權限',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    role: 'seller',
    permissions: [
      'view_products',
      'create_product', 
      'update_product',
      'delete_product',
      'manage_inventory',
      'view_orders',
      'update_order',
      'manage_coupons',
      'process_return'
    ],
    description: '賣家，管理商品和訂單',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    role: 'logistics',
    permissions: [
      'view_orders',
      'update_order',
      'manage_logistics',
      'view_logistics_reports'
    ],
    description: '物流人員，管理物流狀態',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    role: 'customer_service',
    permissions: [
      'view_orders',
      'update_order',
      'process_refund',
      'process_return',
      'manage_users'
    ],
    description: '客服人員，處理客戶問題',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    role: 'analyst',
    permissions: [
      'view_reports',
      'query_analytics',
      'export_data',
      'view_ai_insights'
    ],
    description: '分析人員，查看分析數據',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    role: 'customer',
    permissions: [
      'view_products',
      'create_order',
      'view_orders',
      'cancel_order',
      'write_review',
      'manage_cart',
      'manage_wishlist',
      'request_return'
    ],
    description: '顧客，基本購買權限',
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// 3. 創建用戶集合
db.createCollection('users');

// 4. 插入測試用戶
db.users.insertMany([
  {
    _id: ObjectId(),
    user_id: 1,
    public_id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'admin',
    email: 'admin@ecommerce.com',
    roles: ['admin'],
    permissions: ['*'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    user_id: 2,
    public_id: '550e8400-e29b-41d4-a716-446655440002',
    username: 'seller1',
    email: 'seller1@ecommerce.com',
    roles: ['seller'],
    permissions: [
      'view_products',
      'create_product',
      'update_product',
      'delete_product',
      'manage_inventory',
      'view_orders',
      'update_order',
      'manage_coupons',
      'process_return'
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    user_id: 3,
    public_id: '550e8400-e29b-41d4-a716-446655440003',
    username: 'customer1',
    email: 'customer1@ecommerce.com',
    roles: ['customer'],
    permissions: [
      'view_products',
      'create_order',
      'view_orders',
      'cancel_order',
      'write_review',
      'manage_cart',
      'manage_wishlist',
      'request_return'
    ],
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// 5. 創建用戶行為事件集合
db.createCollection('user_events');

// 6. 創建評論集合
db.createCollection('reviews');

// 7. 創建用戶特徵集合
db.createCollection('user_features');

// 8. 創建商品特徵集合
db.createCollection('product_features');

// 9. 創建索引
// 用戶集合索引
db.users.createIndex({ "user_id": 1 });
db.users.createIndex({ "public_id": 1 });
db.users.createIndex({ "email": 1 });
db.users.createIndex({ "roles": 1 });

// 用戶事件集合索引
db.user_events.createIndex({ "user_id": 1, "event_time": -1 });
db.user_events.createIndex({ "event_type": 1 });
db.user_events.createIndex({ "created_at": -1 });

// 評論集合索引
db.reviews.createIndex({ "product_id": 1 });
db.reviews.createIndex({ "user_id": 1 });
db.reviews.createIndex({ "rating": 1 });
db.reviews.createIndex({ "created_at": -1 });

// 特徵集合索引
db.user_features.createIndex({ "user_id": 1 });
db.product_features.createIndex({ "product_id": 1 });

// 10. 創建 MongoDB 原生 RBAC 角色
// 管理員角色
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

// 普通用戶角色
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
      resource: { db: "ecommerce", collection: "user_features" }, 
      actions: ["find"] 
    }
  ],
  roles: []
});

// 分析師角色
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
    }
  ],
  roles: []
});

// 11. 創建用戶並分配角色
db.createUser({
  user: "ecommerce_admin_user",
  pwd: "admin_password_123",
  roles: [
    { role: "ecommerce_admin", db: "ecommerce" }
  ]
});

db.createUser({
  user: "ecommerce_customer_user",
  pwd: "customer_password_123",
  roles: [
    { role: "ecommerce_customer", db: "ecommerce" }
  ]
});

db.createUser({
  user: "ecommerce_analyst_user",
  pwd: "analyst_password_123",
  roles: [
    { role: "ecommerce_analyst", db: "ecommerce" }
  ]
});

// 12. 插入測試數據
// 用戶行為事件
db.user_events.insertMany([
  {
    user_id: 3,
    event_type: 'page_view',
    event_data: {
      page: '/products',
      timestamp: new Date(),
      user_agent: 'Mozilla/5.0...',
      ip_address: '192.168.1.100'
    },
    created_at: new Date()
  },
  {
    user_id: 3,
    event_type: 'product_view',
    event_data: {
      product_id: 1,
      product_name: 'iPhone 15',
      timestamp: new Date()
    },
    created_at: new Date()
  }
]);

// 商品評論
db.reviews.insertMany([
  {
    user_id: 3,
    product_id: 1,
    rating: 5,
    comment: '非常好的商品，推薦購買！',
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// 用戶特徵
db.user_features.insertOne({
  user_id: 3,
  features: {
    preferences: ['electronics', 'smartphones'],
    behavior_score: 0.85,
    purchase_frequency: 'high',
    avg_order_value: 1500.00
  },
  created_at: new Date(),
  updated_at: new Date()
});

// 商品特徵
db.product_features.insertOne({
  product_id: 1,
  features: {
    category: 'electronics',
    subcategory: 'smartphones',
    price_range: 'premium',
    popularity_score: 0.92,
    tags: ['apple', 'iphone', 'premium']
  },
  created_at: new Date(),
  updated_at: new Date()
});

print('MongoDB RBAC 設定完成！');
print('已創建角色:', db.roles.countDocuments());
print('已創建用戶:', db.users.countDocuments());
print('已創建事件:', db.user_events.countDocuments());
print('已創建評論:', db.reviews.countDocuments());
