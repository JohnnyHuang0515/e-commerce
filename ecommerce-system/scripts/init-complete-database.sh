#!/bin/bash

# 完整的資料庫初始化腳本
# 一次性創建所有表格、欄位、索引和初始數據

echo "🚀 開始初始化完整的電商系統資料庫..."

# 檢查 PostgreSQL 是否運行
if ! pg_isready -h localhost -p 5432 -U admin > /dev/null 2>&1; then
    echo "❌ PostgreSQL 未運行，正在啟動..."
    
    # 嘗試啟動 PostgreSQL Docker 容器
    if docker ps -a | grep -q "ecommerce-postgresql"; then
        echo "📦 啟動 PostgreSQL Docker 容器..."
        docker start ecommerce-postgresql
        sleep 5
    else
        echo "❌ 找不到 PostgreSQL 容器，請先啟動資料庫"
        exit 1
    fi
fi

# 等待 PostgreSQL 完全啟動
echo "⏳ 等待 PostgreSQL 完全啟動..."
for i in {1..30}; do
    if pg_isready -h localhost -p 5432 -U admin > /dev/null 2>&1; then
        echo "✅ PostgreSQL 已就緒"
        break
    fi
    echo "⏳ 等待中... ($i/30)"
    sleep 2
done

# 執行完整的資料庫初始化
echo "📊 執行完整的資料庫初始化..."
PGPASSWORD=password123 psql -h localhost -p 5432 -U admin -d ecommerce_transactions -f "$(dirname "$0")/complete-database-init.sql"

if [ $? -eq 0 ]; then
    echo "✅ 資料庫初始化完成！"
    echo ""
    echo "📋 已創建的內容："
    echo "   - 所有用戶相關表格 (users, roles, permissions, etc.)"
    echo "   - 所有商品相關表格 (products, categories, inventory, etc.)"
    echo "   - 所有訂單相關表格 (orders, payments, logistics, etc.)"
    echo "   - 所有系統相關表格 (settings, logs, notifications, etc.)"
    echo "   - 所有必要的索引和觸發器"
    echo "   - 預設管理員用戶: admin@ecommerce.com"
    echo "   - 預設角色和權限"
    echo "   - 預設系統設定"
    echo "   - 預設商品分類"
    echo ""
    echo "🎉 現在可以啟動所有合併服務了！"
else
    echo "❌ 資料庫初始化失敗！"
    exit 1
fi
