#!/bin/bash

echo "🚀 啟動所有合併服務..."

# 檢查並啟動 PostgreSQL
echo "🔍 檢查 PostgreSQL 狀態..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "📦 嘗試啟動 PostgreSQL..."
    # 嘗試直接啟動 PostgreSQL
    pg_ctl start -D /var/lib/postgresql/data 2>/dev/null || {
        echo "⚠️ PostgreSQL 啟動失敗，請手動啟動"
        echo "⚠️ 服務將在有限模式下運行"
    }
    sleep 3
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo "✅ PostgreSQL 已啟動"
    else
        echo "⚠️ PostgreSQL 可能未運行，服務將在有限模式下運行"
    fi
else
    echo "✅ PostgreSQL 正在運行"
fi

# 檢查並啟動 MongoDB
echo "🔍 檢查 MongoDB 狀態..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 嘗試啟動 MongoDB..."
    # 嘗試直接啟動 MongoDB
    mongod --fork --logpath /tmp/mongod.log --dbpath /tmp/mongodb 2>/dev/null || {
        echo "⚠️ MongoDB 啟動失敗，服務將在有限模式下運行"
        MONGO_AVAILABLE=false
    }
    if [ "$MONGO_AVAILABLE" != "false" ]; then
        sleep 3
        if pgrep -x "mongod" > /dev/null; then
            echo "✅ MongoDB 已啟動"
        else
            echo "⚠️ MongoDB 啟動可能失敗，服務將在有限模式下運行"
        fi
    fi
else
    echo "✅ MongoDB 正在運行"
fi

# 確保在正確的目錄
cd "$(dirname "$0")"

# 啟動 AUTH-SERVICE
echo "📡 啟動 AUTH-SERVICE (Port 3001)..."
cd auth-service && nohup node src/app.js > ../logs/auth-service.log 2>&1 &
AUTH_PID=$!
cd ..

# 等待3秒
sleep 3

# 啟動 PRODUCT-SERVICE
echo "📦 啟動 PRODUCT-SERVICE (Port 3002)..."
cd product-service && nohup node src/app.js > ../logs/product-service.log 2>&1 &
PRODUCT_PID=$!
cd ..

# 等待3秒
sleep 3

# 啟動 ORDER-SERVICE
echo "🛒 啟動 ORDER-SERVICE (Port 3003)..."
cd order-service && nohup node src/app.js > ../logs/order-service.log 2>&1 &
ORDER_PID=$!
cd ..

# 等待3秒
sleep 3

# 啟動 AI-SERVICE
echo "🤖 啟動 AI-SERVICE (Port 3004)..."
cd ai-service && nohup node src/app.js > ../logs/ai-service.log 2>&1 &
AI_PID=$!
cd ..

# 等待3秒
sleep 3

# 啟動 SYSTEM-SERVICE
echo "⚙️ 啟動 SYSTEM-SERVICE (Port 3005)..."
cd system-service && nohup node src/app.js > ../logs/system-service.log 2>&1 &
SYSTEM_PID=$!
cd ..

# 等待所有服務啟動
echo "⏳ 等待服務啟動..."
sleep 5

# 檢查服務狀態
echo ""
echo "🔍 檢查服務狀態..."
echo "=================================="

# 檢查 AUTH-SERVICE
echo -n "AUTH-SERVICE (3001): "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

# 檢查 PRODUCT-SERVICE
echo -n "PRODUCT-SERVICE (3002): "
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

# 檢查 ORDER-SERVICE
echo -n "ORDER-SERVICE (3003): "
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

# 檢查 AI-SERVICE
echo -n "AI-SERVICE (3004): "
if curl -s http://localhost:3004/health > /dev/null 2>&1; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

# 檢查 SYSTEM-SERVICE
echo -n "SYSTEM-SERVICE (3005): "
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ 運行中"
else
    echo "❌ 未運行"
fi

echo "=================================="
echo "🎉 服務啟動完成！"
echo ""
echo "📋 服務列表："
echo "  - AUTH-SERVICE:    http://localhost:3001"
echo "  - PRODUCT-SERVICE: http://localhost:3002"
echo "  - ORDER-SERVICE:   http://localhost:3003"
echo "  - AI-SERVICE:      http://localhost:3004"
echo "  - SYSTEM-SERVICE:  http://localhost:3005"
echo ""
echo "📚 API 文檔："
echo "  - AUTH-SERVICE:    http://localhost:3001/api-docs"
echo "  - PRODUCT-SERVICE: http://localhost:3002/api-docs"
echo "  - ORDER-SERVICE:   http://localhost:3003/api-docs"
echo "  - AI-SERVICE:      http://localhost:3004/api-docs"
echo "  - SYSTEM-SERVICE:  http://localhost:3005/api-docs"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
wait
