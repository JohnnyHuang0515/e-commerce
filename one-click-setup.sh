#!/bin/bash
# 電商系統一鍵啟動腳本
# 整合資料庫初始化和測試資料生成

echo "🚀 電商系統一鍵啟動腳本"
echo "=================================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 計數器
TOTAL_STEPS=7
COMPLETED_STEPS=0
FAILED_STEPS=0

# 檢查函數
check_command() {
    local command=$1
    local description=$2
    
    if command -v $command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description 已安裝${NC}"
        return 0
    else
        echo -e "${RED}❌ $description 未安裝${NC}"
        return 1
    fi
}

# 等待服務啟動函數
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ 等待 $service_name 服務啟動...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if eval $check_command > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name 服務已啟動${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}  嘗試 $attempt/$max_attempts - 等待中...${NC}"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name 服務啟動超時${NC}"
    return 1
}

# 步驟1：環境檢查
check_environment() {
    echo -e "${BLUE}📋 步驟 1/7: 環境檢查${NC}"
    echo "=============================="
    
    local all_good=true
    
    # 檢查 Docker
    if ! check_command "docker" "Docker"; then
        echo -e "${RED}請先安裝 Docker: https://docs.docker.com/get-docker/${NC}"
        all_good=false
    fi
    
    # 檢查 Docker Compose
    if ! check_command "docker-compose" "Docker Compose"; then
        echo -e "${RED}請先安裝 Docker Compose: https://docs.docker.com/compose/install/${NC}"
        all_good=false
    fi
    
    # 檢查 curl
    if ! check_command "curl" "curl"; then
        echo -e "${RED}請先安裝 curl${NC}"
        all_good=false
    fi
    
    # 檢查 Python3
    if ! check_command "python3" "Python 3"; then
        echo -e "${RED}請先安裝 Python 3${NC}"
        all_good=false
    fi
    
    # 檢查 pip
    if ! check_command "pip3" "pip3"; then
        echo -e "${RED}請先安裝 pip3${NC}"
        all_good=false
    fi
    
    if [ "$all_good" = true ]; then
        echo -e "${GREEN}✅ 環境檢查通過${NC}"
        COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
    else
        echo -e "${RED}❌ 環境檢查失敗${NC}"
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
}

# 步驟2：安裝依賴
install_dependencies() {
    echo -e "${BLUE}📋 步驟 2/7: 安裝依賴${NC}"
    echo "=============================="
    
    # 安裝 Python 依賴
    echo -e "${YELLOW}📦 安裝 Python 依賴...${NC}"
    if pip3 install pymilvus numpy > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Python 依賴安裝成功${NC}"
    else
        echo -e "${RED}❌ Python 依賴安裝失敗${NC}"
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
    
    # 檢查 MinIO 客戶端
    if ! command -v mc > /dev/null 2>&1; then
        echo -e "${YELLOW}📦 安裝 MinIO 客戶端...${NC}"
        if curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc && \
           chmod +x /tmp/mc && \
           sudo mv /tmp/mc /usr/local/bin/mc; then
            echo -e "${GREEN}✅ MinIO 客戶端安裝成功${NC}"
        else
            echo -e "${RED}❌ MinIO 客戶端安裝失敗${NC}"
            FAILED_STEPS=$((FAILED_STEPS + 1))
            return 1
        fi
    else
        echo -e "${GREEN}✅ MinIO 客戶端已安裝${NC}"
    fi
    
    COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
}

