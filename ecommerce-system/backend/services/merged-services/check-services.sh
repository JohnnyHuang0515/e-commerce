#!/bin/bash

# merged-services 狀態檢查腳本
# 作者: AI Assistant
# 日期: 2025-09-10

# 獲取腳本所在的絕對目錄路徑
SERVICES_ROOT=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SERVICES_ROOT/../../.." && pwd)

echo "📊 merged-services 狀態檢查"
echo "============================"
echo "📁 服務目錄: $SERVICES_ROOT"
echo "📁 專案根目錄: $PROJECT_ROOT"
echo ""

# 檢查 docker-compose.yml 文件是否存在
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 錯誤: docker-compose.yml 文件未找到！"
    exit 1
fi

echo "🔍 檢查容器狀態..."
echo "===================="
docker ps --filter "name=ecommerce-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(auth|product|order|ai|system|analytics)"

echo ""
echo "🧪 測試服務健康檢查..."
echo "======================="

# 定義服務列表
declare -A services=(
    ["AUTH-SERVICE"]="3002"
    ["PRODUCT-SERVICE"]="3001"
    ["ORDER-SERVICE"]="3003"
    ["AI-SERVICE"]="3004"
    ["SYSTEM-SERVICE"]="3005"
    ["ANALYTICS-SERVICE"]="3006"
)

# 測試每個服務
for service in "${!services[@]}"; do
    port="${services[$service]}"
    echo -n "🔍 $service (:$port): "
    
    if curl -s --max-time 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ 健康"
    else
        echo "❌ 無回應"
    fi
done

echo ""
echo "🌐 測試 API 網關..."
echo "==================="
echo -n "🔍 Nginx (8080): "
if curl -s --max-time 5 "http://localhost:8080/health" > /dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 無回應"
fi

echo ""
echo "📋 服務摘要"
echo "============"
echo "🔐 AUTH-SERVICE:     http://localhost:3002"
echo "📦 PRODUCT-SERVICE:  http://localhost:3001"
echo "📋 ORDER-SERVICE:    http://localhost:3003"
echo "🧠 AI-SERVICE:       http://localhost:3004"
echo "⚙️  SYSTEM-SERVICE:  http://localhost:3005"
echo "📊 ANALYTICS-SERVICE: http://localhost:3006"
echo "🌐 API 網關:         http://localhost:8080"
echo ""
echo "ℹ️  使用 'docker compose logs -f [service-name]' 查看詳細日誌"
echo "ℹ️  使用 './start-all-services.sh' 重新啟動所有服務"
