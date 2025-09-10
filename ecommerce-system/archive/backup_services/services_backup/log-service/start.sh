#!/bin/bash

# Log Service 啟動腳本

echo "📝 啟動 Log Service..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝"
    exit 1
fi

# 檢查 MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB 未安裝，將使用模擬模式"
fi

# 安裝依賴
echo "📦 安裝依賴..."
npm install

# 創建日誌目錄
mkdir -p logs

# 設置環境變數
export NODE_ENV=${NODE_ENV:-development}
export PORT=${PORT:-3018}
export WS_PORT=${WS_PORT:-3020}
export MONGODB_URI=${MONGODB_URI:-mongodb://admin:password123@localhost:27017/ecommerce_logs?authSource=admin}

echo "🚀 啟動 Log Service..."
echo "   - HTTP API: http://localhost:${PORT}"
echo "   - WebSocket: ws://localhost:${WS_PORT}"
echo "   - MongoDB: ${MONGODB_URI}"

# 啟動服務
if [ "$NODE_ENV" = "development" ]; then
    npm run dev
else
    npm start
fi
