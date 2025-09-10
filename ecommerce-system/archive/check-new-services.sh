#!/bin/bash

# 電商系統新服務狀態檢查器

echo "🔍 檢查電商系統新服務狀態..."
echo "=================================="

# 設定顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服務配置
declare -A SERVICES=(
    ["payment"]="3009:Payment Service"
    ["logistics"]="3010:Logistics Service"
    ["inventory"]="3012:Inventory Service"
)

# 檢查服務狀態
check_service_status() {
    local port=$1
    local service_name=$2
    
    echo -e "\n${BLUE}🔍 檢查 $service_name (Port $port)${NC}"
    
    # 檢查端口是否被佔用
    if ss -tlnp | grep -q ":$port "; then
        echo -e "${GREEN}✅ 端口 $port 正在監聽${NC}"
        
        # 檢查健康狀態
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 健康檢查通過${NC}"
            
            # 取得詳細健康資訊
            local health_info=$(curl -s "http://localhost:$port/health" 2>/dev/null)
            if [ $? -eq 0 ]; then
                echo -e "${BLUE}📊 健康資訊:${NC}"
                echo "$health_info" | jq -r '.message // "服務運行正常"' 2>/dev/null || echo "服務運行正常"
            fi
            
            return 0
        else
            echo -e "${YELLOW}⚠️  健康檢查失敗${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 端口 $port 未監聽${NC}"
        return 1
    fi
}

# 檢查進程
check_processes() {
    echo -e "\n${BLUE}🔍 檢查服務進程...${NC}"
    
    local found_processes=0
    
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r port service_name <<< "${SERVICES[$service]}"
        
        # 查找相關進程
        local pids=$(ps aux | grep -E "(${service}-service|node.*${service})" | grep -v grep | awk '{print $2}')
        
        if [ -n "$pids" ]; then
            echo -e "${GREEN}✅ $service_name 進程: $pids${NC}"
            ((found_processes++))
        else
            echo -e "${RED}❌ $service_name 進程未找到${NC}"
        fi
    done
    
    return $found_processes
}

# 檢查日誌
check_logs() {
    echo -e "\n${BLUE}📝 檢查服務日誌...${NC}"
    
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r port service_name <<< "${SERVICES[$service]}"
        local log_file="/home/johnny/電商系統/ecommerce-system/backend/services/${service}-service/logs/${service}-service.log"
        
        if [ -f "$log_file" ]; then
            local log_size=$(du -h "$log_file" | cut -f1)
            local last_modified=$(stat -c %y "$log_file" | cut -d' ' -f1,2)
            echo -e "${BLUE}📄 $service_name 日誌: $log_size (最後修改: $last_modified)${NC}"
            
            # 顯示最近的錯誤
            local errors=$(grep -i "error\|fail\|exception" "$log_file" | tail -3)
            if [ -n "$errors" ]; then
                echo -e "${RED}⚠️  最近錯誤:${NC}"
                echo "$errors" | sed 's/^/  /'
            fi
        else
            echo -e "${YELLOW}⚠️  $service_name 日誌檔案不存在${NC}"
        fi
    done
}

# 顯示服務資訊
show_service_info() {
    echo -e "\n${BLUE}📋 服務資訊${NC}"
    echo -e "${BLUE}================================${NC}"
    
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r port service_name <<< "${SERVICES[$service]}"
        
        echo -e "${BLUE}🔹 $service_name${NC}"
        echo -e "${BLUE}   端口: $port${NC}"
        echo -e "${BLUE}   健康檢查: http://localhost:$port/health${NC}"
        echo -e "${BLUE}   API 文檔: http://localhost:$port/api-docs${NC}"
        echo -e "${BLUE}   日誌目錄: /home/johnny/電商系統/ecommerce-system/backend/services/${service}-service/logs/${NC}"
        echo ""
    done
}

# 主程序
main() {
    local running_count=0
    local total_count=${#SERVICES[@]}
    
    # 檢查所有服務狀態
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r port service_name <<< "${SERVICES[$service]}"
        
        if check_service_status "$port" "$service_name"; then
            ((running_count++))
        fi
    done
    
    # 檢查進程
    check_processes
    
    # 檢查日誌
    check_logs
    
    # 顯示服務資訊
    show_service_info
    
    # 總結
    echo -e "\n${BLUE}📊 狀態總結${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "${GREEN}✅ 運行中: $running_count/$total_count 個服務${NC}"
    
    if [ $running_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 所有服務運行正常！${NC}"
    elif [ $running_count -gt 0 ]; then
        echo -e "${YELLOW}⚠️  部分服務運行中${NC}"
    else
        echo -e "${RED}❌ 沒有服務在運行${NC}"
        echo -e "${YELLOW}💡 提示: 使用 ./start-new-services.sh 啟動服務${NC}"
    fi
    
    echo -e "\n${BLUE}🔧 管理指令:${NC}"
    echo -e "${BLUE}• 啟動服務: ./start-new-services.sh${NC}"
    echo -e "${BLUE}• 停止服務: ./stop-new-services.sh${NC}"
    echo -e "${BLUE}• 重啟服務: ./restart-new-services.sh${NC}"
}

# 執行主程序
main "$@"
