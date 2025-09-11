#!/bin/bash

# 統一開發環境停止腳本
# 作者: Gemini
# 日期: 2025-09-10 (最終版)

# 獲取腳本所在的絕對目錄路徑
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)

echo "🛑 正在停止所有由 docker-compose.yml 啟動的服務..."
echo "======================================================"

# 檢查 docker-compose.yml 文件是否存在
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 錯誤: docker-compose.yml 文件未找到！"
    echo "無法確定要停止哪些服務。"
    exit 1
fi

# 使用 docker compose down 來停止並移除所有容器、網路
# --remove-orphans 參數可以清理掉不再需要的舊容器
if docker compose -f "$COMPOSE_FILE" down --remove-orphans; then
    echo "✅ 所有服務已成功停止並移除。"
else
    echo "⚠️  停止服務時發生錯誤。"
    echo "   請檢查 Docker 是否正在運行，或手動執行 'docker compose down'。 "
fi

echo ""
echo "🔧 清理前端開發服務器..."
# 清理所有相關的 Node.js 進程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true

echo "🔧 清理端口占用..."
# 清理可能占用的端口
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 8080 8081 9011)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "   終止進程 $PID (端口 $port)"
        kill -9 $PID 2>/dev/null || true
    fi
done

echo "✅ 清理完成。"
echo "======================================================"
echo "🎉 開發環境已停止。"