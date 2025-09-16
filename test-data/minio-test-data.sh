#!/bin/bash
# MinIO 電商系統測試資料
# 擴展現有初始化腳本的測試資料

echo "開始插入 MinIO 擴展測試資料..."

# MinIO 連線設定
MINIO_HOST=${MINIO_HOST:-localhost}
MINIO_PORT=${MINIO_PORT:-9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin123}
MINIO_ALIAS=${MINIO_ALIAS:-ecommerce}

# MinIO 客戶端命令
MC_CMD="mc"

# 檢查 MinIO 客戶端是否安裝
if ! command -v mc &> /dev/null; then
    echo "錯誤: MinIO 客戶端 (mc) 未安裝"
    echo "請先安裝 MinIO 客戶端:"
    echo "curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc"
    echo "chmod +x /usr/local/bin/mc"
    exit 1
fi

# 設定 MinIO 伺服器連線
echo "設定 MinIO 伺服器連線..."
$MC_CMD alias set $MINIO_ALIAS http://$MINIO_HOST:$MINIO_PORT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# 測試連線
echo "測試 MinIO 連線..."
$MC_CMD ls $MINIO_ALIAS || {
    echo "錯誤: 無法連接到 MinIO 伺服器"
    echo "請確認 MinIO 伺服器正在運行在 $MINIO_HOST:$MINIO_PORT"
    exit 1
}

echo "MinIO 連線成功！"

# ==============================================
# 擴展商品圖片資料
# ==============================================

echo "插入擴展商品圖片資料..."

# 建立更多商品目錄
for product_id in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25; do
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/$product_id/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/$product_id/main/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/$product_id/gallery/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/$product_id/thumbnails/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/$product_id/videos/.gitkeep
done

# 建立測試圖片檔案
cat > /tmp/sk2_image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/lancome_image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/mac_image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/snack_image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/dog_food_image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# 轉換為圖片檔案
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/sk2_image.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/lancome_image.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/mac_image.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/snack_image.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/dog_food_image.png

# 上傳 SK-II 商品圖片
$MC_CMD cp /tmp/sk2_image.png $MINIO_ALIAS/ecommerce-storage/products/6/main/6_main_20240102_090000.png
$MC_CMD cp /tmp/sk2_image.png $MINIO_ALIAS/ecommerce-storage/products/6/gallery/6_gallery_20240102_090001.png
$MC_CMD cp /tmp/sk2_image.png $MINIO_ALIAS/ecommerce-storage/products/6/gallery/6_gallery_20240102_090002.png
$MC_CMD cp /tmp/sk2_image.png $MINIO_ALIAS/ecommerce-storage/products/6/thumbnails/6_thumbnail_20240102_090003.png

# 上傳蘭蔻商品圖片
$MC_CMD cp /tmp/lancome_image.png $MINIO_ALIAS/ecommerce-storage/products/7/main/7_main_20240102_100000.png
$MC_CMD cp /tmp/lancome_image.png $MINIO_ALIAS/ecommerce-storage/products/7/gallery/7_gallery_20240102_100001.png
$MC_CMD cp /tmp/lancome_image.png $MINIO_ALIAS/ecommerce-storage/products/7/thumbnails/7_thumbnail_20240102_100002.png

# 上傳 MAC 商品圖片
$MC_CMD cp /tmp/mac_image.png $MINIO_ALIAS/ecommerce-storage/products/9/main/9_main_20240102_110000.png
$MC_CMD cp /tmp/mac_image.png $MINIO_ALIAS/ecommerce-storage/products/9/gallery/9_gallery_20240102_110001.png
$MC_CMD cp /tmp/mac_image.png $MINIO_ALIAS/ecommerce-storage/products/9/thumbnails/9_thumbnail_20240102_110002.png

# 上傳零食商品圖片
$MC_CMD cp /tmp/snack_image.png $MINIO_ALIAS/ecommerce-storage/products/11/main/11_main_20240102_120000.png
$MC_CMD cp /tmp/snack_image.png $MINIO_ALIAS/ecommerce-storage/products/11/gallery/11_gallery_20240102_120001.png
$MC_CMD cp /tmp/snack_image.png $MINIO_ALIAS/ecommerce-storage/products/11/thumbnails/11_thumbnail_20240102_120002.png

# 上傳狗糧商品圖片
$MC_CMD cp /tmp/dog_food_image.png $MINIO_ALIAS/ecommerce-storage/products/14/main/14_main_20240102_130000.png
$MC_CMD cp /tmp/dog_food_image.png $MINIO_ALIAS/ecommerce-storage/products/14/gallery/14_gallery_20240102_130001.png
$MC_CMD cp /tmp/dog_food_image.png $MINIO_ALIAS/ecommerce-storage/products/14/thumbnails/14_thumbnail_20240102_130002.png

echo "商品圖片資料插入完成"

# ==============================================
# 擴展用戶頭像資料
# ==============================================

echo "插入擴展用戶頭像資料..."

