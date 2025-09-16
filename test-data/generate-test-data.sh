#!/bin/bash
# 電商系統測試資料生成腳本
# 自動化生成和插入所有資料庫的測試資料

echo "🚀 開始生成電商系統測試資料..."
echo "=" * 50

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

# 檢查函數
check_database_connection() {
    local db_type=$1
    local host=$2
    local port=$3
    
    case $db_type in
        "postgresql")
            if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT 1;" > /dev/null 2>&1; then
                return 0
            else
                return 1
            fi
            ;;
        "mongodb")
            if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
                return 0
            else
                return 1
            fi
            ;;
        "redis")
            if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
                return 0
            else
                return 1
            fi
            ;;
        "minio")
            if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
                return 0
            else
                return 1
            fi
            ;;
        "milvus")
            if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
                return 0
            else
                return 1
            fi
            ;;
        "clickhouse")
            if docker-compose exec -T clickhouse clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
                return 0
            else
                return 1
            fi
            ;;
    esac
}

# 生成測試資料函數
generate_test_data() {
    local db_type=$1
    local script_file=$2
    
    echo -e "${BLUE}📊 生成 $db_type 測試資料...${NC}"
    
    case $db_type in
        "postgresql")
            if check_database_connection "postgresql" "localhost" "5432"; then
                echo -e "${YELLOW}  - 連接到 PostgreSQL...${NC}"
                if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -f /scripts/$script_file; then
                    echo -e "${GREEN}  ✅ PostgreSQL 測試資料生成成功${NC}"
                    COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
                else
                    echo -e "${RED}  ❌ PostgreSQL 測試資料生成失敗${NC}"
                    FAILED_DATABASES=$((FAILED_DATABASES + 1))
                fi
            else
                echo -e "${RED}  ❌ PostgreSQL 連線失敗${NC}"
                FAILED_DATABASES=$((FAILED_DATABASES + 1))
            fi
            ;;
        "mongodb")
            if check_database_connection "mongodb" "localhost" "27017"; then
                echo -e "${YELLOW}  - 連接到 MongoDB...${NC}"
                if docker-compose exec -T mongodb mongosh --file /scripts/$script_file; then
                    echo -e "${GREEN}  ✅ MongoDB 測試資料生成成功${NC}"
                    COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
                else
                    echo -e "${RED}  ❌ MongoDB 測試資料生成失敗${NC}"
                    FAILED_DATABASES=$((FAILED_DATABASES + 1))
                fi
            else
                echo -e "${RED}  ❌ MongoDB 連線失敗${NC}"
                FAILED_DATABASES=$((FAILED_DATABASES + 1))
            fi
            ;;
        "redis")
            if check_database_connection "redis" "localhost" "6379"; then
                echo -e "${YELLOW}  - 連接到 Redis...${NC}"
                if docker-compose exec -T redis sh /scripts/$script_file; then
                    echo -e "${GREEN}  ✅ Redis 測試資料生成成功${NC}"
                    COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
                else
                    echo -e "${RED}  ❌ Redis 測試資料生成失敗${NC}"
                    FAILED_DATABASES=$((FAILED_DATABASES + 1))
                fi
            else
                echo -e "${RED}  ❌ Redis 連線失敗${NC}"
                FAILED_DATABASES=$((FAILED_DATABASES + 1))
            fi
            ;;
        "minio")
            if check_database_connection "minio" "localhost" "9000"; then
                echo -e "${YELLOW}  - 連接到 MinIO...${NC}"
                if docker-compose exec -T minio sh /scripts/$script_file; then
                    echo -e "${GREEN}  ✅ MinIO 測試資料生成成功${NC}"
                    COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
                else
                    echo -e "${RED}  ❌ MinIO 測試資料生成失敗${NC}"
                    FAILED_DATABASES=$((FAILED_DATABASES + 1))
                fi
            else
                echo -e "${RED}  ❌ MinIO 連線失敗${NC}"
                FAILED_DATABASES=$((FAILED_DATABASES + 1))
            fi
            ;;
        "milvus")
            if check_database_connection "milvus" "localhost" "9091"; then
                echo -e "${YELLOW}  - 連接到 Milvus...${NC}"
                if docker-compose exec -T milvus-standalone python3 /scripts/$script_file; then
                    echo -e "${GREEN}  ✅ Milvus 測試資料生成成功${NC}"
                    COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
                else
                    echo -e "${RED}  ❌ Milvus 測試資料生成失敗${NC}"
                    FAILED_DATABASES=$((FAILED_DATABASES + 1))
                fi
            else
                echo -e "${RED}  ❌ Milvus 連線失敗${NC}"
                FAILED_DATABASES=$((FAILED_DATABASES + 1))
            fi
            ;;
        "clickhouse")
            if check_database_connection "clickhouse" "localhost" "8123"; then
                echo -e "${YELLOW}  - 連接到 ClickHouse...${NC}"
                if docker-compose exec -T clickhouse clickhouse-client --multiquery < /scripts/$script_file; then
                    echo -e "${GREEN}  ✅ ClickHouse 測試資料生成成功${NC}"
                    COMPLETED_DATABASES=$((COMPLETED_DATABASES + 1))
                else
                    echo -e "${RED}  ❌ ClickHouse 測試資料生成失敗${NC}"
                    FAILED_DATABASES=$((FAILED_DATABASES + 1))
                fi
            else
                echo -e "${RED}  ❌ ClickHouse 連線失敗${NC}"
                FAILED_DATABASES=$((FAILED_DATABASES + 1))
            fi
            ;;
    esac
}

# ==============================================
# 檢查環境
# ==============================================

