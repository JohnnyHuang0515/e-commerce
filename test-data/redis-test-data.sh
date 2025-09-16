#!/bin/bash
# Redis 電商系統測試資料
# 擴展現有初始化腳本的測試資料

echo "開始插入 Redis 擴展測試資料..."

# Redis 連線設定
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-redis_password}

# Redis CLI 命令
REDIS_CLI="redis-cli -h $REDIS_HOST -p $REDIS_PORT"

if [ ! -z "$REDIS_PASSWORD" ]; then
    REDIS_CLI="$REDIS_CLI -a $REDIS_PASSWORD"
fi

# 測試 Redis 連線
echo "測試 Redis 連線..."
$REDIS_CLI ping || {
    echo "錯誤: 無法連接到 Redis 伺服器"
    exit 1
}

echo "Redis 連線成功！"

# ==============================================
# 擴展 Session 管理資料
# ==============================================

echo "插入擴展 Session 資料..."

# 更多測試 Session
$REDIS_CLI SETEX "session:sess_456789123" 86400 '{
  "user_id": 4,
  "login_time": "2024-01-02T09:00:00Z",
  "last_activity": "2024-01-02T09:30:00Z",
  "permissions": ["read", "write", "admin"],
  "cart_items": [{"product_id": 6, "quantity": 1}],
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "ip_address": "192.168.1.101"
}'

$REDIS_CLI SETEX "session:sess_789123456" 86400 '{
  "user_id": 5,
  "login_time": "2024-01-02T10:00:00Z",
  "last_activity": "2024-01-02T10:15:00Z",
  "permissions": ["read", "write"],
  "cart_items": [{"product_id": 7, "quantity": 1}, {"product_id": 8, "quantity": 2}],
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "ip_address": "192.168.1.102"
}'

$REDIS_CLI SETEX "session:sess_123456789" 86400 '{
  "user_id": 6,
  "login_time": "2024-01-02T11:00:00Z",
  "last_activity": "2024-01-02T11:20:00Z",
  "permissions": ["read"],
  "cart_items": [],
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
  "ip_address": "192.168.1.103"
}'

echo "Session 資料插入完成"

# ==============================================
# 擴展 JWT Token 管理資料
# ==============================================

echo "插入擴展 JWT Token 資料..."

# 更多測試 JWT Token
$REDIS_CLI SETEX "jwt:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJlbWFpbCI6ImNoZW4ueGlhb21pbmdAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDQxMTIwMDAsImV4cCI6MTcwNDExNTYwMH0" 3600 '{
  "user_id": 4,
  "email": "chen.xiaoming@example.com",
  "issued_at": "2024-01-02T09:00:00Z",
  "expires_at": "2024-01-02T10:00:00Z",
  "blacklisted": false,
  "token_type": "access"
}'

$REDIS_CLI SETEX "jwt:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1LCJlbWFpbCI6Imxpbi54aWFvaHVhQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA0MTE1NjAwLCJleHAiOjE3MDQxMTkyMDB9" 3600 '{
  "user_id": 5,
  "email": "lin.xiaohua@example.com",
  "issued_at": "2024-01-02T10:00:00Z",
  "expires_at": "2024-01-02T11:00:00Z",
  "blacklisted": false,
  "token_type": "access"
}'

$REDIS_CLI SETEX "jwt:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2LCJlbWFpbCI6IndhbmcueGlhb21laUBleGFtcGxlLmNvbSIsImlhdCI6MTcwNDEyMzIwMCwiZXhwIjoxNzA0MTI2ODAwfQ" 3600 '{
  "user_id": 6,
  "email": "wang.xiaomei@example.com",
  "issued_at": "2024-01-02T11:00:00Z",
  "expires_at": "2024-01-02T12:00:00Z",
  "blacklisted": false,
  "token_type": "access"
}'

echo "JWT Token 資料插入完成"

# ==============================================
# 擴展購物車快取資料
# ==============================================

echo "插入擴展購物車資料..."

# 更多測試購物車
$REDIS_CLI SETEX "cart:4" 604800 '{
  "items": [
    {
      "product_id": 6,
      "product_name": "SK-II 青春露",
      "price": 4500.00,
      "quantity": 1,
      "subtotal": 4500.00
    }
  ],
  "total_amount": 4500.00,
  "updated_at": "2024-01-02T09:00:00Z",
  "coupon_code": "BEAUTY15",
  "discount_amount": 675.00,
  "final_amount": 3825.00
}'

