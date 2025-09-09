#!/bin/bash

# 電商系統合併服務一鍵啟動腳本
# 作者: AI Assistant
# 日期: 2025-01-08

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

echo -e "${BLUE}🚀 電商系統合併服務一鍵啟動${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 檢查是否在正確目錄
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ 錯誤: 請在 ecommerce-system 目錄下執行此腳本${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 合併服務架構:${NC}"
echo "1. AUTH-SERVICE (端口 3001) - 認證、用戶、權限管理"
echo "2. PRODUCT-SERVICE (端口 3002) - 商品、庫存、檔案管理"
echo "3. ORDER-SERVICE (端口 3003) - 訂單、支付、物流管理"
echo "4. AI-SERVICE (端口 3004) - AI搜尋、推薦、分析"
echo "5. SYSTEM-SERVICE (端口 3005) - 系統管理、監控、工具"
echo "6. 前端服務 (端口 3000)"
echo ""

# 創建日誌目錄
mkdir -p logs

# 檢查數據庫服務
check_database() {
    echo -e "${YELLOW}🔍 檢查數據庫服務...${NC}"
    
    # 檢查 PostgreSQL
    if command -v pg_isready > /dev/null 2>&1; then
        if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL 運行正常${NC}"
        else
            echo -e "${RED}❌ PostgreSQL 未運行，請先啟動 PostgreSQL${NC}"
            echo -e "${YELLOW}💡 啟動命令: sudo systemctl start postgresql${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  pg_isready 命令不可用，跳過 PostgreSQL 檢查${NC}"
    fi
    
    # 檢查 MongoDB
    if command -v mongosh > /dev/null 2>&1; then
        if mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
            echo -e "${GREEN}✅ MongoDB 運行正常${NC}"
        else
            echo -e "${YELLOW}⚠️  MongoDB 未運行，部分服務可能受影響${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  mongosh 命令不可用，跳過 MongoDB 檢查${NC}"
    fi
}

# 執行數據庫檢查
check_database

# 步驟1: 啟動合併服務
echo -e "${BLUE}🔄 步驟 1: 啟動合併服務...${NC}"

# 檢查合併服務目錄
if [ ! -d "backend/services/merged-services" ]; then
    echo -e "${RED}❌ 合併服務目錄不存在，請先創建合併服務${NC}"
    exit 1
fi

# 啟動 AUTH-SERVICE
echo -e "${YELLOW}📦 啟動 AUTH-SERVICE (端口 3001)...${NC}"
if [ -d "backend/services/merged-services/auth-service" ]; then
    (cd backend/services/merged-services/auth-service && npm install > ../../../logs/auth-service-install.log 2>&1 && npm start > ../../../logs/auth-service.log 2>&1) &
    AUTH_PID=$!
    echo -e "${GREEN}✅ AUTH-SERVICE 啟動中... (PID: $AUTH_PID)${NC}"
else
    echo -e "${RED}❌ AUTH-SERVICE 目錄不存在${NC}"
fi

# 等待服務啟動
echo -e "${YELLOW}⏳ 等待服務啟動...${NC}"
sleep 5

# 檢查服務健康狀態
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name 啟動成功${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ 等待 $service_name 啟動... (嘗試 $attempt/$max_attempts)${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name 啟動失敗${NC}"
    return 1
}

# 檢查 AUTH-SERVICE
if ! check_service_health "AUTH-SERVICE" 3001; then
    echo -e "${RED}❌ AUTH-SERVICE 啟動失敗，請檢查日誌: logs/auth-service.log${NC}"
fi

# 步驟2: 啟動前端服務
echo -e "${BLUE}🔄 步驟 2: 啟動前端服務...${NC}"
echo -e "${YELLOW}📁 切換到前端目錄...${NC}"

# 檢查前端依賴並啟動
if [ -d "frontend" ]; then
    # 檢查前端依賴
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}📦 安裝前端依賴...${NC}"
        (cd frontend && npm install)
    fi

    # 啟動前端服務
    echo -e "${GREEN}🌐 啟動前端開發服務器...${NC}"
    echo -e "${YELLOW}💡 提示: 前端服務將在後台運行，按 Ctrl+C 可停止${NC}"
    echo ""

    # 在後台啟動前端服務
    (cd frontend && nohup npm run dev > ../logs/frontend.log 2>&1) &
    FRONTEND_PID=$!

    # 等待前端啟動
    sleep 8

    # 檢查前端是否啟動成功
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ 前端服務啟動成功! (端口 3000)${NC}"
    elif curl -s http://localhost:3016 > /dev/null; then
        echo -e "${GREEN}✅ 前端服務啟動成功! (端口 3016)${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服務可能還在啟動中...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  前端目錄不存在，跳過前端服務啟動${NC}"
    FRONTEND_PID=""
fi

echo ""
echo -e "${GREEN}🎉 合併服務系統啟動完成!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🌐 訪問地址:${NC}"
echo -e "${BLUE}• 前端管理系統: http://localhost:3000 或 http://localhost:3016${NC}"
echo -e "${BLUE}• 登入帳號: admin / admin123${NC}"
echo ""
echo -e "${GREEN}🔧 合併服務地址:${NC}"
echo -e "${BLUE}• AUTH-SERVICE:     http://localhost:3001 (認證、用戶、權限)${NC}"
echo -e "${BLUE}• PRODUCT-SERVICE:  http://localhost:3002 (商品、庫存、檔案)${NC}"
echo -e "${BLUE}• ORDER-SERVICE:    http://localhost:3003 (訂單、支付、物流)${NC}"
echo -e "${BLUE}• AI-SERVICE:       http://localhost:3004 (AI搜尋、推薦、分析)${NC}"
echo -e "${BLUE}• SYSTEM-SERVICE:   http://localhost:3005 (系統管理、監控、工具)${NC}"
echo ""
echo -e "${GREEN}🛠️  管理指令:${NC}"
echo -e "${BLUE}• 檢查服務狀態: curl http://localhost:3001/health${NC}"
echo -e "${BLUE}• 停止所有服務: ./stop-merged-system.sh${NC}"
echo -e "${BLUE}• 查看服務日誌: tail -f logs/*.log${NC}"
echo -e "${BLUE}• 查看前端日誌: tail -f logs/frontend.log${NC}"
echo ""
if [ ! -z "$AUTH_PID" ]; then
    echo -e "${YELLOW}💡 AUTH-SERVICE 進程 ID: $AUTH_PID${NC}"
    echo -e "${YELLOW}💡 停止 AUTH-SERVICE: kill $AUTH_PID${NC}"
fi
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}💡 前端進程 ID: $FRONTEND_PID${NC}"
    echo -e "${YELLOW}💡 停止前端: kill $FRONTEND_PID${NC}"
fi
echo ""

echo -e "${GREEN}✅ 合併服務系統啟動腳本執行完成!${NC}"
echo -e "${YELLOW}💡 注意: 目前只有 AUTH-SERVICE 已實現，其他服務正在開發中${NC}"
