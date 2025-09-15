#!/bin/bash

# 電商平台資料庫部署腳本
# 執行新的資料庫架構部署

set -e  # 遇到錯誤立即退出

echo "🚀 開始部署電商平台資料庫架構..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印彩色消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函數：檢查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_message $RED "錯誤: $1 命令未找到"
        exit 1
    fi
}

# 函數：檢查 Docker 容器狀態
check_container() {
    local container_name=$1
    if ! docker compose ps | grep -q "$container_name.*Up"; then
        print_message $RED "錯誤: $container_name 容器未運行"
        return 1
    fi
    return 0
}

# 函數：等待服務就緒
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_message $BLUE "等待 $service 服務就緒..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec $service pg_isready -p $port &> /dev/null; then
            print_message $GREEN "$service 服務已就緒"
            return 0
        fi
        
        print_message $YELLOW "嘗試 $attempt/$max_attempts - 等待 $service..."
        sleep 2
        ((attempt++))
    done
    
    print_message $RED "$service 服務啟動超時"
    return 1
}

# 檢查必要的命令
print_message $BLUE "檢查必要命令..."
check_command docker
check_command docker-compose

# 檢查 Docker 服務
if ! docker info &> /dev/null; then
    print_message $RED "Docker 服務未運行，請先啟動 Docker"
    exit 1
fi

# 啟動服務
print_message $BLUE "啟動 Docker 服務..."
docker compose up -d

# 等待 PostgreSQL 就緒
wait_for_service ecommerce-postgresql 5432

# 等待 MongoDB 就緒
print_message $BLUE "等待 MongoDB 服務就緒..."
sleep 10  # MongoDB 需要更多時間啟動

# 檢查容器狀態
print_message $BLUE "檢查容器狀態..."
if ! check_container ecommerce-postgresql; then
    print_message $RED "PostgreSQL 容器未正常運行"
    exit 1
fi

if ! check_container ecommerce-mongodb; then
    print_message $RED "MongoDB 容器未正常運行"
    exit 1
fi

# 執行 PostgreSQL 架構部署
print_message $BLUE "部署 PostgreSQL 架構..."
if docker compose exec -T ecommerce-postgresql psql -U postgres -d ecommerce -f /docker-entrypoint-initdb.d/new-database-schema.sql; then
    print_message $GREEN "PostgreSQL 架構部署成功"
else
    print_message $RED "PostgreSQL 架構部署失敗"
    exit 1
fi

# 執行數據遷移 (如果存在舊數據)
print_message $BLUE "執行數據遷移..."
if docker compose exec -T ecommerce-postgresql psql -U postgres -d ecommerce -f /docker-entrypoint-initdb.d/data-migration.sql; then
    print_message $GREEN "數據遷移成功"
else
    print_message $YELLOW "數據遷移跳過 (可能是新安裝)"
fi

# 執行整合測試
print_message $BLUE "執行整合測試..."
if docker compose exec -T ecommerce-postgresql psql -U postgres -d ecommerce -f /docker-entrypoint-initdb.d/integration-test.sql; then
    print_message $GREEN "整合測試通過"
else
    print_message $RED "整合測試失敗"
    exit 1
fi

# 執行 MongoDB 初始化
print_message $BLUE "初始化 MongoDB 集合..."
if docker compose exec -T ecommerce-mongodb mongosh /docker-entrypoint-initdb.d/mongodb-collections-init.js; then
    print_message $GREEN "MongoDB 初始化成功"
else
    print_message $RED "MongoDB 初始化失敗"
    exit 1
fi

# 執行 MongoDB RBAC 設定
print_message $BLUE "設定 MongoDB RBAC..."
if docker compose exec -T ecommerce-mongodb mongosh /docker-entrypoint-initdb.d/mongodb-rbac-setup.js; then
    print_message $GREEN "MongoDB RBAC 設定成功"
else
    print_message $RED "MongoDB RBAC 設定失敗"
    exit 1
fi

# 檢查服務狀態
print_message $BLUE "檢查所有服務狀態..."
docker compose ps

# 顯示連接資訊
print_message $GREEN "🎉 資料庫部署完成！"
echo ""
print_message $BLUE "服務連接資訊:"
echo "PostgreSQL: localhost:5432 (用戶: postgres, 密碼: postgres)"
echo "MongoDB: localhost:27017 (用戶: root, 密碼: rootpassword)"
echo "Redis: localhost:6379"
echo "ClickHouse: localhost:8123"
echo "Milvus: localhost:19530"
echo "MinIO: localhost:9000 (用戶: minioadmin, 密碼: minioadmin)"
echo ""

# 顯示下一步操作
print_message $YELLOW "下一步操作:"
echo "1. 檢查應用程式服務是否正常啟動"
echo "2. 測試 API 端點"
echo "3. 檢查前端應用程式"
echo "4. 查看日誌: docker compose logs -f"
echo ""

# 可選：顯示資料庫統計
print_message $BLUE "資料庫統計:"
docker compose exec ecommerce-postgresql psql -U postgres -d ecommerce -c "
SELECT 
    'Tables' as type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Users' as type,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Products' as type,
    COUNT(*) as count
FROM products
UNION ALL
SELECT 
    'Orders' as type,
    COUNT(*) as count
FROM orders;
"

print_message $GREEN "部署腳本執行完成！"