$REDIS_CLI SETEX "cart:5" 604800 '{
  "items": [
    {
      "product_id": 7,
      "product_name": "蘭蔻小黑瓶精華",
      "price": 3200.00,
      "quantity": 1,
      "subtotal": 3200.00
    },
    {
      "product_id": 8,
      "product_name": "雅詩蘭黛小棕瓶",
      "price": 2800.00,
      "quantity": 2,
      "subtotal": 5600.00
    }
  ],
  "total_amount": 8800.00,
  "updated_at": "2024-01-02T10:00:00Z",
  "coupon_code": null,
  "discount_amount": 0.00,
  "final_amount": 8800.00
}'

$REDIS_CLI SETEX "cart:6" 604800 '{
  "items": [
    {
      "product_id": 9,
      "product_name": "MAC 口紅",
      "price": 850.00,
      "quantity": 1,
      "subtotal": 850.00
    }
  ],
  "total_amount": 850.00,
  "updated_at": "2024-01-02T11:00:00Z",
  "coupon_code": "NEWUSER20",
  "discount_amount": 170.00,
  "final_amount": 680.00
}'

echo "購物車資料插入完成"

# ==============================================
# 擴展熱門商品快取資料
# ==============================================

echo "插入擴展熱門商品資料..."

# 美妝保養分類熱門商品
$REDIS_CLI SETEX "popular_products:6:daily" 3600 '[
  {
    "product_id": 6,
    "name": "SK-II 青春露",
    "price": 4500.00,
    "sales_count": 25,
    "view_count": 500
  },
  {
    "product_id": 7,
    "name": "蘭蔻小黑瓶精華",
    "price": 3200.00,
    "sales_count": 18,
    "view_count": 350
  },
  {
    "product_id": 8,
    "name": "雅詩蘭黛小棕瓶",
    "price": 2800.00,
    "sales_count": 22,
    "view_count": 400
  }
]'

# 食品飲料分類熱門商品
$REDIS_CLI SETEX "popular_products:7:daily" 3600 '[
  {
    "product_id": 11,
    "name": "日本進口零食禮盒",
    "price": 1200.00,
    "sales_count": 15,
    "view_count": 200
  },
  {
    "product_id": 12,
    "name": "台灣高山茶葉",
    "price": 800.00,
    "sales_count": 12,
    "view_count": 150
  },
  {
    "product_id": 13,
    "name": "維他命C發泡錠",
    "price": 450.00,
    "sales_count": 20,
    "view_count": 300
  }
]'

# 寵物用品分類熱門商品
$REDIS_CLI SETEX "popular_products:8:daily" 3600 '[
  {
    "product_id": 14,
    "name": "皇家狗糧",
    "price": 1200.00,
    "sales_count": 30,
    "view_count": 250
  },
  {
    "product_id": 15,
    "name": "貓砂",
    "price": 350.00,
    "sales_count": 25,
    "view_count": 180
  },
  {
    "product_id": 16,
    "name": "魚缸過濾器",
    "price": 800.00,
    "sales_count": 8,
    "view_count": 120
  }
]'

echo "熱門商品資料插入完成"

# ==============================================
# 擴展商品庫存快取資料
# ==============================================

echo "插入擴展庫存資料..."

# 更多商品庫存
$REDIS_CLI SETEX "stock:6" 300 '{
  "available_quantity": 30,
  "reserved_quantity": 5,
  "last_updated": "2024-01-02T09:00:00Z",
  "low_stock_threshold": 10,
  "status": "in_stock"
}'

$REDIS_CLI SETEX "stock:7" 300 '{
  "available_quantity": 25,
  "reserved_quantity": 3,
  "last_updated": "2024-01-02T10:00:00Z",
  "low_stock_threshold": 10,
  "status": "in_stock"
}'

$REDIS_CLI SETEX "stock:8" 300 '{
  "available_quantity": 40,
  "reserved_quantity": 8,
  "last_updated": "2024-01-02T11:00:00Z",
  "low_stock_threshold": 10,
  "status": "in_stock"
}'

$REDIS_CLI SETEX "stock:9" 300 '{
  "available_quantity": 100,
  "reserved_quantity": 12,
  "last_updated": "2024-01-02T12:00:00Z",
  "low_stock_threshold": 20,
  "status": "in_stock"
}'

