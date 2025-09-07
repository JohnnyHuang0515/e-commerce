#!/bin/bash

# 電商系統一鍵啟動腳本
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

echo -e "${BLUE}🚀 電商系統一鍵啟動${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 檢查是否在正確目錄
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ 錯誤: 請在 ecommerce-system 目錄下執行此腳本${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 啟動步驟:${NC}"
echo "1. 啟動核心微服務 (Auth, User, Product, Order, Analytics, Settings, Dashboard, MinIO)"
echo "2. 啟動進階服務 (Payment, Logistics, Inventory, Permission)"
echo "3. 啟動AI服務 (AI Search Service)"
echo "4. 啟動前端服務"
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

# 步驟1: 啟動核心微服務
echo -e "${BLUE}🔄 步驟 1: 啟動核心微服務...${NC}"
echo -e "${YELLOW}📦 啟動 Auth Service (端口 3005)...${NC}"
(cd backend/services/auth-service && npm start > ../../logs/auth-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 User Service (端口 3002)...${NC}"
(cd backend/services/user-service && npm start > ../../logs/user-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Product Service (端口 3001)...${NC}"
(cd backend/services/product-service && npm start > ../../logs/product-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Order Service (端口 3003)...${NC}"
(cd backend/services/order-service && npm start > ../../logs/order-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Analytics Service (端口 3006)...${NC}"
(cd backend/services/analytics-service && npm start > ../../logs/analytics-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Settings Service (端口 3007)...${NC}"
(cd backend/services/settings-service && npm start > ../../logs/settings-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Dashboard Service (端口 3011)...${NC}"
(cd backend/services/dashboard-service && npm start > ../../logs/dashboard-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 MinIO Service (端口 3008)...${NC}"
(cd backend/services/minio-service && npm start > ../../logs/minio-service.log 2>&1) &

echo ""

# 等待核心服務啟動
echo -e "${YELLOW}⏳ 等待核心服務啟動...${NC}"
sleep 8

# 步驟2: 啟動進階服務
echo -e "${BLUE}🔄 步驟 2: 啟動進階服務...${NC}"
echo -e "${YELLOW}📦 啟動 Payment Service (端口 3009)...${NC}"
(cd backend/services/payment-service && npm start > ../../logs/payment-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Logistics Service (端口 3010)...${NC}"
(cd backend/services/logistics-service && npm start > ../../logs/logistics-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Inventory Service (端口 3012)...${NC}"
(cd backend/services/inventory-service && npm start > ../../logs/inventory-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Permission Service (端口 3013)...${NC}"
(cd backend/services/permission-service && npm start > ../../logs/permission-service.log 2>&1) &

echo ""

# 等待進階服務啟動
echo -e "${YELLOW}⏳ 等待進階服務啟動...${NC}"
sleep 8

# 檢查進階服務健康狀態
echo -e "${YELLOW}🔍 檢查進階服務狀態...${NC}"
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/api/v1/health > /dev/null 2>&1; then
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

# 檢查關鍵服務
if ! check_service_health "Payment Service" 3009; then
    echo -e "${RED}❌ Payment Service 啟動失敗，請檢查日誌: logs/payment-service.log${NC}"
fi

if ! check_service_health "Logistics Service" 3010; then
    echo -e "${RED}❌ Logistics Service 啟動失敗，請檢查日誌: logs/logistics-service.log${NC}"
fi

if ! check_service_health "Inventory Service" 3012; then
    echo -e "${RED}❌ Inventory Service 啟動失敗，請檢查日誌: logs/inventory-service.log${NC}"
    echo -e "${YELLOW}💡 可能原因: PostgreSQL 未運行或數據庫連接問題${NC}"
fi

if ! check_service_health "Permission Service" 3013; then
    echo -e "${RED}❌ Permission Service 啟動失敗，請檢查日誌: logs/permission-service.log${NC}"
fi

# 步驟3: 啟動AI服務
echo -e "${BLUE}🔄 步驟 3: 啟動AI服務...${NC}"
echo -e "${YELLOW}📦 啟動 AI Search Service (端口 3014)...${NC}"
(cd backend/services/ai-search-service && ./start.sh > ../../logs/ai-search-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Log Service (端口 3018)...${NC}"
(cd backend/services/log-service && ./start.sh > ../../logs/log-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Notification Service (端口 3017)...${NC}"
(cd backend/services/notification-service && ./start.sh > ../../logs/notification-service.log 2>&1) &

echo -e "${YELLOW}📦 啟動 Utility Service (端口 3019)...${NC}"
(cd backend/services/utility-service && ./start.sh > ../../logs/utility-service.log 2>&1) &

echo ""

# 等待AI服務啟動
echo -e "${YELLOW}⏳ 等待AI服務啟動...${NC}"
sleep 5

# 步驟4: 啟動前端服務
echo -e "${BLUE}🔄 步驟 4: 啟動前端服務...${NC}"
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
echo -e "${GREEN}🎉 系統啟動完成!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🌐 訪問地址:${NC}"
echo -e "${BLUE}• 前端管理系統: http://localhost:3000 或 http://localhost:3016${NC}"
echo -e "${BLUE}• 登入帳號: admin / admin123${NC}"
echo ""
echo -e "${GREEN}🔧 服務地址:${NC}"
echo -e "${BLUE}• Auth Service:     http://localhost:3005${NC}"
echo -e "${BLUE}• User Service:     http://localhost:3002${NC}"
echo -e "${BLUE}• Product Service:  http://localhost:3001${NC}"
echo -e "${BLUE}• Order Service:    http://localhost:3003${NC}"
echo -e "${BLUE}• Analytics Service: http://localhost:3006${NC}"
echo -e "${BLUE}• Settings Service: http://localhost:3007${NC}"
echo -e "${BLUE}• MinIO Service:    http://localhost:3008${NC}"
echo -e "${BLUE}• Payment Service:  http://localhost:3009${NC}"
echo -e "${BLUE}• Logistics Service: http://localhost:3010${NC}"
echo -e "${BLUE}• Dashboard Service: http://localhost:3011${NC}"
echo -e "${BLUE}• Inventory Service: http://localhost:3012${NC}"
echo -e "${BLUE}• Permission Service: http://localhost:3013${NC}"
echo -e "${BLUE}• AI Search Service: http://localhost:3014${NC}"
echo -e "${BLUE}• Notification Service: http://localhost:3017${NC}"
echo -e "${BLUE}• Log Service:       http://localhost:3018${NC}"
echo -e "${BLUE}• Utility Service:   http://localhost:3019${NC}"
echo -e "${BLUE}• MinIO Console:    http://localhost:9001${NC}"
echo ""
echo -e "${GREEN}🛠️  管理指令:${NC}"
echo -e "${BLUE}• 檢查服務狀態: ./check-new-services.sh${NC}"
echo -e "${BLUE}• 停止所有服務: ./stop-system.sh${NC}"
echo -e "${BLUE}• 查看服務日誌: tail -f logs/*.log${NC}"
echo -e "${BLUE}• 查看前端日誌: tail -f logs/frontend.log${NC}"
echo ""
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}💡 前端進程 ID: $FRONTEND_PID${NC}"
    echo -e "${YELLOW}💡 停止前端: kill $FRONTEND_PID${NC}"
fi
echo ""

echo -e "${GREEN}✅ 系統啟動腳本執行完成!${NC}"
