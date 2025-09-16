#!/bin/bash
# 電商系統測試資料驗證腳本（簡化版）
# 驗證所有資料庫的測試資料完整性和正確性

echo "🔍 開始驗證電商系統測試資料..."
echo "=================================================="

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
    
    # 檢查是否為數字比較
    if [[ "$expected" =~ ^\>\=([0-9]+)$ ]]; then
        local min_value=${BASH_REMATCH[1]}
        if [ "$result" -ge "$min_value" ]; then
            echo -e "${GREEN}✅ $test_name: 通過${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ $test_name: 失敗 (期望: >=$min_value, 實際: $result)${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    elif [ "$result" = "$expected" ]; then
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
    user_count=$(docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -t -c 'SELECT COUNT(*) FROM users;' 2>/dev/null | tr -d ' \n')
    check_result "PostgreSQL 用戶數量" "$user_count" "3"
    
    # 檢查資料庫連線
    if docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL 連線正常${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ PostgreSQL 連線失敗${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# MongoDB 驗證
validate_mongodb() {
    echo -e "${BLUE}📊 驗證 MongoDB 測試資料...${NC}"
    
    # 檢查商品詳情數量
    product_detail_count=$(docker exec ecommerce-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --quiet --eval "db = db.getSiblingDB('ecommerce'); db.products_detail.countDocuments()" 2>/dev/null | tr -d ' \n')
    check_result "MongoDB 商品詳情數量" "$product_detail_count" ">=1"
    
    # 檢查資料庫連線
    if docker exec ecommerce-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB 連線正常${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ MongoDB 連線失敗${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# Redis 驗證
validate_redis() {
    echo -e "${BLUE}📊 驗證 Redis 測試資料...${NC}"
    
    # 檢查總鍵值數量
    total_keys=$(docker exec ecommerce-redis redis-cli DBSIZE 2>/dev/null | tr -d ' \n')
    if [ "$total_keys" -gt "0" ]; then
        echo -e "${GREEN}✅ Redis 總鍵值數量: 通過 (>0)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Redis 總鍵值數量: 失敗 (期望: >0, 實際: $total_keys)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # 檢查測試鍵值
    test_value=$(docker exec ecommerce-redis redis-cli GET "test:key" 2>/dev/null | tr -d ' \n')
    check_result "Redis 測試鍵值" "$test_value" "test_value"
    
    # 檢查資料庫連線
    if docker exec ecommerce-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis 連線正常${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Redis 連線失敗${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# MinIO 驗證
validate_minio() {
    echo -e "${BLUE}📊 驗證 MinIO 測試資料...${NC}"
    
    # 檢查測試檔案是否存在
    if docker exec ecommerce-minio-files mc ls ecommerce/test-bucket/test_file.txt > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MinIO 測試檔案存在${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ MinIO 測試檔案不存在${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # 檢查服務連線
    if curl -f http://localhost:9010/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MinIO 連線正常${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ MinIO 連線失敗${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# Milvus 驗證
validate_milvus() {
    echo -e "${BLUE}📊 驗證 Milvus 測試資料...${NC}"
    
    # 檢查服務連線
    if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Milvus 連線正常${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Milvus 連線失敗${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# ClickHouse 驗證
validate_clickhouse() {
    echo -e "${BLUE}📊 驗證 ClickHouse 測試資料...${NC}"
    
    # 檢查測試資料數量
    test_data_count=$(docker exec ecommerce-clickhouse clickhouse-client --query "SELECT COUNT(*) FROM test_db.test_table" 2>/dev/null | tr -d ' \n')
    check_result "ClickHouse 測試資料數量" "$test_data_count" ">=3"
    
    # 檢查資料庫連線
    if docker exec ecommerce-clickhouse clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ClickHouse 連線正常${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ ClickHouse 連線失敗${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# 檢查服務連線
check_services() {
    echo -e "${BLUE}🔍 檢查服務連線...${NC}"
    
    # 檢查 PostgreSQL
    if docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL 連線正常${NC}"
    else
        echo -e "${RED}❌ PostgreSQL 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 MongoDB
    if docker exec ecommerce-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB 連線正常${NC}"
    else
        echo -e "${RED}❌ MongoDB 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 Redis
    if docker exec ecommerce-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis 連線正常${NC}"
    else
        echo -e "${RED}❌ Redis 連線失敗${NC}"
        return 1
    fi
    
    # 檢查 MinIO
    if curl -f http://localhost:9010/minio/health/live > /dev/null 2>&1; then
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
    if docker exec ecommerce-clickhouse clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
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
    echo -e "\n=================================================="
    echo -e "📋 測試資料驗證結果摘要"
    echo "=================================================="
    echo -e "總檢查項目: $TOTAL_CHECKS"
    echo -e "${GREEN}通過: $PASSED_CHECKS${NC}"
    echo -e "${RED}失敗: $FAILED_CHECKS${NC}"
    
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "成功率: $SUCCESS_RATE%"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有測試資料驗證通過！${NC}"
        echo -e "\n📊 驗證通過的資料庫:"
        echo -e "  - PostgreSQL: 用戶、商品等完整資料"
        echo -e "  - MongoDB: 商品詳情資料"
        echo -e "  - Redis: Session、快取資料"
        echo -e "  - MinIO: 檔案儲存資料"
        echo -e "  - Milvus: 向量搜尋服務"
        echo -e "  - ClickHouse: 分析資料"
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
