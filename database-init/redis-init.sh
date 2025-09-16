#!/bin/bash
# Redis 電商系統初始化腳本
# 快取與 Session 管理：熱門商品、購物車、JWT Token

echo "開始初始化 Redis 電商系統..."

# Redis 連線設定
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}

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
# 5.1 Session 管理初始化
# ==============================================

echo "初始化 Session 管理..."

# 建立測試 Session 資料
$REDIS_CLI SETEX "session:sess_123456789" 86400 '{
  "user_id": 1,
  "login_time": "2024-01-01T10:00:00Z",
  "last_activity": "2024-01-01T10:30:00Z",
  "permissions": ["read", "write"],
  "cart_items": [{"product_id": 1, "quantity": 2}]
}'

$REDIS_CLI SETEX "session:sess_987654321" 86400 '{
  "user_id": 2,
  "login_time": "2024-01-01T11:00:00Z",
  "last_activity": "2024-01-01T11:15:00Z",
  "permissions": ["read"],
  "cart_items": []
}'

echo "Session 管理初始化完成"

# ==============================================
# 5.2 JWT Token 管理初始化
# ==============================================

echo "初始化 JWT Token 管理..."

# 建立測試 JWT Token 資料
$REDIS_CLI SETEX "jwt:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" 3600 '{
  "user_id": 1,
  "issued_at": "2024-01-01T10:00:00Z",
  "expires_at": "2024-01-01T11:00:00Z",
  "blacklisted": false
}'

$REDIS_CLI SETEX "jwt:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ8" 3600 '{
  "user_id": 2,
  "issued_at": "2024-01-01T11:00:00Z",
  "expires_at": "2024-01-01T12:00:00Z",
  "blacklisted": false
}'

echo "JWT Token 管理初始化完成"

# ==============================================
# 5.3 購物車快取初始化
# ==============================================

echo "初始化購物車快取..."

# 建立測試購物車資料
$REDIS_CLI SETEX "cart:1" 604800 '{
  "items": [
    {
      "product_id": 1,
      "product_name": "iPhone 15 Pro",
      "price": 999.00,
      "quantity": 2,
      "subtotal": 1998.00
    },
    {
      "product_id": 3,
      "product_name": "AirPods Pro",
      "price": 249.00,
      "quantity": 1,
      "subtotal": 249.00
    }
  ],
  "total_amount": 2247.00,
  "updated_at": "2024-01-01T10:00:00Z"
}'

$REDIS_CLI SETEX "cart:2" 604800 '{
  "items": [
    {
      "product_id": 2,
      "product_name": "MacBook Pro M3",
      "price": 1999.00,
      "quantity": 1,
      "subtotal": 1999.00
    }
  ],
  "total_amount": 1999.00,
  "updated_at": "2024-01-01T11:00:00Z"
}'

echo "購物車快取初始化完成"

# ==============================================
# 5.4 熱門商品快取初始化
# ==============================================

echo "初始化熱門商品快取..."

# 電子產品分類熱門商品
$REDIS_CLI SETEX "popular_products:1:daily" 3600 '[
  {
    "product_id": 1,
    "name": "iPhone 15 Pro",
    "price": 999.00,
    "sales_count": 150,
    "view_count": 2000
  },
  {
    "product_id": 2,
    "name": "MacBook Pro M3",
    "price": 1999.00,
    "sales_count": 75,
    "view_count": 1200
  },
  {
    "product_id": 3,
    "name": "AirPods Pro",
    "price": 249.00,
    "sales_count": 200,
    "view_count": 1800
  }
]'

# 服飾分類熱門商品
$REDIS_CLI SETEX "popular_products:2:daily" 3600 '[
  {
    "product_id": 4,
    "name": "Nike Air Max",
    "price": 120.00,
    "sales_count": 80,
    "view_count": 900
  },
  {
    "product_id": 5,
    "name": "Adidas T-Shirt",
    "price": 29.99,
    "sales_count": 120,
    "view_count": 1100
  }
]'

# 全站熱門商品
$REDIS_CLI SETEX "popular_products:all:weekly" 86400 '[
  {
    "product_id": 1,
    "name": "iPhone 15 Pro",
    "price": 999.00,
    "sales_count": 1050,
    "view_count": 14000
  },
  {
    "product_id": 3,
    "name": "AirPods Pro",
    "price": 249.00,
    "sales_count": 1400,
    "view_count": 12600
  },
  {
    "product_id": 2,
    "name": "MacBook Pro M3",
    "price": 1999.00,
    "sales_count": 525,
    "view_count": 8400
  }
]'

echo "熱門商品快取初始化完成"

# ==============================================
# 5.5 商品庫存快取初始化
# ==============================================

echo "初始化商品庫存快取..."

# 建立商品庫存快取
$REDIS_CLI SETEX "stock:1" 300 '{
  "available_quantity": 50,
  "reserved_quantity": 10,
  "last_updated": "2024-01-01T10:00:00Z"
}'

$REDIS_CLI SETEX "stock:2" 300 '{
  "available_quantity": 25,
  "reserved_quantity": 5,
  "last_updated": "2024-01-01T10:00:00Z"
}'

$REDIS_CLI SETEX "stock:3" 300 '{
  "available_quantity": 100,
  "reserved_quantity": 15,
  "last_updated": "2024-01-01T10:00:00Z"
}'

$REDIS_CLI SETEX "stock:4" 300 '{
  "available_quantity": 200,
  "reserved_quantity": 20,
  "last_updated": "2024-01-01T10:00:00Z"
}'

