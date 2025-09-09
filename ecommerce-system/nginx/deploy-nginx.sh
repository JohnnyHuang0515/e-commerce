#!/bin/bash

# Nginx 部署腳本
# 適用於電商系統架構

set -e

echo "🚀 開始部署 Nginx 配置..."

# 檢查是否為 root 用戶
if [ "$EUID" -ne 0 ]; then
    echo "❌ 請使用 sudo 執行此腳本"
    exit 1
fi

# 備份現有配置
echo "📦 備份現有 Nginx 配置..."
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# 複製配置文件
echo "📋 複製 Nginx 配置文件..."
cp nginx.conf /etc/nginx/nginx.conf
cp ecommerce.conf /etc/nginx/sites-available/ecommerce.conf

# 啟用站點
echo "🔗 啟用站點配置..."
ln -sf /etc/nginx/sites-available/ecommerce.conf /etc/nginx/sites-enabled/

# 測試配置
echo "🧪 測試 Nginx 配置..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置測試通過"
    
    # 重載 Nginx
    echo "🔄 重載 Nginx 服務..."
    systemctl reload nginx
    
    echo "🎉 Nginx 部署完成！"
    echo "📊 服務狀態："
    systemctl status nginx --no-pager -l
    
    echo ""
    echo "🌐 測試網址："
    echo "  - HTTP: http://localhost"
    echo "  - 健康檢查: http://localhost/health"
    echo "  - API 測試: http://localhost/api/v1/auth/health"
    
else
    echo "❌ Nginx 配置測試失敗"
    exit 1
fi
