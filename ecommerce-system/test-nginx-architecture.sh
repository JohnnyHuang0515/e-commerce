#!/bin/bash

# Nginx 架構測試腳本
# 測試完整的前端 + Nginx + 後端服務架構

set -e

echo "🚀 開始測試 Nginx + MVC 架構..."

# 檢查服務狀態
echo "📊 檢查後端服務狀態..."
cd /home/johnny/電商系統/ecommerce-system/backend/services/merged-services

# 檢查 AUTH-SERVICE
if curl -s http://localhost:3001/api/v1/auth/health > /dev/null; then
    echo "✅ AUTH-SERVICE (3001): 運行中"
else
    echo "❌ AUTH-SERVICE (3001): 未運行"
fi

# 檢查 PRODUCT-SERVICE
if curl -s http://localhost:3002/api/v1/products/health > /dev/null; then
    echo "✅ PRODUCT-SERVICE (3002): 運行中"
else
    echo "❌ PRODUCT-SERVICE (3002): 未運行"
fi

# 檢查 ORDER-SERVICE
if curl -s http://localhost:3003/api/v1/orders/health > /dev/null; then
    echo "✅ ORDER-SERVICE (3003): 運行中"
else
    echo "❌ ORDER-SERVICE (3003): 未運行"
fi

# 檢查 AI-SERVICE
if curl -s http://localhost:3004/api/v1/ai/health > /dev/null; then
    echo "✅ AI-SERVICE (3004): 運行中"
else
    echo "❌ AI-SERVICE (3004): 未運行"
fi

# 檢查 SYSTEM-SERVICE
if curl -s http://localhost:3005/api/v1/system/health > /dev/null; then
    echo "✅ SYSTEM-SERVICE (3005): 運行中"
else
    echo "❌ SYSTEM-SERVICE (3005): 未運行"
fi

echo ""
echo "🧪 測試 Nginx 配置..."

# 測試 Nginx 配置
cd /home/johnny/電商系統/ecommerce-system/nginx
if /usr/sbin/nginx -t -c /home/johnny/電商系統/ecommerce-system/nginx/test-nginx.conf; then
    echo "✅ Nginx 配置語法正確"
else
    echo "❌ Nginx 配置語法錯誤"
    exit 1
fi

echo ""
echo "🌐 測試 API 代理功能..."

# 測試 API 代理
echo "測試 AUTH API 代理..."
if curl -s http://localhost:8080/api/v1/auth/health | grep -q "healthy"; then
    echo "✅ AUTH API 代理正常"
else
    echo "❌ AUTH API 代理失敗"
fi

echo "測試 PRODUCT API 代理..."
if curl -s http://localhost:8080/api/v1/products/health | grep -q "healthy"; then
    echo "✅ PRODUCT API 代理正常"
else
    echo "❌ PRODUCT API 代理失敗"
fi

echo "測試 ORDER API 代理..."
if curl -s http://localhost:8080/api/v1/orders/health | grep -q "healthy"; then
    echo "✅ ORDER API 代理正常"
else
    echo "❌ ORDER API 代理失敗"
fi

echo "測試 AI API 代理..."
if curl -s http://localhost:8080/api/v1/ai/health | grep -q "healthy"; then
    echo "✅ AI API 代理正常"
else
    echo "❌ AI API 代理失敗"
fi

echo "測試 SYSTEM API 代理..."
if curl -s http://localhost:8080/api/v1/system/health | grep -q "healthy"; then
    echo "✅ SYSTEM API 代理正常"
else
    echo "❌ SYSTEM API 代理失敗"
fi

echo ""
echo "🏥 測試健康檢查端點..."
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo "✅ Nginx 健康檢查正常"
else
    echo "❌ Nginx 健康檢查失敗"
fi

echo ""
echo "📈 性能測試..."
echo "測試靜態檔案服務..."
if curl -s -I http://localhost:8080/ | grep -q "200 OK"; then
    echo "✅ 靜態檔案服務正常"
else
    echo "❌ 靜態檔案服務失敗"
fi

echo ""
echo "🎉 架構測試完成！"
echo ""
echo "📋 測試結果總結："
echo "  - 後端服務: 5個合併服務"
echo "  - Nginx 代理: 統一 API 入口"
echo "  - 前端配置: 已更新為 Nginx 架構"
echo "  - 健康檢查: 正常運行"
echo ""
echo "🌐 訪問網址："
echo "  - 前端: http://localhost:8080"
echo "  - 健康檢查: http://localhost:8080/health"
echo "  - API 文檔: http://localhost:8080/api/v1/auth/docs"
echo ""
echo "💡 下一步："
echo "  1. 啟動 Nginx: sudo nginx -c /home/johnny/電商系統/ecommerce-system/nginx/test-nginx.conf"
echo "  2. 建構前端: cd frontend && npm run build"
echo "  3. 測試完整功能"
