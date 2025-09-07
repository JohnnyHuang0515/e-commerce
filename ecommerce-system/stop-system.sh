#!/bin/bash

# 電商系統一鍵停止腳本
# 作者: AI Assistant
# 日期: 2025-09-06

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 獲取腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${RED}🛑 電商系統一鍵停止${NC}"
echo -e "${RED}================================${NC}"
echo ""

# 停止前端服務
echo -e "${YELLOW}🔄 停止前端服務...${NC}"
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo -e "${GREEN}✅ 前端服務已停止${NC}"

# 停止所有微服務
echo -e "${YELLOW}🔄 停止所有微服務...${NC}"

# 停止各個服務
services=(
    "product-service:3001"
    "order-service:3002" 
    "user-service:3003"
    "auth-service:3005"
    "analytics-service:3006"
    "settings-service:3007"
    "minio-service:3008"
    "payment-service:3009"
    "logistics-service:3010"
    "dashboard-service:3011"
    "inventory-service:3012"
    "permission-service:3013"
    "ai-search-service:3014"
    "notification-service:3017"
    "log-service:3018"
    "utility-service:3019"
)

for service_info in "${services[@]}"; do
    service_name=$(echo $service_info | cut -d: -f1)
    port=$(echo $service_info | cut -d: -f2)
    
    echo -e "${BLUE}🔄 停止 $service_name (端口 $port)...${NC}"
    
    # 根據端口停止進程
    pkill -f ":$port" 2>/dev/null || true
    
    # 停止特定服務進程
    case $service_name in
        "ai-search-service")
            pkill -f "uvicorn.*ai-search" 2>/dev/null || true
            pkill -f "python.*ai-search" 2>/dev/null || true
            ;;
        *)
            pkill -f "node.*$service_name" 2>/dev/null || true
            pkill -f "nodemon.*$service_name" 2>/dev/null || true
            ;;
    esac
done

echo -e "${GREEN}✅ 所有微服務已停止${NC}"

# 停止 MinIO
echo -e "${YELLOW}🔄 停止 MinIO 服務器...${NC}"
pkill -f "minio server" 2>/dev/null || true
echo -e "${GREEN}✅ MinIO 服務器已停止${NC}"

# 清理進程
echo -e "${YELLOW}🔄 清理殘留進程...${NC}"
pkill -f "node.*service" 2>/dev/null || true
pkill -f "node src/app.js" 2>/dev/null || true

echo ""
echo -e "${GREEN}🎉 系統停止完成!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ 所有服務已停止${NC}"
echo -e "${GREEN}✅ 所有進程已清理${NC}"
echo ""
echo -e "${YELLOW}💡 重新啟動系統: ./start-system.sh${NC}"