# 步驟3：清理現有數據
clean_existing_data() {
    echo -e "${BLUE}📋 步驟 3/7: 清理現有數據${NC}"
    echo "=============================="
    
    echo -e "${YELLOW}🧹 清理現有數據...${NC}"
    
    # 清理 PostgreSQL 數據
    echo -e "${YELLOW}  📊 清理 PostgreSQL 數據...${NC}"
    if docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -c "
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO admin;
        GRANT ALL ON SCHEMA public TO public;
    " > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ PostgreSQL 數據清理完成${NC}"
    else
        echo -e "${RED}    ❌ PostgreSQL 數據清理失敗${NC}"
    fi
    
    # 清理 MongoDB 數據
    echo -e "${YELLOW}  📊 清理 MongoDB 數據...${NC}"
    if docker exec ecommerce-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --eval "
        db = db.getSiblingDB('ecommerce');
        db.dropDatabase();
        print('MongoDB 數據清理完成');
    " > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ MongoDB 數據清理完成${NC}"
    else
        echo -e "${RED}    ❌ MongoDB 數據清理失敗${NC}"
    fi
    
    # 清理 Redis 數據
    echo -e "${YELLOW}  📊 清理 Redis 數據...${NC}"
    if docker exec ecommerce-redis redis-cli FLUSHALL > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ Redis 數據清理完成${NC}"
    else
        echo -e "${RED}    ❌ Redis 數據清理失敗${NC}"
    fi
    
    # 清理 MinIO 數據
    echo -e "${YELLOW}  📊 清理 MinIO 數據...${NC}"
    if docker exec ecommerce-minio-files mc rm --recursive --force ecommerce/ > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ MinIO 數據清理完成${NC}"
    else
        echo -e "${GREEN}    ✅ MinIO 數據清理完成（無數據或已清理）${NC}"
    fi
    
    # 清理 Milvus 數據
    echo -e "${YELLOW}  📊 清理 Milvus 數據...${NC}"
    if curl -X DELETE http://localhost:9091/collections/test_collection > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ Milvus 測試集合清理完成${NC}"
    else
        echo -e "${GREEN}    ✅ Milvus 數據清理完成（無測試集合）${NC}"
    fi
    
    # 清理 ClickHouse 數據
    echo -e "${YELLOW}  📊 清理 ClickHouse 數據...${NC}"
    if docker exec ecommerce-clickhouse clickhouse-client --query "DROP DATABASE IF EXISTS test_db" > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ ClickHouse 測試數據庫清理完成${NC}"
    else
        echo -e "${GREEN}    ✅ ClickHouse 數據清理完成（無測試數據庫）${NC}"
    fi
    
    echo -e "${GREEN}✅ 現有數據清理完成${NC}"
    COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
}

# 步驟4：檢查資料庫服務
check_database_services() {
    echo -e "${BLUE}📋 步驟 4/7: 檢查資料庫服務${NC}"
    echo "=============================="
    
    # 檢查各服務狀態
    local services=(
        "PostgreSQL:docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -c 'SELECT 1;'"
        "MongoDB:docker exec ecommerce-mongodb mongosh --eval 'db.runCommand(\"ping\")'"
        "Redis:docker exec ecommerce-redis redis-cli ping"
        "MinIO:curl -f http://localhost:9010/minio/health/live"
        "Milvus:curl -f http://localhost:9091/healthz"
        "ClickHouse:docker exec ecommerce-clickhouse clickhouse-client --query 'SELECT 1'"
    )
    
    local all_services_ok=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r name command <<< "$service"
        if eval $command > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name 服務正常${NC}"
        else
            echo -e "${RED}❌ $name 服務異常${NC}"
            all_services_ok=false
        fi
    done
    
    if [ "$all_services_ok" = true ]; then
        echo -e "${GREEN}✅ 所有資料庫服務正常運行${NC}"
        COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
    else
        echo -e "${RED}❌ 部分資料庫服務異常${NC}"
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
}

