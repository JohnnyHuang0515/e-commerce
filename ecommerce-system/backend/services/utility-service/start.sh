#!/bin/bash

# Utility Service 啟動腳本

echo "🔧 啟動 Utility Service..."

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

# 檢查 npm 是否安裝
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝，請先安裝 npm"
    exit 1
fi

# 進入服務目錄
cd "$(dirname "$0")"

# 安裝依賴
echo "📦 安裝依賴..."
npm install

# 創建環境變數文件
if [ ! -f .env ]; then
    echo "📝 創建環境變數文件..."
    cp env.example .env
    echo "⚠️  請編輯 .env 文件配置您的環境變數"
fi

# 創建必要目錄
mkdir -p logs uploads/{images,documents,archives,data,other} backups

# 設置環境變數
export PORT=${PORT:-3019}
export NODE_ENV=${NODE_ENV:-development}
export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/ecommerce_utility}
export UPLOAD_DIR=${UPLOAD_DIR:-uploads}
export BACKUP_DIR=${BACKUP_DIR:-backups}
export SERVICE_NAME=utility-service
export SERVICE_VERSION=1.0.0

# 啟動服務
echo "🚀 啟動 Utility Service..."
echo "📍 服務端口: $PORT"
echo "📍 環境: $NODE_ENV"
echo "📍 MongoDB: $MONGODB_URI"
echo "📍 上傳目錄: $UPLOAD_DIR"
echo "📍 備份目錄: $BACKUP_DIR"

# 使用 nodemon 開發模式啟動
if [ "$NODE_ENV" = "development" ]; then
    npx nodemon src/app.js
else
    node src/app.js
fi
