#!/bin/bash

# AI Search Service 啟動腳本

echo "🤖 啟動 AI Search Service..."

# 檢查Python環境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安裝"
    exit 1
fi

# 檢查依賴
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt 不存在"
    exit 1
fi

# 安裝依賴
echo "📦 安裝依賴..."
pip3 install -r requirements.txt

# 檢查環境配置
if [ ! -f ".env" ]; then
    echo "📝 創建環境配置文件..."
    cp env.example .env
fi

# 創建必要目錄
mkdir -p logs models

# 啟動服務
echo "🚀 啟動 AI Search Service..."
python3 -m uvicorn src.app:app --host 0.0.0.0 --port 3014 --reload