# 步驟5：初始化資料庫
initialize_databases() {
    echo -e "${BLUE}📋 步驟 5/7: 初始化資料庫${NC}"
    echo "=============================="
    
    # 檢查初始化腳本是否存在
    if [ ! -d "database-init" ]; then
        echo -e "${RED}❌ database-init 目錄不存在${NC}"
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
    
    # 執行初始化腳本
    echo -e "${YELLOW}🔧 執行資料庫初始化...${NC}"
    
    # 執行 PostgreSQL 初始化
    echo -e "${YELLOW}  📊 初始化 PostgreSQL...${NC}"
    if head -100 database-init/postgresql-init.sql | docker exec -i ecommerce-postgresql psql -U admin -d ecommerce_transactions > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ PostgreSQL 初始化成功${NC}"
    else
        echo -e "${RED}    ❌ PostgreSQL 初始化失敗${NC}"
    fi
    
    # 執行 MongoDB 初始化
    echo -e "${YELLOW}  📊 初始化 MongoDB...${NC}"
    if docker exec ecommerce-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --file /dev/stdin < database-init/mongodb-init.js > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ MongoDB 初始化成功${NC}"
    else
        echo -e "${RED}    ❌ MongoDB 初始化失敗${NC}"
    fi
    
    # 執行 Redis 初始化
    echo -e "${YELLOW}  📊 初始化 Redis...${NC}"
    echo -e "${GREEN}    ✅ Redis 初始化成功（跳過，Redis 不需要特殊初始化）${NC}"
    
    # 執行 MinIO 初始化
    echo -e "${YELLOW}  📊 初始化 MinIO...${NC}"
    if docker exec ecommerce-minio-files sh -c "$(cat database-init/minio-init.sh)" > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ MinIO 初始化成功${NC}"
    else
        echo -e "${RED}    ❌ MinIO 初始化失敗${NC}"
    fi
    
    # 執行 ClickHouse 初始化
    echo -e "${YELLOW}  📊 初始化 ClickHouse...${NC}"
    if docker exec ecommerce-clickhouse clickhouse-client --multiquery < database-init/clickhouse-init.sql > /dev/null 2>&1; then
        echo -e "${GREEN}    ✅ ClickHouse 初始化成功${NC}"
    else
        echo -e "${RED}    ❌ ClickHouse 初始化失敗${NC}"
    fi
    
    echo -e "${GREEN}✅ 資料庫初始化完成${NC}"
    
    COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
}

# 步驟6：生成測試資料
generate_test_data() {
    echo -e "${BLUE}📋 步驟 6/7: 生成測試資料${NC}"
    echo "=============================="
    
    # 檢查測試資料腳本是否存在
    if [ ! -d "test-data" ]; then
        echo -e "${RED}❌ test-data 目錄不存在${NC}"
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
    
    # 執行測試資料生成腳本
    echo -e "${YELLOW}📊 生成測試資料...${NC}"
    if cd test-data && ./generate-test-data-simple.sh; then
        echo -e "${GREEN}✅ 測試資料生成成功${NC}"
        cd ..
    else
        echo -e "${RED}❌ 測試資料生成失敗${NC}"
        cd ..
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
    
    COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
}

# 步驟7：驗證系統
verify_system() {
    echo -e "${BLUE}📋 步驟 7/7: 驗證系統${NC}"
    echo "=============================="
    
    # 執行驗證腳本
    echo -e "${YELLOW}🔍 驗證系統完整性...${NC}"
    if cd test-data && ./validate-test-data-simple.sh; then
        echo -e "${GREEN}✅ 系統驗證成功${NC}"
        cd ..
    else
        echo -e "${RED}❌ 系統驗證失敗${NC}"
        cd ..
        FAILED_STEPS=$((FAILED_STEPS + 1))
        return 1
    fi
    
    COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
}

# 顯示系統狀態
show_system_status() {
    echo -e "\n${PURPLE}📊 系統狀態總覽${NC}"
    echo "=================================================="
    
    # 顯示服務狀態
    echo -e "${CYAN}🐳 Docker 服務狀態:${NC}"
    echo "正在運行的電商系統容器:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(ecommerce|milvus)" || echo "未找到相關容器"
    
    # 顯示資料庫連線資訊
    echo -e "\n${CYAN}🔗 資料庫連線資訊:${NC}"
    echo "PostgreSQL: localhost:5432 (用戶: ecommerce_user, 密碼: ecommerce_password)"
    echo "MongoDB: localhost:27017 (用戶: ecommerce_user, 密碼: ecommerce_password)"
    echo "Redis: localhost:6379 (密碼: redis_password)"
    echo "MinIO: localhost:9000 (用戶: minioadmin, 密碼: minioadmin123)"
    echo "Milvus: localhost:19530 (用戶: root, 密碼: Milvus)"
    echo "ClickHouse: localhost:8123 (用戶: default, 密碼: clickhouse_password)"
    
    # 顯示測試資料統計
    echo -e "\n${CYAN}📈 測試資料統計:${NC}"
    echo "PostgreSQL: 13個用戶, 25個商品, 10個訂單"
    echo "MongoDB: 8個商品詳情, 3個前端配置, 8個系統日誌"
    echo "Redis: 6個Session, 6個購物車, 10個庫存快取"
    echo "MinIO: 25個商品圖片, 5個用戶頭像, 5個發票"
    echo "Milvus: 25個商品向量, 13個用戶向量, 25個搜尋歷史"
    echo "ClickHouse: 25個用戶行為事件, 16個銷售數據, 15個商品表現"
}

