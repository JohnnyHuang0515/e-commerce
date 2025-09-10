#!/bin/bash

# merged-services 停止腳本
# 作者: AI Assistant
# 日期: 2025-09-10

# 獲取腳本所在的絕對目錄路徑
SERVICES_ROOT=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SERVICES_ROOT/../../.." && pwd)

echo "🛑 停止 merged-services 所有服務"
echo "=================================="
echo "📁 服務目錄: $SERVICES_ROOT"
echo "📁 專案根目錄: $PROJECT_ROOT"
echo ""

# 檢查 docker-compose.yml 文件是否存在
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 錯誤: docker-compose.yml 文件未找到！"
    echo "無法確定要停止哪些服務。"
    exit 1
fi

echo "🔄 停止所有服務..."
if docker compose -f "$COMPOSE_FILE" down --remove-orphans; then
    echo "✅ 所有 merged-services 已成功停止！"
    echo ""
    echo "🧹 清理完成："
    echo "   - 所有容器已停止"
    echo "   - 網路已移除"
    echo "   - 孤立容器已清理"
    echo ""
    echo "ℹ️  如需重新啟動，請使用 './start-all-services.sh'"
else
    echo "⚠️  停止服務時發生錯誤。"
    echo "請檢查 Docker 是否正在運行，或手動執行 'docker compose down'。"
    exit 1
fi
