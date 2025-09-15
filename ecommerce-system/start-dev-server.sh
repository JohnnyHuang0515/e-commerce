#!/bin/bash

# 統一開發環境啟動腳本
# 作者: Gemini
# 日期: 2025-09-10 (最終版)

# 獲取腳本所在的絕對目錄路徑
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)

echo "🧹 正在清理舊的開發環境..."
# 確保停止腳本有執行權限
chmod +x "$PROJECT_ROOT/stop-dev-server.sh"
# 執行停止腳本
"$PROJECT_ROOT/stop-dev-server.sh"

echo "🔧 停止系統 PostgreSQL 服務..."
# 停止系統級的 PostgreSQL 服務以避免端口衝突
sudo systemctl stop postgresql@14-main 2>/dev/null || true
sudo systemctl stop postgresql@15-main 2>/dev/null || true
sudo systemctl stop postgresql 2>/dev/null || true

echo "🔧 清理端口占用..."
# 清理可能占用的端口
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 8080 8081 9011 5432 27017 6379 9000)
for port in "${PORTS[@]}"; do
    echo "   清理端口 $port..."
    # 查找並終止占用端口的進程
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "   終止進程 $PID (端口 $port)"
        kill -9 $PID 2>/dev/null || true
    fi
    
    # 特別處理 PostgreSQL 端口
    if [ "$port" = "5432" ]; then
        echo "   特別清理 PostgreSQL 端口 5432..."
        # 使用 netstat 查找並終止
        NETSTAT_PID=$(netstat -tlnp | grep :5432 | awk '{print $7}' | cut -d'/' -f1 | head -1)
        if [ ! -z "$NETSTAT_PID" ] && [ "$NETSTAT_PID" != "-" ]; then
            echo "   終止 PostgreSQL 進程 $NETSTAT_PID"
            kill -9 $NETSTAT_PID 2>/dev/null || true
        fi
        
        # 使用 ss 命令查找並終止
        SS_PID=$(ss -tlnp | grep :5432 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
        if [ ! -z "$SS_PID" ] && [ "$SS_PID" != "-" ]; then
            echo "   終止 PostgreSQL 進程 $SS_PID"
            kill -9 $SS_PID 2>/dev/null || true
        fi
        
        # 強制終止所有 postgres 相關進程
        pkill -f postgres 2>/dev/null || true
        echo "   等待端口釋放..."
        sleep 2
    fi
done

echo "🔧 清理 Node.js 進程..."
# 清理所有相關的 Node.js 進程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true

echo "🔧 清理 Docker 容器..."
# 強制清理所有相關容器
docker compose -f "$PROJECT_ROOT/docker-compose.yml" down --remove-orphans 2>/dev/null || true

echo "⏳ 等待清理完成..."
sleep 3

echo "✅ 清理完成."
echo ""

echo "🚀 按照邏輯順序啟動服務..."
echo "============================================================"

# 檢查 docker-compose.yml 文件是否存在
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 錯誤: docker-compose.yml 文件未找到！"
    echo "請確保你在 'ecommerce-system' 目錄下運行此腳本."
    exit 1
fi

echo "📊 步驟 1: 啟動所有資料庫..."
if docker compose -f "$COMPOSE_FILE" up -d --no-deps mongodb postgresql redis clickhouse milvus-etcd milvus-minio milvus-standalone minio-files mongo-express; then
    echo "✅ 資料庫啟動完成"
    echo ""
    
    echo "📊 步驟 2: 等待資料庫初始化..."
    sleep 10
    
    echo "📊 步驟 2.5: 清理舊資料並灌入測試資料..."
    cd "$PROJECT_ROOT"
    
    # 檢查 Node.js 依賴是否已安裝
    if [ ! -d "node_modules" ]; then
        echo "📦 安裝 Node.js 依賴..."
        npm install
    fi
    
    echo "🧹 清理 MongoDB 舊資料..."
    # 清理 MongoDB 中的舊資料
    if docker exec ecommerce-mongodb mongosh ecommerce -u admin -p password123 --authenticationDatabase admin --eval "
        db.products.deleteMany({});
        db.categories.deleteMany({});
        db.analytics.deleteMany({});
        db.dashboardoverviews.deleteMany({});
        db.userbehaviors.deleteMany({});
        db.systemhealths.deleteMany({});
        db.images.deleteMany({});
        print('MongoDB 資料清理完成');
    " >/dev/null 2>&1; then
        echo "✅ MongoDB 資料清理成功"
    else
        echo "⚠️  MongoDB 清理失敗，但繼續執行..."
    fi
    
    echo "🧹 清理 PostgreSQL 舊資料..."
    # 清理 PostgreSQL 中的舊資料
    if docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -c "
        TRUNCATE TABLE order_items, orders, users, inventory, payments, logistics CASCADE;
    " >/dev/null 2>&1; then
        echo "✅ PostgreSQL 資料清理成功"
    else
        echo "⚠️  PostgreSQL 清理失敗，但繼續執行..."
    fi
    
    echo "📊 灌入新的測試資料..."
    # 執行測試資料灌入
    if node scripts/seed-test-data.js; then
        echo "✅ 測試資料灌入完成"
        echo ""
    else
        echo "❌ 測試資料灌入失敗，但繼續啟動服務..."
        echo ""
    fi
    
    echo "📊 步驟 3: 啟動所有服務 (包含 API 網關)..."
    if docker compose -f "$COMPOSE_FILE" up -d --no-deps product-service auth-service ai-service order-service system-service analytics-service notification-service log-service utility-service dashboard-service nginx; then
        echo "✅ 所有服務啟動完成"
        echo ""
        echo "🎉 開發環境啟動完成！"
        echo "============================================================"
        echo ""
        echo "🔗 API 網關 (Nginx): http://localhost:8080"
        echo "   (所有 API 請求和前端頁面都應透過此地址訪問)"
        echo ""
        echo "📊 merged-services 狀態:"
        echo "   🔐 AUTH-SERVICE:     http://localhost:3002"
        echo "   📦 PRODUCT-SERVICE:  http://localhost:3001"
        echo "   📋 ORDER-SERVICE:    http://localhost:3003"
        echo "   🧠 AI-SERVICE:       http://localhost:3004"
        echo "   ⚙️  SYSTEM-SERVICE:  http://localhost:3005"
        echo "   📊 ANALYTICS-SERVICE: http://localhost:3006"
        echo "   📊 DASHBOARD-SERVICE: http://localhost:3008"
        echo ""
        echo "ℹ️  前端開發伺服器 (Vite) 需要您手動啟動:"
        echo "   1. cd frontend"
        echo "   2. npm run dev"
        echo ""
        echo "🔗 MinIO Console: http://localhost:9011"
        echo "🔗 Mongo Express: http://localhost:8081"
        echo ""
        echo "ℹ️  你可以使用 'docker compose logs -f' 來查看服務日誌."
        echo "   或使用 '$PROJECT_ROOT/stop-dev-server.sh' 來停止所有服務."
    else
        echo "❌ 服務啟動失敗."
        exit 1
    fi
else
    echo "❌ 資料庫啟動失敗."
    exit 1
fi