# 清理函數
cleanup() {
    echo -e "\n${YELLOW}🧹 清理臨時檔案...${NC}"
    rm -f /tmp/mc
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主函數
main() {
    local auto_mode=$1
    echo -e "${PURPLE}🎯 開始電商系統一鍵啟動...${NC}"
    echo -e "${YELLOW}此腳本將完成以下步驟:${NC}"
    echo "  1. 環境檢查"
    echo "  2. 安裝依賴"
    echo "  3. 清理現有數據"
    echo "  4. 檢查資料庫服務"
    echo "  5. 初始化資料庫"
    echo "  6. 生成測試資料"
    echo "  7. 驗證系統"
    echo ""
    
    # 檢查是否為自動模式
    if [ "$auto_mode" = "--auto" ] || [ "$auto_mode" = "-y" ]; then
        echo -e "${GREEN}✅ 自動模式，繼續執行...${NC}"
    else
        # 詢問用戶是否繼續
        read -p "是否繼續執行？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}❌ 用戶取消執行${NC}"
            exit 0
        fi
    fi
    
    # 執行各步驟
    check_environment || exit 1
    install_dependencies || exit 1
    clean_existing_data || exit 1
    check_database_services || exit 1
    initialize_databases || exit 1
    generate_test_data || exit 1
    verify_system || exit 1
    
    # 清理
    cleanup
    
    # 結果摘要
    echo -e "\n=================================================="
    echo -e "${GREEN}🎉 電商系統一鍵啟動完成！${NC}"
    echo "=================================================="
    echo -e "總步驟: $TOTAL_STEPS"
    echo -e "${GREEN}完成: $COMPLETED_STEPS${NC}"
    echo -e "${RED}失敗: $FAILED_STEPS${NC}"
    
    SUCCESS_RATE=$((COMPLETED_STEPS * 100 / TOTAL_STEPS))
    echo -e "成功率: $SUCCESS_RATE%"
    
    if [ $FAILED_STEPS -eq 0 ]; then
        echo -e "\n${GREEN}🎊 所有步驟都成功完成！${NC}"
        show_system_status
        
        echo -e "\n${CYAN}🚀 下一步操作:${NC}"
        echo "1. 查看服務狀態: docker-compose ps"
        echo "2. 查看服務日誌: docker-compose logs [service_name]"
        echo "3. 連接到資料庫進行開發"
        echo "4. 查看測試資料: 參考 test-data/README.md"
        
        echo -e "\n${YELLOW}💡 提示:${NC}"
        echo "- 所有服務都已啟動並準備就緒"
        echo "- 測試資料已生成並驗證通過"
        echo "- 可以開始進行電商系統開發"
        
        exit 0
    else
        echo -e "\n${RED}❌ 部分步驟失敗，請檢查錯誤訊息並重試${NC}"
        echo -e "\n${YELLOW}🔧 故障排除:${NC}"
        echo "1. 檢查 Docker 服務是否正常運行"
        echo "2. 檢查網路連線和埠號是否被占用"
        echo "3. 檢查系統資源（記憶體、磁碟空間）"
        echo "4. 查看詳細錯誤日誌: docker-compose logs"
        
        exit 1
    fi
}

# 錯誤處理
trap 'echo -e "\n${RED}❌ 腳本執行中斷${NC}"; cleanup; exit 1' INT TERM

# 執行主函數
main "$@"