$REDIS_CLI SETEX "stock:11" 300 '{
  "available_quantity": 80,
  "reserved_quantity": 15,
  "last_updated": "2024-01-02T13:00:00Z",
  "low_stock_threshold": 20,
  "status": "in_stock"
}'

echo "庫存資料插入完成"

# ==============================================
# 擴展用戶行為快取資料
# ==============================================

echo "插入擴展用戶行為資料..."

# 更多用戶瀏覽歷史
$REDIS_CLI SETEX "user_history:4" 86400 '[
  {"product_id": 6, "viewed_at": "2024-01-02T09:00:00Z", "duration": 200},
  {"product_id": 7, "viewed_at": "2024-01-02T09:05:00Z", "duration": 150},
  {"product_id": 8, "viewed_at": "2024-01-02T09:10:00Z", "duration": 180}
]'

$REDIS_CLI SETEX "user_history:5" 86400 '[
  {"product_id": 7, "viewed_at": "2024-01-02T10:00:00Z", "duration": 220},
  {"product_id": 8, "viewed_at": "2024-01-02T10:05:00Z", "duration": 190},
  {"product_id": 9, "viewed_at": "2024-01-02T10:10:00Z", "duration": 160}
]'

$REDIS_CLI SETEX "user_history:6" 86400 '[
  {"product_id": 9, "viewed_at": "2024-01-02T11:00:00Z", "duration": 120},
  {"product_id": 10, "viewed_at": "2024-01-02T11:05:00Z", "duration": 140},
  {"product_id": 11, "viewed_at": "2024-01-02T11:10:00Z", "duration": 170}
]'

# 擴展搜尋關鍵字快取
$REDIS_CLI SETEX "search_keywords:popular" 3600 '[
  {"keyword": "SK-II", "count": 150},
  {"keyword": "蘭蔻", "count": 120},
  {"keyword": "MAC", "count": 100},
  {"keyword": "日本零食", "count": 80},
  {"keyword": "狗糧", "count": 90},
  {"keyword": "行車記錄器", "count": 70},
  {"keyword": "登山背包", "count": 60},
  {"keyword": "露營帳篷", "count": 50}
]'

echo "用戶行為資料插入完成"

# ==============================================
# 擴展系統配置快取資料
# ==============================================

echo "插入擴展系統配置資料..."

# 擴展網站設定
$REDIS_CLI SETEX "config:site" 86400 '{
  "site_name": "電商平台",
  "site_url": "https://ecommerce.example.com",
  "currency": "TWD",
  "timezone": "Asia/Taipei",
  "maintenance_mode": false,
  "version": "1.2.0",
  "features": {
    "recommendation": true,
    "wishlist": true,
    "comparison": true,
    "reviews": true
  }
}'

# 擴展支付設定
$REDIS_CLI SETEX "config:payment" 86400 '{
  "enabled_methods": ["credit_card", "bank_transfer", "convenience_store", "digital_wallet"],
  "default_method": "credit_card",
  "currency": "TWD",
  "min_amount": 100,
  "max_amount": 100000,
  "processing_fee": 0.02,
  "installment_options": [3, 6, 12, 24]
}'

# 擴展物流設定
$REDIS_CLI SETEX "config:shipping" 86400 '{
  "enabled_carriers": ["post_office", "convenience_store", "home_delivery", "express"],
  "free_shipping_threshold": 1000,
  "default_carrier": "post_office",
  "processing_days": 1,
  "delivery_times": {
    "post_office": "2-3天",
    "convenience_store": "1-2天",
    "home_delivery": "1-2天",
    "express": "當日"
  }
}'

# 新增行銷設定
$REDIS_CLI SETEX "config:marketing" 86400 '{
  "enabled_campaigns": ["new_user", "seasonal", "flash_sale"],
  "default_discount": 0.1,
  "max_discount": 0.5,
  "coupon_expiry_days": 30,
  "referral_bonus": 100
}'

echo "系統配置資料插入完成"

# ==============================================
# 擴展限流與安全快取資料
# ==============================================

echo "插入擴展限流與安全資料..."

# 更多 API 限流設定
$REDIS_CLI SETEX "rate_limit:api:4" 3600 "150"  # 用戶4每小時150次請求
$REDIS_CLI SETEX "rate_limit:api:5" 3600 "120"  # 用戶5每小時120次請求
$REDIS_CLI SETEX "rate_limit:api:6" 3600 "100"  # 用戶6每小時100次請求