# 建立更多用戶目錄
for user_id in 4 5 6 7 8 9 10 11 12 13; do
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/$user_id/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/$user_id/avatars/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/$user_id/documents/.gitkeep
done

# 建立測試頭像檔案
cat > /tmp/avatar1.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/avatar2.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/avatar3.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# 轉換為圖片檔案
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/avatar1.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/avatar2.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/avatar3.png

# 上傳用戶頭像
$MC_CMD cp /tmp/avatar1.png $MINIO_ALIAS/ecommerce-storage/users/4/avatars/4_avatar_20240102_090000.png
$MC_CMD cp /tmp/avatar2.png $MINIO_ALIAS/ecommerce-storage/users/5/avatars/5_avatar_20240102_100000.png
$MC_CMD cp /tmp/avatar3.png $MINIO_ALIAS/ecommerce-storage/users/6/avatars/6_avatar_20240102_110000.png
$MC_CMD cp /tmp/avatar1.png $MINIO_ALIAS/ecommerce-storage/users/7/avatars/7_avatar_20240102_120000.png
$MC_CMD cp /tmp/avatar2.png $MINIO_ALIAS/ecommerce-storage/users/8/avatars/8_avatar_20240102_130000.png

echo "用戶頭像資料插入完成"

# ==============================================
# 擴展訂單發票資料
# ==============================================

echo "插入擴展訂單發票資料..."

# 建立更多訂單目錄
for order_id in 1004 1005 1006 1007 1008 1009 1010; do
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/$order_id/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/$order_id/invoices/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/$order_id/receipts/.gitkeep
done

# 建立測試發票檔案
cat > /tmp/invoice_1004.txt << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Invoice 1004 - SK-II) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF
EOF

cat > /tmp/invoice_1005.txt << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Invoice 1005 - Lancome) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF
EOF

# 上傳發票
$MC_CMD cp /tmp/invoice_1004.txt $MINIO_ALIAS/ecommerce-storage/orders/1004/invoices/1004_invoice_20240102_090000.pdf
$MC_CMD cp /tmp/invoice_1005.txt $MINIO_ALIAS/ecommerce-storage/orders/1005/invoices/1005_invoice_20240102_100000.pdf
$MC_CMD cp /tmp/invoice_1004.txt $MINIO_ALIAS/ecommerce-storage/orders/1006/invoices/1006_invoice_20240102_110000.pdf
$MC_CMD cp /tmp/invoice_1005.txt $MINIO_ALIAS/ecommerce-storage/orders/1007/invoices/1007_invoice_20240102_120000.pdf
$MC_CMD cp /tmp/invoice_1004.txt $MINIO_ALIAS/ecommerce-storage/orders/1008/invoices/1008_invoice_20240102_130000.pdf

echo "訂單發票資料插入完成"

# ==============================================
# 擴展退貨證明資料
# ==============================================

echo "插入擴展退貨證明資料..."

# 建立更多退貨目錄
for return_id in 2 3 4 5; do
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/$return_id/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/$return_id/proof_images/.gitkeep
    $MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/$return_id/damage_photos/.gitkeep
done

# 建立測試退貨證明檔案
cat > /tmp/return_proof2.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/return_proof3.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# 轉換為圖片檔案
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/return_proof2.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/return_proof3.png

# 上傳退貨證明
$MC_CMD cp /tmp/return_proof2.png $MINIO_ALIAS/ecommerce-storage/returns/2/proof_images/2_proof_20240102_100000.png
$MC_CMD cp /tmp/return_proof3.png $MINIO_ALIAS/ecommerce-storage/returns/3/proof_images/3_proof_20240102_110000.png
$MC_CMD cp /tmp/return_proof2.png $MINIO_ALIAS/ecommerce-storage/returns/4/proof_images/4_proof_20240102_120000.png
$MC_CMD cp /tmp/return_proof3.png $MINIO_ALIAS/ecommerce-storage/returns/5/proof_images/5_proof_20240102_130000.png

echo "退貨證明資料插入完成"

# ==============================================
# 擴展系統資源資料
# ==============================================

echo "插入擴展系統資源資料..."

# 建立更多系統目錄
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/banners/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/categories/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/promotions/.gitkeep

# 建立測試橫幅檔案
cat > /tmp/banner1.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

cat > /tmp/banner2.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# 轉換為圖片檔案
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/banner1.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/banner2.png

# 上傳橫幅圖片
$MC_CMD cp /tmp/banner1.png $MINIO_ALIAS/ecommerce-storage/system/banners/banner_new_year_2024.png
$MC_CMD cp /tmp/banner2.png $MINIO_ALIAS/ecommerce-storage/system/banners/banner_spring_sale_2024.png
$MC_CMD cp /tmp/banner1.png $MINIO_ALIAS/ecommerce-storage/system/banners/banner_beauty_week_2024.png

