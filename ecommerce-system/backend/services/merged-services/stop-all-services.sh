#!/bin/bash

echo "🛑 停止所有合併服務..."

# 確保在正確的目錄
cd "$(dirname "$0")"

# 停止所有 Node.js 服務
echo "🔍 查找並停止 Node.js 服務..."

# 停止特定端口的服務
PORTS=(3001 3002 3003 3004 3005 3007 3008)

for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "🛑 停止端口 $port 的服務 (PID: $PID)..."
        kill -TERM $PID 2>/dev/null
        sleep 2
        
        # 如果還在運行，強制殺死
        if kill -0 $PID 2>/dev/null; then
            echo "⚠️ 強制停止端口 $port 的服務..."
            kill -KILL $PID 2>/dev/null
        fi
    fi
done

# 停止所有相關的 Node.js 進程
echo "🔍 停止所有相關的 Node.js 進程..."
pkill -f "node.*app.js" 2>/dev/null || true

# 等待進程完全停止
sleep 3

echo "✅ 所有服務已停止"
echo ""
echo "📋 檢查剩餘進程："
lsof -i :3001,3002,3003,3004,3005,3007,3008 2>/dev/null || echo "✅ 沒有服務在運行"
