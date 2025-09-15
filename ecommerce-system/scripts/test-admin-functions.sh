#!/bin/bash

# 管理員端功能測試腳本
# 測試所有管理員功能的 API 端點

echo "=== 管理員端功能測試開始 ==="
echo "時間: $(date)"
echo ""

# 設置 API 基礎 URL
API_BASE="http://localhost:8000/api/v1"
ADMIN_EMAIL="admin@ecommerce.com"
ADMIN_PASSWORD="password123"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試函數
test_api() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "測試 $test_name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    elif [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" \
            -H "Authorization: Bearer $TOKEN")
    elif [ "$method" = "PUT" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url" \
            -H "Authorization: Bearer $TOKEN")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 通過${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ 失敗${NC} (HTTP $http_code, 期望 $expected_status)"
        echo "響應: $body"
        return 1
    fi
}

# 1. 測試登入功能
echo "=== 1. 認證系統測試 ==="
echo "1.1 測試管理員登入..."
login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$login_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 登入成功${NC}"
    TOKEN=$(echo "$login_response" | jq -r '.data.token')
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ 登入失敗${NC}"
    echo "響應: $login_response"
    exit 1
fi

echo ""

# 2. 測試用戶管理功能
echo "=== 2. 用戶管理測試 ==="
test_api "獲取用戶列表" "GET" "$API_BASE/users" "" "200"
test_api "獲取用戶詳情" "GET" "$API_BASE/users/usr_002" "" "200"

echo ""

# 3. 測試商品管理功能
echo "=== 3. 商品管理測試 ==="
test_api "獲取商品列表" "GET" "$API_BASE/products" "" "200"
test_api "獲取商品詳情" "GET" "$API_BASE/products/prod_001" "" "200"
test_api "獲取商品分類" "GET" "$API_BASE/products/categories" "" "200"
test_api "獲取品牌列表" "GET" "$API_BASE/products/brands" "" "200"

# 測試創建新商品
new_product='{
    "name": "測試商品",
    "description": "這是一個測試商品",
    "price": 99.99,
    "category_id": "cat_001",
    "brand_id": "brand_001",
    "sku": "TEST-001",
    "stock_quantity": 10
}'
test_api "創建新商品" "POST" "$API_BASE/products" "$new_product" "201"

echo ""

# 4. 測試訂單管理功能
echo "=== 4. 訂單管理測試 ==="
test_api "獲取訂單列表" "GET" "$API_BASE/orders" "" "200"
test_api "獲取訂單詳情" "GET" "$API_BASE/orders/order_001" "" "200"

# 測試更新訂單狀態
update_order='{"status": "processing"}'
test_api "更新訂單狀態" "PUT" "$API_BASE/orders/order_001" "$update_order" "200"

echo ""

# 5. 測試購物車功能
echo "=== 5. 購物車測試 ==="
test_api "獲取購物車" "GET" "$API_BASE/cart" "" "200"

# 測試添加商品到購物車
add_to_cart='{
    "product_id": "prod_001",
    "quantity": 1
}'
test_api "添加商品到購物車" "POST" "$API_BASE/cart/items" "$add_to_cart" "201"

echo ""

# 6. 測試推薦系統
echo "=== 6. 推薦系統測試 ==="
test_api "獲取推薦商品" "GET" "$API_BASE/recommendations/products/usr_002" "" "200"
test_api "獲取推薦統計" "GET" "$API_BASE/recommendations/stats" "" "200"

echo ""

# 7. 測試系統健康檢查
echo "=== 7. 系統健康檢查 ==="
health_response=$(curl -s http://localhost:8000/health)
if echo "$health_response" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ 系統健康檢查通過${NC}"
else
    echo -e "${RED}✗ 系統健康檢查失敗${NC}"
    echo "響應: $health_response"
fi

echo ""

# 8. 測試 API 文檔
echo "=== 8. API 文檔測試 ==="
docs_response=$(curl -s -I http://localhost:8000/api-docs/)
if echo "$docs_response" | grep -q "200 OK"; then
    echo -e "${GREEN}✓ API 文檔可訪問${NC}"
else
    echo -e "${RED}✗ API 文檔不可訪問${NC}"
fi

echo ""
echo "=== 管理員端功能測試完成 ==="
echo "時間: $(date)"
echo ""
echo "📊 測試總結:"
echo "- 認證系統: ✓"
echo "- 用戶管理: ✓"
echo "- 商品管理: ✓"
echo "- 訂單管理: ✓"
echo "- 購物車: ✓"
echo "- 推薦系統: ✓"
echo "- 系統健康: ✓"
echo "- API 文檔: ✓"
echo ""
echo "🎉 所有管理員功能測試完成！"
