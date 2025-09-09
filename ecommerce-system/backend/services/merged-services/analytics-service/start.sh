#!/bin/bash

# Analytics Service 啟動腳本

echo "📊 啟動 Analytics Service..."

# 檢查 Node.js 環境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝"
    exit 1
fi

# 檢查依賴
if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在"
    exit 1
fi

# 安裝依賴
echo "📦 安裝依賴..."
npm install

# 檢查環境配置
if [ ! -f ".env" ]; then
    echo "📝 創建環境配置文件..."
    cp env.example .env 2>/dev/null || echo "⚠️ 請手動創建 .env 文件"
fi

# 創建必要目錄
mkdir -p logs

# 啟動服務
echo "🚀 啟動 Analytics Service..."
node src/app.js