$REDIS_CLI SETEX "stock:5" 300 '{
  "available_quantity": 150,
  "reserved_quantity": 8,
  "last_updated": "2024-01-01T10:00:00Z"
}'

echo "商品庫存快取初始化完成"

# ==============================================
# 5.6 用戶行為快取初始化
# ==============================================

echo "初始化用戶行為快取..."

# 用戶瀏覽歷史
$REDIS_CLI SETEX "user_history:1" 86400 '[
  {"product_id": 1, "viewed_at": "2024-01-01T10:00:00Z", "duration": 120},
  {"product_id": 3, "viewed_at": "2024-01-01T10:05:00Z", "duration": 90},
  {"product_id": 2, "viewed_at": "2024-01-01T10:10:00Z", "duration": 180}
]'

$REDIS_CLI SETEX "user_history:2" 86400 '[
  {"product_id": 2, "viewed_at": "2024-01-01T11:00:00Z", "duration": 200},
  {"product_id": 4, "viewed_at": "2024-01-01T11:05:00Z", "duration": 150}
]'

# 搜尋關鍵字快取
$REDIS_CLI SETEX "search_keywords:popular" 3600 '[
  {"keyword": "iPhone", "count": 500},
  {"keyword": "MacBook", "count": 300},
  {"keyword": "AirPods", "count": 400},
  {"keyword": "Nike", "count": 200},
  {"keyword": "Adidas", "count": 150}
]'

echo "用戶行為快取初始化完成"

# ==============================================
# 5.7 系統配置快取初始化
# ==============================================

echo "初始化系統配置快取..."

# 網站設定
$REDIS_CLI SETEX "config:site" 86400 '{
  "site_name": "電商平台",
  "site_url": "https://ecommerce.example.com",
  "currency": "TWD",
  "timezone": "Asia/Taipei",
  "maintenance_mode": false
}'

# 支付設定
$REDIS_CLI SETEX "config:payment" 86400 '{
  "enabled_methods": ["credit_card", "bank_transfer", "convenience_store"],
  "default_method": "credit_card",
  "currency": "TWD",
  "min_amount": 100,
  "max_amount": 100000
}'

# 物流設定
$REDIS_CLI SETEX "config:shipping" 86400 '{
  "enabled_carriers": ["post_office", "convenience_store", "home_delivery"],
  "free_shipping_threshold": 1000,
  "default_carrier": "post_office",
  "processing_days": 1
}'

echo "系統配置快取初始化完成"

# ==============================================
# 5.8 限流與安全快取初始化
# ==============================================

echo "初始化限流與安全快取..."

# API 限流設定
$REDIS_CLI SETEX "rate_limit:api:1" 3600 "100"  # 用戶1每小時100次請求
$REDIS_CLI SETEX "rate_limit:api:2" 3600 "100"  # 用戶2每小時100次請求

# 登入失敗計數
$REDIS_CLI SETEX "login_attempts:192.168.1.100" 3600 "0"  # IP登入失敗次數
$REDIS_CLI SETEX "login_attempts:zhang.san@example.com" 3600 "0"  # 用戶登入失敗次數

# 驗證碼快取
$REDIS_CLI SETEX "captcha:123456789" 300 "ABCD"  # 驗證碼ID對應驗證碼

echo "限流與安全快取初始化完成"

# ==============================================
# 5.9 Redis 配置優化
# ==============================================

echo "設定 Redis 配置優化..."

# 設定記憶體淘汰策略
$REDIS_CLI CONFIG SET maxmemory-policy allkeys-lru

# 設定最大記憶體使用量 (1GB)
$REDIS_CLI CONFIG SET maxmemory 1gb

# 啟用壓縮
$REDIS_CLI CONFIG SET hash-max-ziplist-entries 512
$REDIS_CLI CONFIG SET hash-max-ziplist-value 64

# 設定持久化
$REDIS_CLI CONFIG SET save "900 1 300 10 60 10000"

echo "Redis 配置優化完成"

# ==============================================
# 驗證初始化結果
# ==============================================

echo "驗證初始化結果..."

# 檢查關鍵資料是否存在
echo "檢查 Session 資料..."
$REDIS_CLI EXISTS "session:sess_123456789"

echo "檢查購物車資料..."
$REDIS_CLI EXISTS "cart:1"

echo "檢查熱門商品資料..."
$REDIS_CLI EXISTS "popular_products:all:weekly"

echo "檢查庫存資料..."
$REDIS_CLI EXISTS "stock:1"

echo "檢查系統配置..."
$REDIS_CLI EXISTS "config:site"

# 顯示 Redis 資訊
echo "Redis 記憶體使用情況:"
$REDIS_CLI INFO memory | grep used_memory_human

echo "Redis 鍵值數量:"
$REDIS_CLI DBSIZE

echo ""
echo "=============================================="
echo "Redis 電商系統初始化完成！"
echo "=============================================="
echo "已建立的快取類型:"
echo "- Session 管理 (session:*)"
echo "- JWT Token 管理 (jwt:*)"
echo "- 購物車快取 (cart:*)"
echo "- 熱門商品快取 (popular_products:*)"
echo "- 商品庫存快取 (stock:*)"
echo "- 用戶行為快取 (user_history:*)"
echo "- 系統配置快取 (config:*)"
echo "- 限流與安全快取 (rate_limit:*, login_attempts:*)"
echo ""
echo "Redis 連線資訊:"
echo "Host: $REDIS_HOST"
echo "Port: $REDIS_PORT"
echo "=============================================="