# 更多登入失敗計數
$REDIS_CLI SETEX "login_attempts:192.168.1.101" 3600 "0"  # IP登入失敗次數
$REDIS_CLI SETEX "login_attempts:192.168.1.102" 3600 "0"  # IP登入失敗次數
$REDIS_CLI SETEX "login_attempts:chen.xiaoming@example.com" 3600 "0"  # 用戶登入失敗次數
$REDIS_CLI SETEX "login_attempts:lin.xiaohua@example.com" 3600 "0"  # 用戶登入失敗次數

# 更多驗證碼快取
$REDIS_CLI SETEX "captcha:456789123" 300 "EFGH"  # 驗證碼ID對應驗證碼
$REDIS_CLI SETEX "captcha:789123456" 300 "IJKL"  # 驗證碼ID對應驗證碼
$REDIS_CLI SETEX "captcha:123456789" 300 "MNOP"  # 驗證碼ID對應驗證碼

echo "限流與安全資料插入完成"

# ==============================================
# 擴展推薦系統快取資料
# ==============================================

echo "插入擴展推薦系統資料..."

# 用戶推薦快取
$REDIS_CLI SETEX "recommendations:4" 3600 '[
  {"product_id": 7, "score": 0.95, "reason": "similar_users"},
  {"product_id": 8, "score": 0.87, "reason": "content_based"},
  {"product_id": 9, "score": 0.82, "reason": "collaborative_filtering"}
]'

$REDIS_CLI SETEX "recommendations:5" 3600 '[
  {"product_id": 6, "score": 0.91, "reason": "similar_users"},
  {"product_id": 8, "score": 0.85, "reason": "content_based"},
  {"product_id": 10, "score": 0.78, "reason": "collaborative_filtering"}
]'

$REDIS_CLI SETEX "recommendations:6" 3600 '[
  {"product_id": 9, "score": 0.88, "reason": "similar_users"},
  {"product_id": 10, "score": 0.83, "reason": "content_based"},
  {"product_id": 11, "score": 0.79, "reason": "collaborative_filtering"}
]'

# 商品相似度快取
$REDIS_CLI SETEX "similar_products:6" 3600 '[
  {"product_id": 7, "similarity": 0.85},
  {"product_id": 8, "similarity": 0.78},
  {"product_id": 9, "similarity": 0.72}
]'

$REDIS_CLI SETEX "similar_products:7" 3600 '[
  {"product_id": 6, "similarity": 0.85},
  {"product_id": 8, "similarity": 0.82},
  {"product_id": 9, "similarity": 0.75}
]'

echo "推薦系統資料插入完成"

# ==============================================
# 驗證插入結果
# ==============================================

echo "驗證插入結果..."

# 檢查關鍵資料是否存在
echo "檢查 Session 資料..."
$REDIS_CLI EXISTS "session:sess_456789123"

echo "檢查購物車資料..."
$REDIS_CLI EXISTS "cart:4"

echo "檢查熱門商品資料..."
$REDIS_CLI EXISTS "popular_products:6:daily"

echo "檢查庫存資料..."
$REDIS_CLI EXISTS "stock:6"

echo "檢查系統配置..."
$REDIS_CLI EXISTS "config:site"

echo "檢查推薦資料..."
$REDIS_CLI EXISTS "recommendations:4"

# 顯示 Redis 資訊
echo "Redis 記憶體使用情況:"
$REDIS_CLI INFO memory | grep used_memory_human

echo "Redis 鍵值數量:"
$REDIS_CLI DBSIZE

echo ""
echo "=============================================="
echo "Redis 擴展測試資料插入完成！"
echo "=============================================="
echo "已插入的擴展快取類型:"
echo "- 擴展 Session 管理 (session:*)"
echo "- 擴展 JWT Token 管理 (jwt:*)"
echo "- 擴展購物車快取 (cart:*)"
echo "- 擴展熱門商品快取 (popular_products:*)"
echo "- 擴展商品庫存快取 (stock:*)"
echo "- 擴展用戶行為快取 (user_history:*)"
echo "- 擴展系統配置快取 (config:*)"
echo "- 擴展限流與安全快取 (rate_limit:*, login_attempts:*)"
echo "- 擴展推薦系統快取 (recommendations:*, similar_products:*)"
echo ""
echo "Redis 連線資訊:"
echo "Host: $REDIS_HOST"
echo "Port: $REDIS_PORT"
echo "=============================================="
