// MongoDB 電商系統資料庫初始化腳本
// 半結構化資料：商品詳細描述、前端配置、系統日誌、客服紀錄

// 切換到電商資料庫
db = db.getSiblingDB('ecommerce');

// ==============================================
// 4.1 商品詳細描述集合初始化
// ==============================================

// 建立商品詳細描述集合
db.createCollection('products_detail', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_pg_id", "name", "description"],
      properties: {
        product_pg_id: {
          bsonType: "int",
          description: "對應 PostgreSQL product_id"
        },
        name: {
          bsonType: "string",
          description: "商品名稱"
        },
        description: {
          bsonType: "string",
          description: "商品描述"
        },
        specs: {
          bsonType: "object",
          description: "商品規格"
        },
        images: {
          bsonType: "array",
          description: "商品圖片陣列"
        },
        features: {
          bsonType: "array",
          description: "商品特色"
        },
        seo: {
          bsonType: "object",
          description: "SEO 資訊"
        },
        created_at: {
          bsonType: "date",
          description: "建立時間"
        },
        updated_at: {
          bsonType: "date",
          description: "更新時間"
        }
      }
    }
  }
});

// 建立索引
db.products_detail.createIndex({ "product_pg_id": 1 }, { unique: true });
db.products_detail.createIndex({ "name": "text", "description": "text" });
db.products_detail.createIndex({ "specs.brand": 1 });
db.products_detail.createIndex({ "specs.color": 1 });
db.products_detail.createIndex({ "created_at": 1 });

