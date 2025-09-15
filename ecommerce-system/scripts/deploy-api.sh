#!/bin/bash

# 電商平台 API 服務部署腳本
# 支援統一 Node.js 主服務架構

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查必要工具
check_requirements() {
    log_info "檢查必要工具..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    log_success "必要工具檢查完成"
}

# 停止現有服務
stop_existing_services() {
    log_info "停止現有服務..."
    
    # 停止舊的服務
    if [ -f "docker-compose.yml" ]; then
        docker compose down --remove-orphans || true
    fi
    
    # 停止新的 API 服務
    if [ -f "docker-compose-api.yml" ]; then
        docker compose -f docker-compose-api.yml down --remove-orphans || true
    fi
    
    log_success "現有服務已停止"
}

# 檢查端口衝突
check_port_conflicts() {
    log_info "檢查端口衝突..."
    
    local ports=(80 443 5432 27017 6379 8123 8000 8001 9000 9001 9002 19530)
    
    for port in "${ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep ":$port " > /dev/null; then
            log_warning "端口 $port 已被佔用"
            # 詢問是否繼續
            read -p "是否繼續部署？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "部署已取消"
                exit 1
            fi
        fi
    done
    
    log_success "端口檢查完成"
}

# 創建必要的目錄
create_directories() {
    log_info "創建必要的目錄..."
    
    mkdir -p backend-node/uploads
    mkdir -p nginx/ssl
    mkdir -p logs/api
    mkdir -p logs/nginx
    
    log_success "目錄創建完成"
}

# 設置環境變數
setup_environment() {
    log_info "設置環境變數..."
    
    if [ ! -f "backend-node/.env" ]; then
        if [ -f "backend-node/env.example" ]; then
            cp backend-node/env.example backend-node/.env
            log_success "已創建 .env 檔案"
        else
            log_warning ".env 檔案不存在，請手動創建"
        fi
    fi
    
    log_success "環境變數設置完成"
}

# 構建 Docker 映像
build_images() {
    log_info "構建 Docker 映像..."
    
    # 構建 API 服務映像
    docker compose -f docker-compose-api.yml build --no-cache
    
    log_success "Docker 映像構建完成"
}

# 啟動資料庫服務
start_databases() {
    log_info "啟動資料庫服務..."
    
    # 只啟動資料庫服務
    docker compose -f docker-compose-api.yml up -d postgres mongo redis clickhouse
    
    # 等待資料庫啟動
    log_info "等待資料庫啟動..."
    sleep 30
    
    # 檢查資料庫連接
    check_database_connections
    
    log_success "資料庫服務啟動完成"
}

# 檢查資料庫連接
check_database_connections() {
    log_info "檢查資料庫連接..."
    
    # 檢查 PostgreSQL
    if docker compose -f docker-compose-api.yml exec postgres pg_isready -U admin -d ecommerce_new; then
        log_success "PostgreSQL 連接正常"
    else
        log_error "PostgreSQL 連接失敗"
        exit 1
    fi
    
    # 檢查 MongoDB
    if docker compose -f docker-compose-api.yml exec mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_success "MongoDB 連接正常"
    else
        log_error "MongoDB 連接失敗"
        exit 1
    fi
    
    # 檢查 Redis
    if docker compose -f docker-compose-api.yml exec redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis 連接正常"
    else
        log_error "Redis 連接失敗"
        exit 1
    fi
    
    # 檢查 ClickHouse
    if curl -s http://localhost:8123/ping | grep -q "Ok"; then
        log_success "ClickHouse 連接正常"
    else
        log_error "ClickHouse 連接失敗"
        exit 1
    fi
}

