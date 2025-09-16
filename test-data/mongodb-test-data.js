// MongoDB 電商系統測試資料
// 擴展現有初始化腳本的測試資料

// 切換到電商資料庫
db = db.getSiblingDB('ecommerce');

// ==============================================
// 擴展商品詳細描述資料
// ==============================================

db.products_detail.insertMany([
  {
    product_pg_id: 6,
    name: "SK-II 青春露",
    description: "SK-II 經典青春露，含有90%以上的Pitera™精華，能有效改善肌膚質感，讓肌膚更加光滑細緻。適合所有肌膚類型使用。",
    specs: {
      brand: "SK-II",
      volume: "230ml",
      skin_type: ["所有肌膚類型"],
      main_ingredient: "Pitera™精華",
      texture: "清爽水狀",
      usage: "早晚使用，輕拍於臉部",
      shelf_life: "3年",
      origin: "日本",
      dimensions: {
        length: 15.5,
        width: 6.5,
        height: 23.5,
        weight: 280
      }
    },
    images: [
      "https://cdn.example.com/p/6/img1.jpg",
      "https://cdn.example.com/p/6/img2.jpg",
      "https://cdn.example.com/p/6/img3.jpg"
    ],
    features: ["Pitera™精華", "改善肌膚質感", "清爽質地", "適合所有肌膚", "日本製造"],
    care_instructions: "請存放於陰涼乾燥處，避免陽光直射。使用前請先做過敏測試。",
    warranty_info: "正品保證，假一賠十",
    seo: {
      title: "SK-II 青春露 - 經典護膚精華",
      keywords: ["SK-II", "青春露", "Pitera", "護膚", "精華", "日本"],
      description: "SK-II 經典青春露，含有90%以上的Pitera™精華，有效改善肌膚質感"
    },
    reviews: [
      {
        user_id: 4,
        rating: 5,
        comment: "用了很多年，效果一直很好！",
        created_at: new Date("2024-01-02T09:00:00Z")
      }
    ],
    created_at: new Date("2024-01-01T10:00:00Z"),
    updated_at: new Date("2024-01-01T10:00:00Z")
  },
  {
    product_pg_id: 7,
    name: "蘭蔻小黑瓶精華",
    description: "蘭蔻小黑瓶精華，含有高濃度玻尿酸和維生素C，能深層滋潤肌膚，改善細紋，讓肌膚更加緊緻有彈性。",
    specs: {
      brand: "Lancôme",
      volume: "50ml",
      skin_type: ["乾性", "混合性", "熟齡肌"],
      main_ingredient: "玻尿酸 + 維生素C",
      texture: "輕盈乳狀",
      usage: "早晚使用，按摩至吸收",
      shelf_life: "3年",
      origin: "法國",
      dimensions: {
        length: 12.0,
        width: 5.0,
        height: 20.0,
        weight: 150
      }
    },
    images: [
      "https://cdn.example.com/p/7/img1.jpg",
      "https://cdn.example.com/p/7/img2.jpg"
    ],
    features: ["高濃度玻尿酸", "維生素C", "改善細紋", "緊緻肌膚", "法國製造"],
    care_instructions: "請存放於陰涼處，避免高溫。使用後請做好防曬。",
    warranty_info: "正品保證",
    seo: {
      title: "蘭蔻小黑瓶精華 - 抗老護膚",
      keywords: ["蘭蔻", "小黑瓶", "精華", "玻尿酸", "維生素C", "抗老"],
      description: "蘭蔻小黑瓶精華，含有高濃度玻尿酸和維生素C，深層滋潤肌膚"
    },
    reviews: [
      {
        user_id: 5,
        rating: 4,
        comment: "質地很好，吸收快",
        created_at: new Date("2024-01-02T10:00:00Z")
      }
    ],
    created_at: new Date("2024-01-01T11:00:00Z"),
    updated_at: new Date("2024-01-01T11:00:00Z")
  },
  {
    product_pg_id: 11,
    name: "日本進口零食禮盒",
    description: "精選日本各地特色零食，包含和菓子、餅乾、糖果等，包裝精美，適合送禮或自用。每盒包含15種不同口味的零食。",
    specs: {
      brand: "日本直送",
      weight: "800g",
      contents: ["和菓子", "餅乾", "糖果", "巧克力"],
      flavors: ["抹茶", "紅豆", "芝麻", "草莓", "巧克力"],
      packaging: "精美禮盒",
      shelf_life: "6個月",
      origin: "日本",
      allergens: ["小麥", "牛奶", "雞蛋", "堅果"]
    },
    images: [
      "https://cdn.example.com/p/11/img1.jpg",
      "https://cdn.example.com/p/11/img2.jpg",
      "https://cdn.example.com/p/11/img3.jpg"
    ],
    features: ["日本直送", "15種口味", "精美包裝", "適合送禮", "新鮮美味"],
    care_instructions: "請存放於陰涼乾燥處，開封後請盡快食用。",
    warranty_info: "新鮮保證，7天內可退換",
    seo: {
      title: "日本進口零食禮盒 - 精選15種口味",
      keywords: ["日本零食", "禮盒", "和菓子", "餅乾", "糖果", "送禮"],
      description: "精選日本各地特色零食，包含15種不同口味，包裝精美適合送禮"
    },
    reviews: [
      {
        user_id: 7,
        rating: 4,
        comment: "包裝很漂亮，零食也很好吃",
        created_at: new Date("2024-01-02T11:00:00Z")
      }
    ],
    created_at: new Date("2024-01-01T12:00:00Z"),
    updated_at: new Date("2024-01-01T12:00:00Z")
  },
  {
    product_pg_id: 14,
    name: "皇家狗糧",
    description: "皇家專業狗糧，含有優質蛋白質和維生素，適合成犬食用。採用天然食材製成，無人工添加劑，營養均衡。",
    specs: {
      brand: "Royal Canin",
      weight: "15kg",
      age_group: "成犬",
      protein_content: "26%",
      fat_content: "15%",
      fiber_content: "3%",
      moisture_content: "8%",
      ingredients: ["雞肉", "米", "玉米", "維生素", "礦物質"],
      shelf_life: "18個月",
      origin: "法國"
    },
    images: [
      "https://cdn.example.com/p/14/img1.jpg",
      "https://cdn.example.com/p/14/img2.jpg"
    ],
    features: ["優質蛋白質", "天然食材", "營養均衡", "無人工添加劑", "法國製造"],
    care_instructions: "請存放於陰涼乾燥處，避免陽光直射。",
    warranty_info: "品質保證",
    seo: {
      title: "皇家狗糧 - 成犬專用營養糧",
      keywords: ["皇家狗糧", "成犬", "蛋白質", "天然", "營養"],
      description: "皇家專業狗糧，含有優質蛋白質和維生素，適合成犬食用"
    },
    reviews: [
      {
        user_id: 9,
        rating: 5,
        comment: "狗狗很愛吃，毛色也變好了",
        created_at: new Date("2024-01-03T09:00:00Z")
      }
    ],
    created_at: new Date("2024-01-01T13:00:00Z"),
    updated_at: new Date("2024-01-01T13:00:00Z")
  },
  {
    product_pg_id: 18,
    name: "汽車行車記錄器",
    description: "4K高畫質行車記錄器，具備夜視功能、GPS定位、碰撞感應等先進功能。安裝簡單，操作方便，保障行車安全。",
    specs: {
      brand: "Garmin",
      model: "Dash Cam 67W",
      resolution: "4K UHD",
      field_of_view: "180度",
      night_vision: true,
      gps: true,
      collision_detection: true,
      storage: "支援microSD卡",
      battery_life: "2小時",
      connectivity: ["WiFi", "藍牙"],
      dimensions: {
        length: 8.5,
        width: 5.5,
        height: 3.0,
        weight: 120
      }
    },
    images: [
      "https://cdn.example.com/p/18/img1.jpg",
      "https://cdn.example.com/p/18/img2.jpg",
      "https://cdn.example.com/p/18/img3.jpg"
    ],
    features: ["4K高畫質", "夜視功能", "GPS定位", "碰撞感應", "WiFi連接"],
    care_instructions: "請定期清潔鏡頭，避免遮擋。定期檢查記憶卡空間。",
    warranty_info: "2年保固",
    seo: {
      title: "Garmin 4K行車記錄器 - 夜視GPS功能",
      keywords: ["行車記錄器", "4K", "夜視", "GPS", "Garmin", "安全"],
      description: "4K高畫質行車記錄器，具備夜視功能、GPS定位、碰撞感應等先進功能"
    },
    reviews: [
      {
        user_id: 10,
        rating: 5,
        comment: "畫質很清晰，夜視效果也很好",
        created_at: new Date("2024-01-03T10:00:00Z")
      }
    ],
    created_at: new Date("2024-01-01T14:00:00Z"),
    updated_at: new Date("2024-01-01T14:00:00Z")
  }
]);