echo "🔍 檢查環境..."

# 檢查 Docker Compose 是否運行
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Docker Compose 服務未運行${NC}"
    echo -e "${YELLOW}請先啟動服務: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose 服務運行中${NC}"

# 檢查測試資料檔案是否存在
echo "📁 檢查測試資料檔案..."

test_files=(
    "postgresql-test-data.sql"
    "mongodb-test-data.js"
    "redis-test-data.sh"
    "minio-test-data.sh"
    "milvus-test-data.py"
    "clickhouse-test-data.sql"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file 存在${NC}"
    else
        echo -e "${RED}❌ $file 不存在${NC}"
        exit 1
    fi
done

# ==============================================
# 生成測試資料
# ==============================================

echo -e "\n🚀 開始生成測試資料..."

# 等待服務完全啟動
echo "⏳ 等待服務完全啟動..."
sleep 30

# 生成各資料庫測試資料
generate_test_data "postgresql" "postgresql-test-data.sql"
generate_test_data "mongodb" "mongodb-test-data.js"
generate_test_data "redis" "redis-test-data.sh"
generate_test_data "minio" "minio-test-data.sh"
generate_test_data "milvus" "milvus-test-data.py"
generate_test_data "clickhouse" "clickhouse-test-data.sql"

# ==============================================
# 驗證測試資料
# ==============================================

echo -e "\n🔍 驗證測試資料..."

# PostgreSQL 驗證
echo -e "${BLUE}📊 驗證 PostgreSQL 測試資料...${NC}"
if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM users;" | grep -q "13"; then
    echo -e "${GREEN}  ✅ PostgreSQL 用戶資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ PostgreSQL 用戶資料驗證失敗${NC}"
fi

if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM products;" | grep -q "25"; then
    echo -e "${GREEN}  ✅ PostgreSQL 商品資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ PostgreSQL 商品資料驗證失敗${NC}"
fi

# MongoDB 驗證
echo -e "${BLUE}📊 驗證 MongoDB 測試資料...${NC}"
if docker-compose exec -T mongodb mongosh --quiet --eval "db.products_detail.countDocuments()" | grep -q "8"; then
    echo -e "${GREEN}  ✅ MongoDB 商品詳情資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ MongoDB 商品詳情資料驗證失敗${NC}"
fi

# Redis 驗證
echo -e "${BLUE}📊 驗證 Redis 測試資料...${NC}"
if docker-compose exec -T redis redis-cli DBSIZE | grep -E "[1-9][0-9]*"; then
    echo -e "${GREEN}  ✅ Redis 快取資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ Redis 快取資料驗證失敗${NC}"
fi

# MinIO 驗證
echo -e "${BLUE}📊 驗證 MinIO 測試資料...${NC}"
if docker-compose exec -T minio mc ls ecommerce/ecommerce-storage/products/6/ | grep -q "main"; then
    echo -e "${GREEN}  ✅ MinIO 商品圖片資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ MinIO 商品圖片資料驗證失敗${NC}"
fi

# Milvus 驗證
echo -e "${BLUE}📊 驗證 Milvus 測試資料...${NC}"
if docker-compose exec -T milvus-standalone python3 -c "
from pymilvus import connections, Collection, utility
connections.connect('default', host='localhost', port='19530')
if utility.has_collection('product_vectors'):
    collection = Collection('product_vectors')
    print(f'實體數量: {collection.num_entities}')
else:
    print('集合不存在')
" | grep -q "實體數量"; then
    echo -e "${GREEN}  ✅ Milvus 向量資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ Milvus 向量資料驗證失敗${NC}"
fi

# ClickHouse 驗證
echo -e "${BLUE}📊 驗證 ClickHouse 測試資料...${NC}"
if docker-compose exec -T clickhouse clickhouse-client --query "SELECT COUNT(*) FROM user_behavior_events" | grep -q "20"; then
    echo -e "${GREEN}  ✅ ClickHouse 用戶行為資料驗證成功${NC}"
else
    echo -e "${RED}  ❌ ClickHouse 用戶行為資料驗證失敗${NC}"
fi

# ==============================================
# 結果摘要
# ==============================================

echo -e "\n" + "=" * 50
echo -e "📋 測試資料生成結果摘要"
echo -e "=" * 50
echo -e "總資料庫數量: $TOTAL_DATABASES"
echo -e "${GREEN}成功: $COMPLETED_DATABASES${NC}"
echo -e "${RED}失敗: $FAILED_DATABASES${NC}"

SUCCESS_RATE=$((COMPLETED_DATABASES * 100 / TOTAL_DATABASES))
echo -e "成功率: $SUCCESS_RATE%"

if [ $FAILED_DATABASES -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有測試資料生成成功！${NC}"
    echo -e "\n📊 已生成的測試資料:"
    echo -e "  - PostgreSQL: 13個用戶, 25個商品, 完整交易資料"
    echo -e "  - MongoDB: 8個商品詳情, 前端配置, 系統日誌, 客服紀錄"
    echo -e "  - Redis: Session, 購物車, 熱門商品, 庫存快取"
    echo -e "  - MinIO: 商品圖片, 用戶頭像, 發票, 退貨證明"
    echo -e "  - Milvus: 商品向量, 用戶向量, 搜尋歷史, 推薦結果"
    echo -e "  - ClickHouse: 用戶行為, 銷售數據, 商品表現分析"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️ 大部分測試資料生成成功，但有一些需要注意的問題。${NC}"
    exit 1
else
    echo -e "\n${RED}❌ 多個測試資料生成失敗，請檢查並修復後重新生成。${NC}"
    exit 2
fi
