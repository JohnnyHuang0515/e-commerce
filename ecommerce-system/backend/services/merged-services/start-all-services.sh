#!/bin/bash

# merged-services 啟動腳本
# 作者: AI Assistant
# 日期: 2025-09-10

# 獲取腳本所在的絕對目錄路徑
SERVICES_ROOT=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SERVICES_ROOT/../../.." && pwd)

echo "🚀 啟動 merged-services 所有服務"
echo "=================================="
echo "📁 服務目錄: $SERVICES_ROOT"
echo "📁 專案根目錄: $PROJECT_ROOT"
echo ""

# 檢查 docker-compose.yml 文件是否存在
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 錯誤: docker-compose.yml 文件未找到！"
    echo "請確保在 ecommerce-system 目錄下運行此腳本."
    exit 1
fi

echo "🔄 停止舊服務..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

echo "🔨 重新構建服務..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "🚀 啟動所有服務..."
if docker compose -f "$COMPOSE_FILE" up -d; then
    echo "✅ 所有 merged-services 已成功啟動！"
    echo ""
    echo "📊 服務狀態:"
    echo "=================================="
    echo "🔐 AUTH-SERVICE:     http://localhost:3002"
    echo "📦 PRODUCT-SERVICE:  http://localhost:3001"
    echo "📋 ORDER-SERVICE:    http://localhost:3003"
    echo "🧠 AI-SERVICE:       http://localhost:3004"
    echo "⚙️  SYSTEM-SERVICE:  http://localhost:3005"
    echo "📊 ANALYTICS-SERVICE: http://localhost:3006"
    echo ""
    echo "🌐 API 網關 (Nginx): http://localhost:8080"
    echo "🔗 MinIO Console:    http://localhost:9011"
    echo "🔗 Mongo Express:    http://localhost:8081"
    echo ""
    echo "ℹ️  使用 'docker compose logs -f [service-name]' 查看特定服務日誌"
    echo "ℹ️  使用 './stop-all-services.sh' 停止所有服務"
else
    echo "❌ 服務啟動失敗！"
    echo "請檢查 Docker 是否正在運行，或查看錯誤日誌。"
    exit 1
fi
