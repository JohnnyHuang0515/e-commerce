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

# 提醒用戶手動停止前端服務
echo ""
echo "ℹ️  此腳本不會停止手動啟動的前端開發伺服器 (Vite)。"
echo "   如果它還在運行，請在對應的終端機視窗中按 Ctrl+C 來停止它。"
echo "======================================================"
echo "🎉 開發環境已停止。"