// 插入測試商品詳細資料
db.products_detail.insertMany([
  {
    product_pg_id: 1,
    name: "iPhone 15 Pro",
    description: "配備 A17 Pro 晶片的 iPhone 15 Pro，提供卓越的效能和專業級攝影功能。支援 USB-C 連接，具備鈦金屬機身設計。",
    specs: {
      color: ["自然鈦", "藍色鈦", "白色鈦", "黑色鈦"],
      storage: ["128GB", "256GB", "512GB", "1TB"],
      display: "6.1 吋 Super Retina XDR",
      processor: "A17 Pro",
      camera: "48MP 主相機 + 12MP 超廣角 + 12MP 長焦",
      battery: "全天候電池續航",
      connectivity: "USB-C",
      materials: ["鈦金屬", "陶瓷護盾"],
      dimensions: {
        length: 146.6,
        width: 70.6,
        height: 8.25,
        weight: 187
      }
    },
    images: [
      "https://cdn.example.com/p/1/img1.jpg",
      "https://cdn.example.com/p/1/img2.jpg",
      "https://cdn.example.com/p/1/img3.jpg"
    ],
    features: ["A17 Pro 晶片", "專業級攝影", "USB-C 連接", "鈦金屬機身", "全天候電池"],
    care_instructions: "請使用柔軟的乾布清潔螢幕和機身。避免接觸液體和極端溫度。",
    warranty_info: "1年有限保固",
    seo: {
      title: "iPhone 15 Pro - 專業級智慧手機",
      keywords: ["iPhone", "智慧手機", "A17 Pro", "專業攝影", "鈦金屬"],
      description: "配備 A17 Pro 晶片的 iPhone 15 Pro，提供卓越效能和專業攝影功能"
    },
    reviews: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_pg_id: 2,
    name: "MacBook Pro M3",
    description: "搭載 M3 晶片的 MacBook Pro，提供驚人的效能和電池續航力。適合專業創作者和開發者使用。",
    specs: {
      color: ["太空灰", "銀色"],
      storage: ["256GB", "512GB", "1TB", "2TB", "4TB", "8TB"],
      display: "14.2 吋 Liquid Retina XDR",
      processor: "Apple M3",
      memory: ["8GB", "16GB", "24GB", "32GB", "64GB", "128GB"],
      graphics: "10 核心 GPU",
      battery: "最長可達 18 小時",
      connectivity: ["Thunderbolt 4", "HDMI", "SDXC 卡插槽", "MagSafe 3"],
      materials: ["鋁合金"],
      dimensions: {
        length: 312.6,
        width: 221.2,
        height: 15.5,
        weight: 1600
      }
    },
    images: [
      "https://cdn.example.com/p/2/img1.jpg",
      "https://cdn.example.com/p/2/img2.jpg"
    ],
    features: ["M3 晶片", "Liquid Retina XDR 顯示器", "長效電池", "Thunderbolt 4", "專業級效能"],
    care_instructions: "請避免在鍵盤上放置重物。定期清潔螢幕和鍵盤。",
    warranty_info: "1年有限保固",
    seo: {
      title: "MacBook Pro M3 - 專業筆記型電腦",
      keywords: ["MacBook Pro", "M3", "筆記型電腦", "專業", "創作者"],
      description: "搭載 M3 晶片的 MacBook Pro，提供驚人效能和電池續航力"
    },
    reviews: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_pg_id: 3,
    name: "AirPods Pro",
    description: "具備主動降噪功能的 AirPods Pro，提供沉浸式音訊體驗。支援空間音訊和自適應等化器。",
    specs: {
      color: ["白色"],
      battery_life: "最長可達 6 小時聆聽時間",
      charging_case: "MagSafe 充電盒",
      connectivity: "藍牙 5.3",
      features: ["主動降噪", "通透模式", "空間音訊", "自適應等化器"],
      materials: ["塑膠", "金屬"],
      dimensions: {
        length: 45.2,
        width: 60.9,
        height: 21.7,
        weight: 5.4
      }
    },
    images: [
      "https://cdn.example.com/p/3/img1.jpg",
      "https://cdn.example.com/p/3/img2.jpg"
    ],
    features: ["主動降噪", "通透模式", "空間音訊", "自適應等化器", "MagSafe 充電"],
    care_instructions: "請保持耳機清潔乾燥。避免接觸液體。",
    warranty_info: "1年有限保固",
    seo: {
      title: "AirPods Pro - 主動降噪無線耳機",
      keywords: ["AirPods Pro", "無線耳機", "降噪", "空間音訊", "MagSafe"],
      description: "具備主動降噪功能的 AirPods Pro，提供沉浸式音訊體驗"
    },
    reviews: [],
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// ==============================================
// 4.2 前端配置集合初始化
// ==============================================

// 建立前端配置集合
db.createCollection('frontend_configs', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["config_type", "config_data", "version", "is_active"],
      properties: {
        config_type: {
          bsonType: "string",
          enum: ["homepage", "category_page", "product_page", "checkout", "user_dashboard"]
        },
        config_data: {
          bsonType: "object"
        },
        version: {
          bsonType: "string"
        },
        is_active: {
          bsonType: "bool"
        },
        created_at: {
          bsonType: "date"
        },
        updated_at: {
          bsonType: "date"
        }
      }
    }
  }
});

// 建立索引
db.frontend_configs.createIndex({ "config_type": 1, "is_active": 1 });
db.frontend_configs.createIndex({ "version": 1 });

