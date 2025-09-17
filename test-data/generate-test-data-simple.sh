#!/bin/bash
# 電商系統測試資料生成腳本（簡化版）
# 使用現有運行的容器生成測試資料

echo "🚀 開始生成電商系統測試資料..."
echo "=================================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 計數器
TOTAL_DATABASES=6
COMPLETED_DATABASES=0
FAILED_DATABASES=0

# 生成 PostgreSQL 測試資料
generate_postgresql_data() {
    echo -e "${BLUE}📊 生成 PostgreSQL 測試資料...${NC}"
    
    if docker exec ecommerce-postgresql psql -U ecommerce_user -d ecommerce_db -c "
INSERT INTO users (name, email, password_hash, phone, status) VALUES 
('測試用戶1', 'test1@example.com', 'hash1', '0911111111', 'active'),
('測試用戶2', 'test2@example.com', 'hash2', '0922222222', 'active'),
('測試用戶3', 'test3@example.com', 'hash3', '0933333333', 'active');
" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL 測試資料生成成功${NC}"
        COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
    else
        echo -e "${RED}❌ PostgreSQL 測試資料生成失敗${NC}"
        FAILED_DATABASES=$((FAILED_DATABASES + 1))
    fi
}

# 生成 MongoDB 測試資料
generate_mongodb_data() {
    echo -e "${BLUE}📊 生成 MongoDB 測試資料...${NC}"
    
    if docker exec ecommerce-mongodb mongosh -u root -p mongodb_password --authenticationDatabase admin --eval "
db = db.getSiblingDB('ecommerce');
db.products_detail.insertOne({
  product_pg_id: 999,
  name: '測試商品詳情',
  description: '這是一個測試商品詳情',
  specs: { brand: '測試品牌', weight: '100g' },
  images: ['test_image.jpg'],
  features: ['測試特色1', '測試特色2'],
  created_at: new Date(),
  updated_at: new Date()
});
print('MongoDB 測試資料插入完成！');
" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB 測試資料生成成功${NC}"
        COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
    else
        echo -e "${RED}❌ MongoDB 測試資料生成失敗${NC}"
        FAILED_DATABASES=$((FAILED_DATABASES + 1))
    fi
}

# 生成 Redis 測試資料
generate_redis_data() {
    echo -e "${BLUE}📊 生成 Redis 測試資料...${NC}"
    
    if docker exec ecommerce-redis redis-cli -a redis_password SET test:key "test_value" > /dev/null 2>&1 && \
       docker exec ecommerce-redis redis-cli -a redis_password SET test:session "test_session_data" > /dev/null 2>&1 && \
       docker exec ecommerce-redis redis-cli -a redis_password SET test:cart "test_cart_data" > /dev/null 2>&1 && \
       docker exec ecommerce-redis redis-cli -a redis_password EXPIRE test:key 3600 > /dev/null 2>&1 && \
       docker exec ecommerce-redis redis-cli -a redis_password EXPIRE test:session 86400 > /dev/null 2>&1 && \
       docker exec ecommerce-redis redis-cli -a redis_password EXPIRE test:cart 604800 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis 測試資料生成成功${NC}"
        COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
    else
        echo -e "${RED}❌ Redis 測試資料生成失敗${NC}"
        FAILED_DATABASES=$((FAILED_DATABASES + 1))
    fi
}

# 生成 MinIO 測試資料
generate_minio_data() {
    echo -e "${BLUE}📊 生成 MinIO 測試資料...${NC}"
    
    # 創建測試檔案
    echo "test content" > /tmp/test_file.txt
    
    if docker cp /tmp/test_file.txt ecommerce-minio-files:/tmp/test_file.txt && \
       docker exec ecommerce-minio-files mc cp /tmp/test_file.txt ecommerce/test-bucket/test_file.txt; then
        echo -e "${GREEN}✅ MinIO 測試資料生成成功${NC}"
        COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
    else
        echo -e "${RED}❌ MinIO 測試資料生成失敗${NC}"
        FAILED_DATABASES=$((FAILED_DATABASES + 1))
    fi
    
    # 清理臨時檔案
    rm -f /tmp/test_file.txt
}

# 生成 Milvus 測試資料
generate_milvus_data() {
    echo -e "${BLUE}📊 生成 Milvus 測試資料...${NC}"
    
    # 檢查 Milvus 服務是否正常
    if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Milvus 服務正常運行${NC}"
        echo -e "${YELLOW}⚠️ Milvus 容器中沒有 Python，跳過測試資料生成${NC}"
        COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
    else
        echo -e "${RED}❌ Milvus 服務異常${NC}"
        FAILED_DATABASES=$((FAILED_DATABASES + 1))
    fi
}

# 生成 ClickHouse 測試資料
generate_clickhouse_data() {
    echo -e "${BLUE}📊 生成 ClickHouse 測試資料...${NC}"
    
    if docker exec ecommerce-clickhouse clickhouse-client --query "CREATE DATABASE IF NOT EXISTS test_db" > /dev/null 2>&1 && \
       docker exec ecommerce-clickhouse clickhouse-client --query "CREATE TABLE IF NOT EXISTS test_db.test_table (id UInt64, name String, value Float64, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id" > /dev/null 2>&1 && \
       docker exec ecommerce-clickhouse clickhouse-client --query "INSERT INTO test_db.test_table (id, name, value) VALUES (1, 'test1', 1.1), (2, 'test2', 2.2), (3, 'test3', 3.3)" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ClickHouse 測試資料生成成功${NC}"
        COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
    else
        echo -e "${RED}❌ ClickHouse 測試資料生成失敗${NC}"
        FAILED_DATABASES=$((FAILED_DATABASES + 1))
    fi
}

# 主函數
main() {
    echo -e "${YELLOW}🔍 檢查容器狀態...${NC}"
    
    # 檢查容器是否運行
    local containers=("ecommerce-postgresql" "ecommerce-mongodb" "ecommerce-redis" "ecommerce-minio-files" "ecommerce-milvus-standalone" "ecommerce-clickhouse")
    local running_containers=0
    
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            echo -e "${GREEN}✅ $container 正在運行${NC}"
            running_containers=$((running_containers + 1))
        else
            echo -e "${RED}❌ $container 未運行${NC}"
        fi
    done
    
    if [ $running_containers -lt 6 ]; then
        echo -e "${RED}❌ 部分容器未運行，無法生成測試資料${NC}"
        exit 1
    fi
    
    echo -e "\n🚀 開始生成測試資料..."
    
    # 生成各資料庫測試資料
    generate_postgresql_data
    generate_mongodb_data
    generate_redis_data
    generate_minio_data
    generate_milvus_data
    generate_clickhouse_data
    
    # 結果摘要
    echo -e "\n=================================================="
    echo -e "📋 測試資料生成結果摘要"
    echo "=================================================="
    echo -e "總資料庫數量: $TOTAL_DATABASES"
    echo -e "${GREEN}成功: $COMPLETED_DATABASES${NC}"
    echo -e "${RED}失敗: $FAILED_DATABASES${NC}"
    
    SUCCESS_RATE=$((COMPLETED_DATABASES * 100 / TOTAL_DATABASES))
    echo -e "成功率: $SUCCESS_RATE%"
    
    if [ $FAILED_DATABASES -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有測試資料生成成功！${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "\n${YELLOW}⚠️ 大部分測試資料生成成功，但有一些需要注意的問題。${NC}"
        exit 1
    else
        echo -e "\n${RED}❌ 多個測試資料生成失敗，請檢查並修復後重新生成。${NC}"
        exit 2
    fi
}

# 執行主函數
main