// ==============================================
// 擴展前端配置資料
// ==============================================

db.frontend_configs.insertMany([
  {
    config_type: "category_page",
    config_data: {
      layout: {
        header: {
          breadcrumb: true,
          filter_sidebar: true,
          sort_options: ["價格", "人氣", "最新", "評分"]
        },
        product_grid: {
          items_per_row: 4,
          show_ratings: true,
          show_wishlist: true,
          lazy_loading: true
        },
        pagination: {
          items_per_page: 20,
          show_page_numbers: true
        }
      },
      components: [
        {
          type: "category_filter",
          props: {
            show_price_range: true,
            show_brands: true,
            show_ratings: true
          }
        },
        {
          type: "product_comparison",
          props: {
            max_compare_items: 4,
            show_comparison_table: true
          }
        }
      ],
      styles: {
        grid_gap: "20px",
        card_border_radius: "8px",
        hover_effect: "shadow"
      },
      behaviors: {
        infinite_scroll: false,
        quick_view: true,
        add_to_cart_animation: true
      }
    },
    version: "1.0.0",
    is_active: true,
    created_at: new Date("2024-01-01T10:00:00Z"),
    updated_at: new Date("2024-01-01T10:00:00Z")
  },
  {
    config_type: "checkout",
    config_data: {
      layout: {
        steps: {
          show_progress: true,
          steps: ["購物車", "配送資訊", "付款方式", "確認訂單"]
        },
        payment_methods: {
          show_icons: true,
          default_method: "credit_card"
        },
        order_summary: {
          show_discount: true,
          show_shipping: true,
          show_tax: true
        }
      },
      components: [
        {
          type: "address_form",
          props: {
            auto_complete: true,
            validation: true,
            save_address: true
          }
        },
        {
          type: "payment_form",
          props: {
            secure_payment: true,
            save_card: false,
            show_installments: true
          }
        }
      ],
      styles: {
        form_spacing: "20px",
        button_style: "primary",
        input_border: "1px solid #ddd"
      },
      behaviors: {
        auto_save: true,
        form_validation: true,
        payment_processing: "async"
      }
    },
    version: "1.0.0",
    is_active: true,
    created_at: new Date("2024-01-01T11:00:00Z"),
    updated_at: new Date("2024-01-01T11:00:00Z")
  }
]);

