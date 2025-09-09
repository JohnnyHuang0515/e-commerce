#!/bin/bash

echo "🔍 檢查所有合併服務狀態..."
echo "=================================="

# 服務配置
declare -A SERVICES=(
    ["AUTH-SERVICE"]="3001"
    ["PRODUCT-SERVICE"]="3002"
    ["ORDER-SERVICE"]="3003"
    ["AI-SERVICE"]="3004"
    ["SYSTEM-SERVICE"]="3005"
    ["ANALYTICS-SERVICE"]="3007"
    ["DASHBOARD-SERVICE"]="3008"
)

# 檢查每個服務
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    echo -n "$service (Port $port): "
    
    # 檢查端口是否被佔用
    if lsof -i :$port > /dev/null 2>&1; then
        # 檢查健康端點
        if [ "$service" = "DASHBOARD-SERVICE" ]; then
            health_url="http://localhost:$port/api/v1/health"
        else
            health_url="http://localhost:$port/health"
        fi
        
        if curl -s $health_url > /dev/null 2>&1; then
            echo "✅ 運行中 (健康)"
        else
            echo "⚠️ 運行中 (健康檢查失敗)"
        fi
    else
        echo "❌ 未運行"
    fi
done

echo "=================================="

# 檢查資料庫狀態
echo ""
echo "🗄️ 資料庫狀態檢查："
echo "--------------------------------"

# 檢查 PostgreSQL
echo -n "PostgreSQL (Port 5432): "
if pg_isready -h localhost -p 5432 -U admin > /dev/null 2>&1; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

# 檢查 MongoDB
echo -n "MongoDB (Port 27017): "
if pgrep -x "mongod" > /dev/null; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

echo "=================================="

# 顯示服務 URL
echo ""
echo "🌐 服務 URL："
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    echo "  - $service: http://localhost:$port"
done

echo ""
echo "📚 API 文檔："
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    echo "  - $service: http://localhost:$port/api-docs"
done