# 上傳分類圖片
$MC_CMD cp /tmp/banner1.png $MINIO_ALIAS/ecommerce-storage/system/categories/electronics_category.png
$MC_CMD cp /tmp/banner2.png $MINIO_ALIAS/ecommerce-storage/system/categories/beauty_category.png
$MC_CMD cp /tmp/banner1.png $MINIO_ALIAS/ecommerce-storage/system/categories/food_category.png
$MC_CMD cp /tmp/banner2.png $MINIO_ALIAS/ecommerce-storage/system/categories/pet_category.png

# 上傳促銷圖片
$MC_CMD cp /tmp/banner1.png $MINIO_ALIAS/ecommerce-storage/system/promotions/flash_sale_50_off.png
$MC_CMD cp /tmp/banner2.png $MINIO_ALIAS/ecommerce-storage/system/promotions/free_shipping_banner.png
$MC_CMD cp /tmp/banner1.png $MINIO_ALIAS/ecommerce-storage/system/promotions/new_user_discount.png

echo "系統資源資料插入完成"

# ==============================================
# 擴展商品影片資料
# ==============================================

echo "插入擴展商品影片資料..."

# 建立測試影片檔案
cat > /tmp/product_video1.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# 轉換為影片檔案（實際應用中會是真實的影片檔案）
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/product_video1.mp4

# 上傳商品影片
$MC_CMD cp /tmp/product_video1.mp4 $MINIO_ALIAS/ecommerce-storage/products/6/videos/6_demo_20240102_090000.mp4
$MC_CMD cp /tmp/product_video1.mp4 $MINIO_ALIAS/ecommerce-storage/products/7/videos/7_demo_20240102_100000.mp4
$MC_CMD cp /tmp/product_video1.mp4 $MINIO_ALIAS/ecommerce-storage/products/9/videos/9_demo_20240102_110000.mp4
$MC_CMD cp /tmp/product_video1.mp4 $MINIO_ALIAS/ecommerce-storage/products/11/videos/11_demo_20240102_120000.mp4
$MC_CMD cp /tmp/product_video1.mp4 $MINIO_ALIAS/ecommerce-storage/products/14/videos/14_demo_20240102_130000.mp4

echo "商品影片資料插入完成"

# ==============================================
# 清理臨時檔案
# ==============================================

echo "清理臨時檔案..."
rm -f /tmp/sk2_image.txt /tmp/sk2_image.png
rm -f /tmp/lancome_image.txt /tmp/lancome_image.png
rm -f /tmp/mac_image.txt /tmp/mac_image.png
rm -f /tmp/snack_image.txt /tmp/snack_image.png
rm -f /tmp/dog_food_image.txt /tmp/dog_food_image.png
rm -f /tmp/avatar1.txt /tmp/avatar1.png
rm -f /tmp/avatar2.txt /tmp/avatar2.png
rm -f /tmp/avatar3.txt /tmp/avatar3.png
rm -f /tmp/invoice_1004.txt /tmp/invoice_1005.txt
rm -f /tmp/return_proof2.txt /tmp/return_proof2.png
rm -f /tmp/return_proof3.txt /tmp/return_proof3.png
rm -f /tmp/banner1.txt /tmp/banner1.png
rm -f /tmp/banner2.txt /tmp/banner2.png
rm -f /tmp/product_video1.txt /tmp/product_video1.mp4

# ==============================================
# 驗證插入結果
# ==============================================

echo "驗證插入結果..."

# 檢查目錄結構
echo "檢查商品目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/6/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/7/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/9/

echo "檢查用戶目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/users/4/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/users/5/

echo "檢查訂單目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/orders/1004/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/orders/1005/

echo "檢查退貨目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/returns/2/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/returns/3/

echo "檢查系統目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/system/banners/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/system/categories/

# 檢查檔案
echo "檢查商品圖片:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/6/main/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/7/gallery/

echo "檢查用戶頭像:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/users/4/avatars/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/users/5/avatars/

echo "檢查發票:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/orders/1004/invoices/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/orders/1005/invoices/

echo "檢查退貨證明:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/returns/2/proof_images/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/returns/3/proof_images/

echo "檢查系統資源:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/system/banners/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/system/categories/

echo "檢查商品影片:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/6/videos/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/7/videos/

echo ""
echo "=============================================="
echo "MinIO 擴展測試資料插入完成！"
echo "=============================================="
echo "已插入的擴展資料類型:"
echo "- 擴展商品圖片 (products/{id}/main/, gallery/, thumbnails/, videos/)"
echo "- 擴展用戶頭像 (users/{id}/avatars/)"
echo "- 擴展訂單發票 (orders/{id}/invoices/)"
echo "- 擴展退貨證明 (returns/{id}/proof_images/)"
echo "- 擴展系統資源 (system/banners/, categories/, promotions/)"
echo "- 擴展商品影片 (products/{id}/videos/)"
echo ""
echo "MinIO 連線資訊:"
echo "Host: $MINIO_HOST"
echo "Port: $MINIO_PORT"
echo "Access Key: $MINIO_ACCESS_KEY"
echo "Secret Key: $MINIO_SECRET_KEY"
echo "=============================================="