# 部署資料庫架構
deploy_database_schema() {
    log_info "部署資料庫架構..."
    
    # 部署 PostgreSQL 架構
    if [ -f "scripts/new-database-schema.sql" ]; then
        docker compose -f docker-compose-api.yml exec -T postgres psql -U admin -d ecommerce_new < scripts/new-database-schema.sql
        log_success "PostgreSQL 架構部署完成"
    else
        log_warning "PostgreSQL 架構檔案不存在"
    fi
    
    # 部署 MongoDB 集合
    if [ -f "scripts/mongodb-collections-init.js" ]; then
        docker compose -f docker-compose-api.yml exec -T mongo mongo --authenticationDatabase admin -u admin -p password123 ecommerce < scripts/mongodb-collections-init.js
        log_success "MongoDB 集合部署完成"
    else
        log_warning "MongoDB 集合檔案不存在"
    fi
    
    # 部署 ClickHouse 架構
    if [ -f "scripts/clickhouse-schema.sql" ]; then
        curl -X POST 'http://localhost:8123/' --data-binary @scripts/clickhouse-schema.sql
        log_success "ClickHouse 架構部署完成"
    else
        log_warning "ClickHouse 架構檔案不存在"
    fi
}

# 啟動 API 服務
start_api_services() {
    log_info "啟動 API 服務..."
    
    # 啟動所有服務
    docker compose -f docker-compose-api.yml up -d
    
    # 等待服務啟動
    log_info "等待 API 服務啟動..."
    sleep 20
    
    # 檢查服務狀態
    check_service_health
    
    log_success "API 服務啟動完成"
}

# 檢查服務健康狀態
check_service_health() {
    log_info "檢查服務健康狀態..."
    
    # 檢查 API 服務
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        log_success "API 服務健康檢查通過"
    else
        log_error "API 服務健康檢查失敗"
        exit 1
    fi
    
    # 檢查 Nginx
    if curl -s http://localhost/api-docs | grep -q "swagger"; then
        log_success "Nginx 代理正常"
    else
        log_warning "Nginx 代理可能未正常啟動"
    fi
}

# 顯示服務狀態
show_service_status() {
    log_info "服務狀態："
    
    echo ""
    echo "=== Docker 容器狀態 ==="
    docker compose -f docker-compose-api.yml ps
    
    echo ""
    echo "=== 服務端點 ==="
    echo "🌐 API 文檔: http://localhost/api-docs"
    echo "🔍 健康檢查: http://localhost/health"
    echo "🔐 認證服務: http://localhost/api/v1/auth"
    echo "👥 用戶管理: http://localhost/api/v1/users"
    echo "📦 商品管理: http://localhost/api/v1/products"
    echo "📋 訂單管理: http://localhost/api/v1/orders"
    echo "🛒 購物車: http://localhost/api/v1/cart"
    echo "🤖 推薦服務: http://localhost/api/v1/recommendations"
    echo "📊 分析服務: http://localhost/analytics/"
    
    echo ""
    echo "=== 資料庫連接 ==="
    echo "🐘 PostgreSQL: localhost:5432"
    echo "🍃 MongoDB: localhost:27017"
    echo "🔴 Redis: localhost:6379"
    echo "📈 ClickHouse: localhost:8123"
    echo "🔍 Milvus: localhost:19530"
    echo "📁 MinIO: localhost:9001"
}

# 清理函數
cleanup() {
    log_info "清理資源..."
    
    # 停止服務
    docker compose -f docker-compose-api.yml down --remove-orphans
    
    log_success "清理完成"
}

# 主函數
main() {
    echo "🚀 電商平台 API 服務部署腳本"
    echo "=================================="
    
    # 檢查參數
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            stop_existing_services
            check_port_conflicts
            create_directories
            setup_environment
            build_images
            start_databases
            deploy_database_schema
            start_api_services
            show_service_status
            ;;
        "start")
            log_info "啟動服務..."
            docker compose -f docker-compose-api.yml up -d
            show_service_status
            ;;
        "stop")
            log_info "停止服務..."
            docker compose -f docker-compose-api.yml down
            ;;
        "restart")
            log_info "重啟服務..."
            docker compose -f docker-compose-api.yml restart
            show_service_status
            ;;
        "status")
            show_service_status
            ;;
        "logs")
            docker compose -f docker-compose-api.yml logs -f
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "用法: $0 {deploy|start|stop|restart|status|logs|cleanup}"
            echo ""
            echo "命令說明:"
            echo "  deploy   - 完整部署（預設）"
            echo "  start    - 啟動服務"
            echo "  stop     - 停止服務"
            echo "  restart  - 重啟服務"
            echo "  status   - 顯示服務狀態"
            echo "  logs     - 查看服務日誌"
            echo "  cleanup  - 清理資源"
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@"