// ==============================================
// 擴展系統日誌資料
// ==============================================

db.system_logs.insertMany([
  {
    level: "info",
    service: "payment",
    message: "支付處理完成",
    context: {
      user_id: 4,
      session_id: "sess_456789123",
      request_id: "req_004",
      ip_address: "192.168.1.101",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    },
    data: {
      order_id: 1004,
      amount: 4500.00,
      payment_method: "credit_card",
      transaction_id: "txn_456789123",
      processing_time: 2.5
    },
    timestamp: new Date("2024-01-02T09:00:00Z")
  },
  {
    level: "warn",
    service: "inventory",
    message: "商品庫存不足警告",
    context: {
      request_id: "req_005"
    },
    data: {
      product_id: 6,
      current_stock: 3,
      requested_quantity: 5,
      threshold: 10
    },
    timestamp: new Date("2024-01-02T09:30:00Z")
  },
  {
    level: "error",
    service: "recommendation",
    message: "推薦系統服務異常",
    context: {
      user_id: 5,
      session_id: "sess_789123456",
      request_id: "req_006"
    },
    data: {
      error_code: "REC_SERVICE_UNAVAILABLE",
      error_message: "Milvus connection timeout",
      retry_count: 3
    },
    timestamp: new Date("2024-01-02T10:00:00Z")
  },
  {
    level: "info",
    service: "api",
    message: "API請求處理完成",
    context: {
      user_id: 6,
      session_id: "sess_123456789",
      request_id: "req_007",
      ip_address: "192.168.1.102",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    data: {
      endpoint: "/api/products/search",
      method: "GET",
      response_time: 150,
      status_code: 200
    },
    timestamp: new Date("2024-01-02T10:30:00Z")
  },
  {
    level: "debug",
    service: "frontend",
    message: "頁面載入完成",
    context: {
      user_id: 7,
      session_id: "sess_456789123",
      request_id: "req_008"
    },
    data: {
      page_url: "/products/11",
      load_time: 1.2,
      resources_loaded: 15,
      cache_hit_rate: 0.85
    },
    timestamp: new Date("2024-01-02T11:00:00Z")
  }
]);

// ==============================================
// 擴展客服紀錄資料
// ==============================================

db.customer_service_records.insertMany([
  {
    ticket_id: "TICKET-003",
    user_id: 4,
    agent_id: 103,
    category: "product_question",
    priority: "medium",
    status: "resolved",
    messages: [
      {
        sender: "user",
        content: "請問SK-II青春露適合敏感肌膚使用嗎？",
        timestamp: new Date("2024-01-02T09:00:00Z"),
        attachments: []
      },
      {
        sender: "agent",
        content: "您好！SK-II青春露含有Pitera™精華，建議您先做過敏測試。我們可以為您提供小樣試用。",
        timestamp: new Date("2024-01-02T09:15:00Z"),
        attachments: []
      },
      {
        sender: "user",
        content: "好的，我想申請小樣試用。",
        timestamp: new Date("2024-01-02T09:20:00Z"),
        attachments: []
      },
      {
        sender: "agent",
        content: "已為您安排小樣試用，將在3-5個工作天內寄出。",
        timestamp: new Date("2024-01-02T09:25:00Z"),
        attachments: []
      }
    ],
    resolution: "提供小樣試用，解決用戶疑慮",
    satisfaction_rating: 5,
    created_at: new Date("2024-01-02T09:00:00Z"),
    updated_at: new Date("2024-01-02T09:25:00Z"),
    closed_at: new Date("2024-01-02T09:25:00Z")
  },
  {
    ticket_id: "TICKET-004",
    user_id: 5,
    agent_id: 104,
    category: "complaint",
    priority: "high",
    status: "in_progress",
    messages: [
      {
        sender: "user",
        content: "我收到的蘭蔻小黑瓶精華包裝有損壞，要求退貨！",
        timestamp: new Date("2024-01-02T10:00:00Z"),
        attachments: ["damage_photo_1.jpg"]
      },
      {
        sender: "agent",
        content: "非常抱歉造成您的不便！我立即為您處理退貨事宜。請提供訂單號碼。",
        timestamp: new Date("2024-01-02T10:05:00Z"),
        attachments: []
      },
      {
        sender: "user",
        content: "訂單號碼是1005，請盡快處理。",
        timestamp: new Date("2024-01-02T10:10:00Z"),
        attachments: []
      }
    ],
    resolution: "",
    satisfaction_rating: null,
    created_at: new Date("2024-01-02T10:00:00Z"),
    updated_at: new Date("2024-01-02T10:10:00Z"),
    closed_at: null
  },
  {
    ticket_id: "TICKET-005",
    user_id: 6,
    agent_id: 105,
    category: "technical_support",
    priority: "low",
    status: "resolved",
    messages: [
      {
        sender: "user",
        content: "網站上的商品圖片無法正常顯示，是什麼問題？",
        timestamp: new Date("2024-01-02T11:00:00Z"),
        attachments: []
      },
      {
        sender: "agent",
        content: "請您清除瀏覽器快取，或嘗試使用無痕模式瀏覽。如果問題持續，請提供您的瀏覽器版本。",
        timestamp: new Date("2024-01-02T11:10:00Z"),
        attachments: []
      },
      {
        sender: "user",
        content: "清除快取後問題解決了，謝謝！",
        timestamp: new Date("2024-01-02T11:20:00Z"),
        attachments: []
      }
    ],
    resolution: "清除瀏覽器快取解決問題",
    satisfaction_rating: 4,
    created_at: new Date("2024-01-02T11:00:00Z"),
    updated_at: new Date("2024-01-02T11:20:00Z"),
    closed_at: new Date("2024-01-02T11:20:00Z")
  }
]);

// 完成測試資料插入
print("MongoDB 測試資料插入完成！");
print("已插入擴展的測試資料");
print("商品詳細描述: " + db.products_detail.countDocuments() + " 筆");
print("前端配置: " + db.frontend_configs.countDocuments() + " 筆");
print("系統日誌: " + db.system_logs.countDocuments() + " 筆");
print("客服紀錄: " + db.customer_service_records.countDocuments() + " 筆");
