#!/bin/bash
# 電商系統測試資料驗證腳本
# 驗證所有資料庫的測試資料完整性和正確性

echo "🔍 開始驗證電商系統測試資料..."
echo "=" * 50

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 計數器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 檢查函數
check_result() {
    local test_name=$1
    local result=$2
    local expected=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$result" = "$expected" ]; then
        echo -e "${GREEN}✅ $test_name: 通過${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ $test_name: 失敗 (期望: $expected, 實際: $result)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# PostgreSQL 驗證
validate_postgresql() {
    echo -e "${BLUE}📊 驗證 PostgreSQL 測試資料...${NC}"
    
    # 檢查用戶數量
    user_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 用戶數量" "$user_count" "13"
    
    # 檢查商品數量
    product_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 商品數量" "$product_count" "25"
    
    # 檢查分類數量
    category_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 分類數量" "$category_count" "18"
    
    # 檢查訂單數量
    order_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM orders;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 訂單數量" "$order_count" "10"
    
    # 檢查支付數量
    payment_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM payments;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 支付數量" "$payment_count" "10"
    
    # 檢查評論數量
    review_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM reviews;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 評論數量" "$review_count" "10"
    
    # 檢查優惠券數量
    coupon_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM coupons;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 優惠券數量" "$coupon_count" "6"
    
    # 檢查退貨數量
    return_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM return_requests;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 退貨數量" "$return_count" "3"
    
    # 檢查用戶行為事件數量
    event_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM user_events;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 用戶行為事件數量" "$event_count" "10"
    
    # 檢查推薦數量
    recommendation_count=$(docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -t -c "SELECT COUNT(*) FROM recommendations;" 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 推薦數量" "$recommendation_count" "10"
}

# MongoDB 驗證
validate_mongodb() {
    echo -e "${BLUE}📊 驗證 MongoDB 測試資料...${NC}"
    
    # 檢查商品詳情數量
    product_detail_count=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.products_detail.countDocuments()" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB 商品詳情數量" "$product_detail_count" "8"
    
    # 檢查前端配置數量
    frontend_config_count=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.frontend_configs.countDocuments()" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB 前端配置數量" "$frontend_config_count" "3"
    
    # 檢查系統日誌數量
    system_log_count=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.system_logs.countDocuments()" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB 系統日誌數量" "$system_log_count" "8"
    
    # 檢查客服紀錄數量
    customer_service_count=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.customer_service_records.countDocuments()" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB 客服紀錄數量" "$customer_service_count" "5"
    
    # 檢查特定商品詳情
    sk2_exists=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.products_detail.findOne({product_pg_id: 6}) ? 'exists' : 'not_found'" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB SK-II 商品詳情" "$sk2_exists" "exists"
    
    # 檢查特定前端配置
    category_page_exists=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.frontend_configs.findOne({config_type: 'category_page'}) ? 'exists' : 'not_found'" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB 分類頁面配置" "$category_page_exists" "exists"
}

# Redis 驗證
validate_redis() {
    echo -e "${BLUE}📊 驗證 Redis 測試資料...${NC}"
    
    # 檢查總鍵值數量
    total_keys=$(docker-compose exec -T redis redis-cli DBSIZE 2>/dev/null | tr -d ' \n')
    if [ "$total_keys" -gt "50" ]; then
        echo -e "${GREEN}✅ Redis 總鍵值數量: 通過 (>50)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Redis 總鍵值數量: 失敗 (期望: >50, 實際: $total_keys)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # 檢查Session數量
    session_count=$(docker-compose exec -T redis redis-cli KEYS "session:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis Session 數量" "$session_count" "6"
    
    # 檢查購物車數量
    cart_count=$(docker-compose exec -T redis redis-cli KEYS "cart:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis 購物車數量" "$cart_count" "6"
    
    # 檢查JWT Token數量
    jwt_count=$(docker-compose exec -T redis redis-cli KEYS "jwt:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis JWT Token 數量" "$jwt_count" "6"
    
    # 檢查熱門商品數量
    popular_count=$(docker-compose exec -T redis redis-cli KEYS "popular_products:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis 熱門商品數量" "$popular_count" "6"
    
    # 檢查庫存快取數量
    stock_count=$(docker-compose exec -T redis redis-cli KEYS "stock:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis 庫存快取數量" "$stock_count" "10"
    
    # 檢查推薦數量
    recommendation_count=$(docker-compose exec -T redis redis-cli KEYS "recommendations:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis 推薦數量" "$recommendation_count" "6"
    
    # 檢查系統配置數量
    config_count=$(docker-compose exec -T redis redis-cli KEYS "config:*" 2>/dev/null | wc -l | tr -d ' \n')
    check_result "Redis 系統配置數量" "$config_count" "4"
}

# MinIO 驗證
validate_minio() {
    echo -e "${BLUE}📊 驗證 MinIO 測試資料...${NC}"
    
    # 檢查商品圖片目錄
    product_images=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/products/6/main/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO SK-II 商品圖片" "$product_images" "1"
    
    # 檢查用戶頭像目錄
    user_avatars=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/users/4/avatars/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO 用戶頭像" "$user_avatars" "1"
    
    # 檢查發票目錄
    invoices=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/orders/1004/invoices/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO 訂單發票" "$invoices" "1"
    
    # 檢查退貨證明目錄
    return_proofs=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/returns/2/proof_images/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO 退貨證明" "$return_proofs" "1"
    
    # 檢查系統橫幅目錄
    banners=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/system/banners/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO 系統橫幅" "$banners" "3"
    
    # 檢查分類圖片目錄
    category_images=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/system/categories/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO 分類圖片" "$category_images" "4"
    
    # 檢查商品影片目錄
    product_videos=$(docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/products/6/videos/ 2>/dev/null | wc -l | tr -d ' \n')
    check_result "MinIO 商品影片" "$product_videos" "1"
}

# Milvus 驗證
validate_milvus() {
    echo -e "${BLUE}📊 驗證 Milvus 測試資料...${NC}"
    
    # 檢查集合數量
    collection_count=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    collections = utility.list_collections()
    print(len(collections))
except:
    print('0')
" 2>/dev/null | tr -d ' \n')
    
    if [ "$collection_count" -ge "6" ]; then
        echo -e "${GREEN}✅ Milvus 集合數量: 通過 (>=6)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Milvus 集合數量: 失敗 (期望: >=6, 實際: $collection_count)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # 檢查商品向量集合
    product_vectors_exists=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    exists = utility.has_collection('product_vectors')
    print('exists' if exists else 'not_found')
except:
    print('not_found')
" 2>/dev/null | tr -d ' \n')
    check_result "Milvus 商品向量集合" "$product_vectors_exists" "exists"
    
    # 檢查用戶向量集合
    user_vectors_exists=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    exists = utility.has_collection('user_vectors')
    print('exists' if exists else 'not_found')
except:
    print('not_found')
" 2>/dev/null | tr -d ' \n')
    check_result "Milvus 用戶向量集合" "$user_vectors_exists" "exists"
    
    # 檢查搜尋歷史集合
    search_history_exists=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    exists = utility.has_collection('search_history')
    print('exists' if exists else 'not_found')
except:
    print('not_found')
" 2>/dev/null | tr -d ' \n')
    check_result "Milvus 搜尋歷史集合" "$search_history_exists" "exists"
    
    # 檢查推薦集合
    recommendations_exists=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    exists = utility.has_collection('recommendations')
    print('exists' if exists else 'not_found')
except:
    print('not_found')
" 2>/dev/null | tr -d ' \n')
    check_result "Milvus 推薦集合" "$recommendations_exists" "exists"
    
    # 檢查用戶行為集合
    user_behavior_exists=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    exists = utility.has_collection('user_behavior')
    print('exists' if exists else 'not_found')
except:
    print('not_found')
" 2>/dev/null | tr -d ' \n')
    check_result "Milvus 用戶行為集合" "$user_behavior_exists" "exists"
    
    # 檢查商品相似度集合
    product_similarity_exists=$(docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, utility
try:
    connections.connect('default', host='localhost', port='19530')
    exists = utility.has_collection('product_similarity')
    print('exists' if exists else 'not_found')
except:
    print('not_found')
" 2>/dev/null | tr -d ' \n')
    check_result "Milvus 商品相似度集合" "$product_similarity_exists" "exists"
}

# ClickHouse 驗證
validate_clickhouse() {
    echo -e "${BLUE}📊 驗證 ClickHouse 測試資料...${NC}"
    
    # 檢查用戶行為事件數量
    behavior_events_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM user_behavior_events" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 用戶行為事件數量" "$behavior_events_count" "20"
    
    # 檢查銷售數據數量
    sales_data_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM sales_data" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 銷售數據數量" "$sales_data_count" "16"
    
    # 檢查商品表現數量
    product_performance_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM product_performance" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 商品表現數量" "$product_performance_count" "15"
    
    # 檢查用戶分析數量
    user_analytics_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM user_analytics" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 用戶分析數量" "$user_analytics_count" "9"
    
    # 檢查行銷活動數量
    marketing_campaigns_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM marketing_campaigns" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 行銷活動數量" "$marketing_campaigns_count" "5"
    
    # 檢查行銷效果數量
    marketing_effectiveness_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM marketing_effectiveness" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 行銷效果數量" "$marketing_effectiveness_count" "10"
    
    # 檢查庫存分析數量
    inventory_analytics_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM inventory_analytics" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 庫存分析數量" "$inventory_analytics_count" "15"
    
    # 檢查支付分析數量
    payment_analytics_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM payment_analytics" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 支付分析數量" "$payment_analytics_count" "12"
    
    # 檢查物流分析數量
    logistics_analytics_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM logistics_analytics" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 物流分析數量" "$logistics_analytics_count" "14"
    
    # 檢查物化視圖
    materialized_views_count=$(docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM system.tables WHERE database = 'ecommerce_analytics' AND engine LIKE '%MergeTree%'" 2>/dev/null | tr -d ' \n')
    if [ "$materialized_views_count" -ge "3" ]; then
        echo -e "${GREEN}✅ ClickHouse 物化視圖數量: 通過 (>=3)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ ClickHouse 物化視圖數量: 失敗 (期望: >=3, 實際: $materialized_views_count)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# 檢查服務連線
check_services() {
    echo -e "${BLUE}🔍 檢查服務連線...${NC}"
    
    # 檢查 PostgreSQL
    if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL 連線正常${NC}"
    else
        echo -e "${RED}❌ PostgreSQL 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 MongoDB
    if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB 連線正常${NC}"
    else
        echo -e "${RED}❌ MongoDB 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis 連線正常${NC}"
    else
        echo -e "${RED}❌ Redis 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 MinIO
    if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MinIO 連線正常${NC}"
    else
        echo -e "${RED}❌ MinIO 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 Milvus
    if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Milvus 連線正常${NC}"
    else
        echo -e "${RED}❌ Milvus 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 ClickHouse
    if docker-compose exec -T clickhouse clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ClickHouse 連線正常${NC}"
    else
        echo -e "${RED}❌ ClickHouse 連線失敗${NC}"
        return 1
    fi
    
    return 0
}

# 主函數
main() {
    # 檢查服務連線
    if ! check_services; then
        echo -e "${RED}❌ 服務連線檢查失敗，請先啟動所有服務${NC}"
        echo -e "${YELLOW}請執行: docker-compose up -d${NC}"
        exit 1
    fi
    
    echo -e "\n🚀 開始驗證測試資料..."
    
    # 驗證各資料庫
    validate_postgresql
    validate_mongodb
    validate_redis
    validate_minio
    validate_milvus
    validate_clickhouse
    
    # 結果摘要
    echo -e "\n" + "=" * 50
    echo -e "📋 測試資料驗證結果摘要"
    echo -e "=" * 50
    echo -e "總檢查項目: $TOTAL_CHECKS"
    echo -e "${GREEN}通過: $PASSED_CHECKS${NC}"
    echo -e "${RED}失敗: $FAILED_CHECKS${NC}"
    
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "成功率: $SUCCESS_RATE%"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有測試資料驗證通過！${NC}"
        echo -e "\n📊 驗證通過的資料庫:"
        echo -e "  - PostgreSQL: 用戶、商品、訂單、支付等完整資料"
        echo -e "  - MongoDB: 商品詳情、前端配置、系統日誌、客服紀錄"
        echo -e "  - Redis: Session、購物車、熱門商品、庫存快取"
        echo -e "  - MinIO: 商品圖片、用戶頭像、發票、退貨證明"
        echo -e "  - Milvus: 商品向量、用戶向量、搜尋歷史、推薦結果"
        echo -e "  - ClickHouse: 用戶行為、銷售數據、商品表現分析"
        exit 0
    elif [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "\n${YELLOW}⚠️ 大部分測試資料驗證通過，但有一些需要注意的問題。${NC}"
        exit 1
    else
        echo -e "\n${RED}❌ 多個測試資料驗證失敗，請檢查並修復後重新驗證。${NC}"
        exit 2
    fi
}

# 執行主函數
main