// 插入前端配置範例
db.frontend_configs.insertMany([
  {
    config_type: "homepage",
    config_data: {
      layout: {
        header: {
          logo: "https://cdn.example.com/logo.png",
          navigation: ["首頁", "商品分類", "特價商品", "關於我們"]
        },
        hero_section: {
          title: "歡迎來到我們的電商平台",
          subtitle: "發現優質商品，享受購物樂趣",
          background_image: "https://cdn.example.com/hero-bg.jpg"
        },
        featured_products: {
          title: "精選商品",
          limit: 8,
          sort_by: "popularity"
        },
        categories: {
          title: "商品分類",
          display_type: "grid",
          items_per_row: 4
        }
      },
      components: [
        {
          type: "product_carousel",
          props: {
            title: "熱門商品",
            auto_play: true,
            interval: 5000
          }
        },
        {
          type: "newsletter_signup",
          props: {
            title: "訂閱電子報",
            placeholder: "輸入您的電子郵件"
          }
        }
      ],
      styles: {
        primary_color: "#007bff",
        secondary_color: "#6c757d",
        font_family: "Arial, sans-serif"
      },
      behaviors: {
        lazy_loading: true,
        infinite_scroll: false,
        analytics_tracking: true
      }
    },
    version: "1.0.0",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    config_type: "product_page",
    config_data: {
      layout: {
        product_gallery: {
          thumbnail_size: "small",
          main_image_size: "large",
          zoom_enabled: true
        },
        product_info: {
          show_rating: true,
          show_reviews: true,
          show_stock_status: true
        },
        related_products: {
          title: "相關商品",
          limit: 4,
          algorithm: "similarity"
        }
      },
      components: [
        {
          type: "product_reviews",
          props: {
            show_rating_summary: true,
            allow_review_submission: true
          }
        },
        {
          type: "product_recommendations",
          props: {
            title: "推薦商品",
            algorithm: "collaborative_filtering"
          }
        }
      ],
      styles: {
        gallery_width: "60%",
        info_width: "40%",
        button_color: "#28a745"
      },
      behaviors: {
        add_to_cart_animation: true,
        wishlist_toggle: true,
        share_buttons: true
      }
    },
    version: "1.0.0",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// ==============================================
// 4.3 系統日誌集合初始化
// ==============================================

// 建立系統日誌集合
db.createCollection('system_logs', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["level", "service", "message", "timestamp"],
      properties: {
        level: {
          bsonType: "string",
          enum: ["info", "warn", "error", "debug"]
        },
        service: {
          bsonType: "string",
          enum: ["auth", "payment", "inventory", "recommendation", "api", "frontend"]
        },
        message: {
          bsonType: "string"
        },
        context: {
          bsonType: "object",
          properties: {
            user_id: { bsonType: "int" },
            session_id: { bsonType: "string" },
            request_id: { bsonType: "string" },
            ip_address: { bsonType: "string" },
            user_agent: { bsonType: "string" }
          }
        },
        data: {
          bsonType: "object"
        },
        timestamp: {
          bsonType: "date"
        }
      }
    }
  }
});

// 建立索引
db.system_logs.createIndex({ "level": 1, "timestamp": 1 });
db.system_logs.createIndex({ "service": 1, "timestamp": 1 });
db.system_logs.createIndex({ "context.user_id": 1 });
db.system_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 2592000 }); // 30天後自動刪除

// 插入測試日誌
db.system_logs.insertMany([
  {
    level: "info",
    service: "auth",
    message: "用戶登入成功",
    context: {
      user_id: 1,
      session_id: "sess_123456789",
      request_id: "req_001",
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    data: {
      login_method: "email",
      login_time: new Date()
    },
    timestamp: new Date()
  },
  {
    level: "info",
    service: "payment",
    message: "支付處理完成",
    context: {
      user_id: 1,
      session_id: "sess_123456789",
      request_id: "req_002",
      ip_address: "192.168.1.100"
    },
    data: {
      order_id: 1001,
      amount: 999.00,
      payment_method: "credit_card",
      transaction_id: "txn_789012345"
    },
    timestamp: new Date()
  },
  {
    level: "warn",
    service: "inventory",
    message: "商品庫存不足",
    context: {
      request_id: "req_003"
    },
    data: {
      product_id: 1,
      current_stock: 5,
      requested_quantity: 10
    },
    timestamp: new Date()
  }
]);

// ==============================================
// 4.4 客服紀錄集合初始化
// ==============================================

// 建立客服紀錄集合
db.createCollection('customer_service_records', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ticket_id", "user_id", "category", "priority", "status", "messages"],
      properties: {
        ticket_id: {
          bsonType: "string"
        },
        user_id: {
          bsonType: "int"
        },
        agent_id: {
          bsonType: "int"
        },
        category: {
          bsonType: "string",
          enum: ["order_inquiry", "product_question", "complaint", "return_request", "technical_support"]
        },
        priority: {
          bsonType: "string",
          enum: ["low", "medium", "high", "urgent"]
        },
        status: {
          bsonType: "string",
          enum: ["open", "in_progress", "resolved", "closed"]
        },
        messages: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["sender", "content", "timestamp"],
            properties: {
              sender: {
                bsonType: "string",
                enum: ["user", "agent", "system"]
              },
              content: {
                bsonType: "string"
              },
              timestamp: {
                bsonType: "date"
              },
              attachments: {
                bsonType: "array",
                items: { bsonType: "string" }
              }
            }
          }
        },
        resolution: {
          bsonType: "string"
        },
        satisfaction_rating: {
          bsonType: "int",
          minimum: 1,
          maximum: 5
        },
        created_at: {
          bsonType: "date"
        },
        updated_at: {
          bsonType: "date"
        },
        closed_at: {
          bsonType: "date"
        }
      }
    }
  }
});

