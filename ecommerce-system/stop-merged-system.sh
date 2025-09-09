#!/bin/bash

# 電商系統合併服務停止腳本
# 作者: AI Assistant
# 日期: 2025-01-08

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 電商系統合併服務停止腳本${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 停止函數
stop_service() {
    local service_name=$1
    local port=$2
    
    echo -e "${YELLOW}🔄 停止 $service_name (端口 $port)...${NC}"
    
    # 查找並停止佔用端口的進程
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}   找到進程 PID: $pid${NC}"
        kill -TERM $pid 2>/dev/null || true
        
        # 等待進程優雅關閉
        local count=0
        while [ $count -lt 10 ]; do
            if ! kill -0 $pid 2>/dev/null; then
                echo -e "${GREEN}✅ $service_name 已停止${NC}"
                return 0
            fi
            sleep 1
            count=$((count + 1))
        done
        
        # 強制終止
        echo -e "${YELLOW}   強制終止 $service_name...${NC}"
        kill -KILL $pid 2>/dev/null || true
        echo -e "${GREEN}✅ $service_name 已強制停止${NC}"
    else
        echo -e "${YELLOW}   $service_name 未運行${NC}"
    fi
}

# 停止所有合併服務
echo -e "${YELLOW}📋 停止合併服務...${NC}"

stop_service "AUTH-SERVICE" 3001
stop_service "PRODUCT-SERVICE" 3002
stop_service "ORDER-SERVICE" 3003
stop_service "AI-SERVICE" 3004
stop_service "SYSTEM-SERVICE" 3005

# 停止前端服務
echo -e "${YELLOW}📋 停止前端服務...${NC}"

stop_service "FRONTEND" 3000
stop_service "FRONTEND-ALT" 3016

# 停止其他可能的服務
echo -e "${YELLOW}📋 停止其他服務...${NC}"

# 停止所有 Node.js 進程 (謹慎使用)
echo -e "${YELLOW}🔄 檢查並停止 Node.js 進程...${NC}"
pkill -f "node.*merged-services" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

echo ""
echo -e "${GREEN}🎉 所有服務已停止!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ 合併服務系統停止完成${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "${BLUE}• 如需重新啟動，請執行: ./start-merged-system.sh${NC}"
echo -e "${BLUE}• 查看日誌: tail -f logs/*.log${NC}"
echo ""
