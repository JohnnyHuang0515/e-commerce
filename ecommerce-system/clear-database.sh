#!/bin/bash

# 資料庫清理腳本
# 作者: AI Assistant
# 日期: 2025-01-11

# 獲取腳本所在的絕對目錄路徑
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)

echo "🧹 開始清理資料庫..."

# 檢查 Docker 容器是否運行
if ! docker ps | grep -q "ecommerce-mongodb"; then
    echo "❌ MongoDB 容器未運行，請先啟動開發環境"
    exit 1
fi

if ! docker ps | grep -q "ecommerce-postgresql"; then
    echo "❌ PostgreSQL 容器未運行，請先啟動開發環境"
    exit 1
fi

echo "🧹 清理 MongoDB 資料..."
# 清理 MongoDB 中的所有集合
docker exec ecommerce-mongodb mongosh ecommerce -u admin -p password123 --authenticationDatabase admin --eval "
    db.products.deleteMany({});
    db.categories.deleteMany({});
    db.analytics.deleteMany({});
    db.dashboardoverviews.deleteMany({});
    db.userbehaviors.deleteMany({});
    db.systemhealths.deleteMany({});
    db.images.deleteMany({});
    print('MongoDB 資料清理完成');
"

if [ $? -eq 0 ]; then
    echo "✅ MongoDB 資料清理成功"
else
    echo "❌ MongoDB 資料清理失敗"
fi

echo ""
echo "🧹 清理 PostgreSQL 資料..."
# 清理 PostgreSQL 中的所有表
docker exec ecommerce-postgresql psql -U admin -d ecommerce_transactions -c "
    TRUNCATE TABLE order_items, orders, users, inventory, payments, logistics CASCADE;
"

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL 資料清理成功"
else
    echo "❌ PostgreSQL 資料清理失敗"
fi

echo ""
echo "🧹 清理上傳的圖片文件..."
# 清理上傳的圖片文件
if [ -d "$PROJECT_ROOT/backend/services/merged-services/product-service/uploads" ]; then
    rm -rf "$PROJECT_ROOT/backend/services/merged-services/product-service/uploads"
    echo "✅ 圖片文件清理完成"
else
    echo "ℹ️  沒有找到圖片文件目錄"
fi

echo ""
echo "✅ 資料庫清理完成！"
echo ""
echo "💡 提示："
echo "   - 使用 './start-dev-server.sh' 重新啟動並灌入測試資料"
echo "   - 或使用 'node scripts/seed-test-data.js' 只灌入測試資料"
