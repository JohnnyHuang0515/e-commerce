#!/bin/bash
# 電商系統資料庫初始化驗證腳本

echo "🔍 開始驗證電商系統資料庫初始化..."
echo "=" * 50

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 計數器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 檢查函數
check_file() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 存在${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $1 不存在${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_service() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker-compose ps | grep -q "$1.*Up"; then
        echo -e "${GREEN}✅ $1 服務運行中${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $1 服務未運行${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_database_connection() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    case $1 in
        "postgresql")
            if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT 1;" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ PostgreSQL 連線成功${NC}"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                echo -e "${RED}❌ PostgreSQL 連線失敗${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
            ;;
        "mongodb")
            if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ MongoDB 連線成功${NC}"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                echo -e "${RED}❌ MongoDB 連線失敗${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
            ;;
        "redis")
            if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Redis 連線成功${NC}"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                echo -e "${RED}❌ Redis 連線失敗${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
            ;;
        "clickhouse")
            if docker-compose exec -T clickhouse clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ ClickHouse 連線成功${NC}"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                echo -e "${RED}❌ ClickHouse 連線失敗${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
            ;;
    esac
}

# ==============================================
# 1. 檢查初始化檔案是否存在
# ==============================================
echo "📁 檢查初始化檔案..."
check_file "postgresql-init.sql"
check_file "mongodb-init.js"
check_file "redis-init.sh"
check_file "minio-init.sh"
check_file "milvus-init.py"
check_file "clickhouse-init.sql"
check_file "docker-compose.yml"
check_file "README.md"

# ==============================================
# 2. 檢查檔案權限
# ==============================================
echo -e "\n🔐 檢查腳本權限..."
for script in redis-init.sh minio-init.sh milvus-init.py; do
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -x "$script" ]; then
        echo -e "${GREEN}✅ $script 有執行權限${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️ $script 沒有執行權限，正在設定...${NC}"
        chmod +x "$script"
        if [ -x "$script" ]; then
            echo -e "${GREEN}✅ $script 權限設定完成${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ $script 權限設定失敗${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    fi
done

# ==============================================
# 3. 檢查檔案內容完整性
# ==============================================
echo -e "\n📄 檢查檔案內容完整性..."

# PostgreSQL
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if grep -q "CREATE TABLE Users" postgresql-init.sql && grep -q "CREATE TABLE Products" postgresql-init.sql; then
    echo -e "${GREEN}✅ PostgreSQL 初始化檔案內容完整${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ PostgreSQL 初始化檔案內容不完整${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# MongoDB
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if grep -q "createCollection('products_detail'" mongodb-init.js && grep -q "insertMany" mongodb-init.js; then
    echo -e "${GREEN}✅ MongoDB 初始化檔案內容完整${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ MongoDB 初始化檔案內容不完整${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Redis
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if grep -q "SETEX" redis-init.sh && grep -q "session:" redis-init.sh; then
    echo -e "${GREEN}✅ Redis 初始化檔案內容完整${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Redis 初始化檔案內容不完整${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Milvus
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if grep -q "def create_product_vectors_collection" milvus-init.py && grep -q "def create_user_vectors_collection" milvus-init.py; then
    echo -e "${GREEN}✅ Milvus 初始化檔案內容完整${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Milvus 初始化檔案內容不完整${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# ClickHouse
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if grep -q "CREATE TABLE.*user_behavior_events" clickhouse-init.sql && grep -q "CREATE TABLE.*sales_data" clickhouse-init.sql; then
    echo -e "${GREEN}✅ ClickHouse 初始化檔案內容完整${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ ClickHouse 初始化檔案內容不完整${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Docker Compose
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if grep -q "postgresql:" docker-compose.yml && grep -q "mongodb:" docker-compose.yml && grep -q "redis:" docker-compose.yml; then
    echo -e "${GREEN}✅ Docker Compose 檔案內容完整${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Docker Compose 檔案內容不完整${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# ==============================================
# 4. 檢查 Docker 環境（如果服務正在運行）
# ==============================================
echo -e "\n🐳 檢查 Docker 環境..."

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose 已安裝${NC}"
    
    # 檢查服務是否運行
    if docker-compose ps &> /dev/null; then
        echo -e "\n🔍 檢查服務狀態..."
        check_service "postgresql"
        check_service "mongodb"
        check_service "redis"
        check_service "minio"
        check_service "milvus-standalone"
        check_service "clickhouse"
        
        # 檢查資料庫連線
        echo -e "\n🔗 檢查資料庫連線..."
        check_database_connection "postgresql"
        check_database_connection "mongodb"
        check_database_connection "redis"
        check_database_connection "clickhouse"
    else
        echo -e "${YELLOW}⚠️ Docker Compose 服務未啟動${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Docker Compose 未安裝${NC}"
fi

# ==============================================
# 5. 檢查測試資料（如果服務正在運行）
# ==============================================
if docker-compose ps &> /dev/null && docker-compose ps | grep -q "Up"; then
    echo -e "\n📊 檢查測試資料..."
    
    # PostgreSQL 測試資料
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker-compose exec -T postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -q "3"; then
        echo -e "${GREEN}✅ PostgreSQL 測試資料已插入${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ PostgreSQL 測試資料未找到${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # MongoDB 測試資料
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker-compose exec -T mongodb mongosh --quiet --eval "db.products_detail.countDocuments()" 2>/dev/null | grep -q "3"; then
        echo -e "${GREEN}✅ MongoDB 測試資料已插入${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ MongoDB 測試資料未找到${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # Redis 測試資料
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if docker-compose exec -T redis redis-cli DBSIZE 2>/dev/null | grep -E "[1-9][0-9]*"; then
        echo -e "${GREEN}✅ Redis 測試資料已插入${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ Redis 測試資料未找到${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
fi

# ==============================================
# 結果摘要
# ==============================================
echo -e "\n" + "=" * 50
echo -e "📋 驗證結果摘要"
echo -e "=" * 50
echo -e "總檢查項目: $TOTAL_CHECKS"
echo -e "${GREEN}通過: $PASSED_CHECKS${NC}"
echo -e "${RED}失敗: $FAILED_CHECKS${NC}"

SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "成功率: $SUCCESS_RATE%"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有檢查項目都通過！資料庫初始化完整無誤。${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️ 大部分檢查項目通過，但有一些需要注意的問題。${NC}"
    exit 1
else
    echo -e "\n${RED}❌ 發現多個問題，請檢查並修復後重新驗證。${NC}"
    exit 2
fi
