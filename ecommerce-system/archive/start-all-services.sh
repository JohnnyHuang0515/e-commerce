#!/bin/bash

# 後端微服務統一啟動腳本
# 作者: AI Assistant
# 日期: 2025-01-27

# 獲取腳本所在目錄
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SERVICES_DIR="$SCRIPT_DIR"

echo "🚀 啟動電商系統後端微服務..."
echo "========================================"

# 定義服務列表和對應的端口
declare -A SERVICES=(
    ["product-service"]="3001"
    ["auth-service"]="3002"
    ["order-service"]="3003"
    ["ai-service"]="3004"
    ["system-service"]="3005"
    ["analytics-service"]="3006"
    ["dashboard-service"]="3007"
)

# 檢查 Node.js 環境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝或未在 PATH 中"
    exit 1
fi

# 檢查 npm 環境
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝或未在 PATH 中"
    exit 1
fi

echo "📦 檢查並安裝依賴..."
for service in "${!SERVICES[@]}"; do
    service_dir="$SERVICES_DIR/$service"
    if [ -d "$service_dir" ]; then
        echo "  📁 檢查 $service 依賴..."
        if [ -f "$service_dir/package.json" ]; then
            (cd "$service_dir" && npm install --silent)
        fi
    fi
done

echo "🔧 啟動各微服務..."
echo "----------------------------------------"

# 啟動每個服務
for service in "${!SERVICES[@]}"; do
    service_dir="$SERVICES_DIR/$service"
    port="${SERVICES[$service]}"
    
    if [ -d "$service_dir" ]; then
        echo "🚀 啟動 $service (端口: $port)..."
        
        # 檢查服務是否已在運行
        if lsof -i:$port -sTCP:LISTEN > /dev/null 2>&1; then
            echo "  ⚠️  端口 $port 已被佔用，嘗試終止舊進程..."
            # 找到佔用端口的進程並終止
            OLD_PID=$(lsof -ti:$port)
            if [ ! -z "$OLD_PID" ]; then
                echo "  🔄 終止舊進程 PID: $OLD_PID"
                kill -9 $OLD_PID 2>/dev/null
                sleep 2
                # 再次檢查端口是否釋放
                if lsof -i:$port -sTCP:LISTEN > /dev/null 2>&1; then
                    echo "  ❌ 無法釋放端口 $port，跳過 $service"
                    continue
                else
                    echo "  ✅ 端口 $port 已釋放"
                fi
            else
                echo "  ❌ 無法找到佔用端口的進程，跳過 $service"
                continue
            fi
        fi
        
        # 啟動服務
        if [ -f "$service_dir/src/app.js" ]; then
            (cd "$service_dir" && node src/app.js > "$SERVICES_DIR/logs/${service}.log" 2>&1) &
            SERVICE_PID=$!
            echo "  ✅ $service 已啟動 (PID: $SERVICE_PID, 端口: $port)"
        elif [ -f "$service_dir/app.js" ]; then
            (cd "$service_dir" && node app.js > "$SERVICES_DIR/logs/${service}.log" 2>&1) &
            SERVICE_PID=$!
            echo "  ✅ $service 已啟動 (PID: $SERVICE_PID, 端口: $port)"
        else
            echo "  ❌ 找不到 $service 的啟動文件 (app.js 或 src/app.js)"
        fi
    else
        echo "  ⚠️  服務目錄不存在: $service_dir"
    fi
done

echo "----------------------------------------"
echo "⏳ 等待服務初始化 (10秒)..."
sleep 10

echo "🔍 檢查服務狀態..."
echo "----------------------------------------"

# 檢查服務是否正常運行
for service in "${!SERVICES[@]}"; do
    port="${SERVICES[$service]}"
    if lsof -i:$port -sTCP:LISTEN > /dev/null 2>&1; then
        echo "✅ $service 正在端口 $port 上運行"
    else
        echo "❌ $service 未在端口 $port 上運行"
    fi
done

echo "========================================"
echo "🎉 後端微服務啟動完成！"
echo ""
echo "📊 服務狀態:"
for service in "${!SERVICES[@]}"; do
    port="${SERVICES[$service]}"
    echo "  🔗 $service: http://localhost:$port"
done
echo ""
echo "📝 日誌文件位置: $SERVICES_DIR/logs/"
echo "🛑 使用 'pkill -f \"node.*app.js\"' 停止所有服務"
