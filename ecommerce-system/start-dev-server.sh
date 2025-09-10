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
    
    echo "📊 步驟 3: 啟動所有服務..."
    if docker compose -f "$COMPOSE_FILE" up -d --no-deps product-service auth-service ai-service order-service system-service analytics-service notification-service log-service utility-service dashboard-service; then
        echo "✅ 服務啟動完成"
        echo ""
        
        echo "📊 步驟 4: 啟動前端網關..."
        if docker compose -f "$COMPOSE_FILE" up -d --no-deps nginx; then
            echo "✅ 前端網關啟動完成"
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
            echo "❌ 前端網關啟動失敗."
            exit 1
        fi
    else
        echo "❌ 服務啟動失敗."
        exit 1
    fi
else
    echo "❌ 資料庫啟動失敗."
    exit 1
fi