// 建立索引
db.customer_service_records.createIndex({ "ticket_id": 1 }, { unique: true });
db.customer_service_records.createIndex({ "user_id": 1 });
db.customer_service_records.createIndex({ "agent_id": 1 });
db.customer_service_records.createIndex({ "status": 1, "priority": 1 });
db.customer_service_records.createIndex({ "created_at": 1 });

// 插入測試客服紀錄
db.customer_service_records.insertMany([
  {
    ticket_id: "TICKET-001",
    user_id: 1,
    agent_id: 101,
    category: "order_inquiry",
    priority: "medium",
    status: "resolved",
    messages: [
      {
        sender: "user",
        content: "我的訂單 #1001 什麼時候會到貨？",
        timestamp: new Date(Date.now() - 86400000), // 1天前
        attachments: []
      },
      {
        sender: "agent",
        content: "您好！我來為您查詢訂單狀態。",
        timestamp: new Date(Date.now() - 82800000), // 23小時前
        attachments: []
      },
      {
        sender: "agent",
        content: "您的訂單已於昨天出貨，預計明天會到達。您可以透過追蹤號碼查詢物流狀態。",
        timestamp: new Date(Date.now() - 82800000),
        attachments: []
      },
      {
        sender: "user",
        content: "謝謝您的協助！",
        timestamp: new Date(Date.now() - 72000000), // 20小時前
        attachments: []
      }
    ],
    resolution: "提供訂單追蹤資訊，用戶滿意",
    satisfaction_rating: 5,
    created_at: new Date(Date.now() - 86400000),
    updated_at: new Date(Date.now() - 72000000),
    closed_at: new Date(Date.now() - 72000000)
  },
  {
    ticket_id: "TICKET-002",
    user_id: 2,
    agent_id: 102,
    category: "product_question",
    priority: "low",
    status: "in_progress",
    messages: [
      {
        sender: "user",
        content: "iPhone 15 Pro 支援哪些充電方式？",
        timestamp: new Date(Date.now() - 3600000), // 1小時前
        attachments: []
      },
      {
        sender: "agent",
        content: "iPhone 15 Pro 支援 USB-C 有線充電和 MagSafe 無線充電。",
        timestamp: new Date(Date.now() - 1800000), // 30分鐘前
        attachments: []
      }
    ],
    resolution: "",
    satisfaction_rating: null,
    created_at: new Date(Date.now() - 3600000),
    updated_at: new Date(Date.now() - 1800000),
    closed_at: null
  }
]);

// ==============================================
// 建立資料庫使用者
// ==============================================

// 建立讀寫使用者
db.createUser({
  user: "ecommerce_user",
  pwd: "ecommerce_password",
  roles: [
    {
      role: "readWrite",
      db: "ecommerce"
    }
  ]
});

// 建立只讀使用者
db.createUser({
  user: "ecommerce_readonly",
  pwd: "ecommerce_readonly_password",
  roles: [
    {
      role: "read",
      db: "ecommerce"
    }
  ]
});

// 完成初始化
print("MongoDB 電商系統資料庫初始化完成！");
print("資料庫名稱: ecommerce");
print("使用者: ecommerce_user (讀寫), ecommerce_readonly (只讀)");
print("已建立所有必要的集合和索引");
print("集合清單:");
print("- products_detail: 商品詳細描述");
print("- frontend_configs: 前端配置");
print("- system_logs: 系統日誌");
print("- customer_service_records: 客服紀錄");
