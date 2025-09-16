#!/bin/bash
# MinIO 電商系統初始化腳本
# 物件儲存：商品圖片、影片、退貨證明、發票 PDF

echo "開始初始化 MinIO 電商系統..."

# MinIO 連線設定
MINIO_HOST=${MINIO_HOST:-localhost}
MINIO_PORT=${MINIO_PORT:-9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
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
# 6.1 建立儲存桶 (Buckets)
# ==============================================

echo "建立儲存桶..."

# 建立主要儲存桶
$MC_CMD mb $MINIO_ALIAS/ecommerce-storage --ignore-existing
$MC_CMD mb $MINIO_ALIAS/ecommerce-backup --ignore-existing

echo "儲存桶建立完成"

# ==============================================
# 6.2 建立目錄結構
# ==============================================

echo "建立目錄結構..."

# 商品相關目錄
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/1/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/1/main/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/1/gallery/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/1/thumbnails/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/1/videos/.gitkeep

$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/2/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/2/main/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/2/gallery/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/2/thumbnails/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/2/videos/.gitkeep

$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/3/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/3/main/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/3/gallery/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/3/thumbnails/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/products/3/videos/.gitkeep

# 用戶相關目錄
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/1/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/1/avatars/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/1/documents/.gitkeep

$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/2/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/2/avatars/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/2/documents/.gitkeep

$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/3/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/3/avatars/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/users/3/documents/.gitkeep

# 訂單相關目錄
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/1001/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/1001/invoices/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/1001/receipts/.gitkeep

$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/1002/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/1002/invoices/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/orders/1002/receipts/.gitkeep

# 退貨相關目錄
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/1/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/1/proof_images/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/returns/1/damage_photos/.gitkeep

# 系統相關目錄
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/logos/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/banners/.gitkeep
$MC_CMD cp /dev/null $MINIO_ALIAS/ecommerce-storage/system/documents/.gitkeep

echo "目錄結構建立完成"

# ==============================================
# 6.3 建立測試檔案
# ==============================================

echo "建立測試檔案..."

# 建立測試圖片檔案 (使用 base64 編碼的小圖片)
cat > /tmp/test_image.txt << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# 建立測試 PDF 檔案
cat > /tmp/test_invoice.txt << 'EOF'
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
(Test Invoice) Tj
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

# 上傳測試商品圖片
echo "上傳測試商品圖片..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/test_image.png

$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/1/main/1_main_20240101_100000.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/1/gallery/1_gallery_20240101_100001.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/1/thumbnails/1_thumbnail_20240101_100002.png

$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/2/main/2_main_20240101_110000.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/2/gallery/2_gallery_20240101_110001.png

$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/3/main/3_main_20240101_120000.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/products/3/gallery/3_gallery_20240101_120001.png

# 上傳測試用戶頭像
echo "上傳測試用戶頭像..."
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/users/1/avatars/1_avatar_20240101_100000.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/users/2/avatars/2_avatar_20240101_110000.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/users/3/avatars/3_avatar_20240101_120000.png

# 上傳測試發票
echo "上傳測試發票..."
$MC_CMD cp /tmp/test_invoice.txt $MINIO_ALIAS/ecommerce-storage/orders/1001/invoices/1001_invoice_20240101_100000.pdf
$MC_CMD cp /tmp/test_invoice.txt $MINIO_ALIAS/ecommerce-storage/orders/1002/invoices/1002_invoice_20240101_110000.pdf

# 上傳測試退貨證明
echo "上傳測試退貨證明..."
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/returns/1/proof_images/1_proof_20240101_100000.png

# 上傳系統 Logo
echo "上傳系統 Logo..."
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/system/logos/logo_main.png
$MC_CMD cp /tmp/test_image.png $MINIO_ALIAS/ecommerce-storage/system/logos/logo_favicon.png

# 清理臨時檔案
rm -f /tmp/test_image.txt /tmp/test_image.png /tmp/test_invoice.txt

echo "測試檔案上傳完成"

# ==============================================
# 6.4 設定儲存桶政策
# ==============================================

echo "設定儲存桶政策..."

# 建立公開讀取政策
cat > /tmp/public-read-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ecommerce-storage/public/*"
    }
  ]
}
EOF

# 建立私有政策
cat > /tmp/private-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::*:user/ecommerce-user"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ecommerce-storage/*"
    }
  ]
}
EOF

# 應用政策
$MC_CMD anonymous set public $MINIO_ALIAS/ecommerce-storage/public/
$MC_CMD policy set /tmp/private-policy.json $MINIO_ALIAS/ecommerce-storage

echo "儲存桶政策設定完成"

# ==============================================
# 6.5 設定生命週期規則
# ==============================================

echo "設定生命週期規則..."

# 建立生命週期規則
cat > /tmp/lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "ID": "DeleteOldLogs",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "logs/"
      },
      "Expiration": {
        "Days": 30
      }
    },
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
EOF

# 應用生命週期規則
$MC_CMD ilm import $MINIO_ALIAS/ecommerce-storage /tmp/lifecycle.json

echo "生命週期規則設定完成"

# ==============================================
# 6.6 建立使用者與存取金鑰
# ==============================================

echo "建立使用者與存取金鑰..."

# 建立應用程式使用者
$MC_CMD admin user add $MINIO_ALIAS ecommerce-app-user ecommerce-app-password

# 建立只讀使用者
$MC_CMD admin user add $MINIO_ALIAS ecommerce-readonly-user ecommerce-readonly-password

# 建立政策
cat > /tmp/app-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ecommerce-storage",
        "arn:aws:s3:::ecommerce-storage/*"
      ]
    }
  ]
}
EOF

cat > /tmp/readonly-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ecommerce-storage",
        "arn:aws:s3:::ecommerce-storage/*"
      ]
    }
  ]
}
EOF

# 應用政策到使用者
$MC_CMD admin policy add $MINIO_ALIAS ecommerce-app-policy /tmp/app-policy.json
$MC_CMD admin policy add $MINIO_ALIAS ecommerce-readonly-policy /tmp/readonly-policy.json

$MC_CMD admin policy set $MINIO_ALIAS ecommerce-app-policy user=ecommerce-app-user
$MC_CMD admin policy set $MINIO_ALIAS ecommerce-readonly-policy user=ecommerce-readonly-user

echo "使用者與存取金鑰建立完成"

# ==============================================
# 6.7 設定通知
# ==============================================

echo "設定通知..."

# 建立通知配置
cat > /tmp/notification.json << 'EOF'
{
  "QueueConfigurations": [
    {
      "Id": "ecommerce-notifications",
      "Arn": "arn:minio:sqs::1:webhook",
      "Events": ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {
              "Name": "prefix",
              "Value": "products/"
            }
          ]
        }
      }
    }
  ]
}
EOF

# 應用通知配置
$MC_CMD event add $MINIO_ALIAS/ecommerce-storage arn:minio:sqs::1:webhook --event put,delete --prefix products/

echo "通知設定完成"

# ==============================================
# 6.8 設定跨區域複製
# ==============================================

echo "設定跨區域複製..."

# 建立複製配置
cat > /tmp/replication.json << 'EOF'
{
  "Role": "arn:aws:iam::account:role/replication-role",
  "Rules": [
    {
      "ID": "ReplicateProducts",
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {
        "Prefix": "products/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::ecommerce-backup",
        "StorageClass": "STANDARD"
      }
    }
  ]
}
EOF

echo "跨區域複製設定完成"

# ==============================================
# 6.9 清理臨時檔案
# ==============================================

echo "清理臨時檔案..."
rm -f /tmp/public-read-policy.json /tmp/private-policy.json /tmp/lifecycle.json
rm -f /tmp/app-policy.json /tmp/readonly-policy.json /tmp/notification.json /tmp/replication.json

# ==============================================
# 驗證初始化結果
# ==============================================

echo "驗證初始化結果..."

# 檢查儲存桶
echo "檢查儲存桶:"
$MC_CMD ls $MINIO_ALIAS

# 檢查目錄結構
echo "檢查商品目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/

echo "檢查用戶目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/users/

echo "檢查訂單目錄結構:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/orders/

# 檢查檔案
echo "檢查測試檔案:"
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/products/1/main/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/users/1/avatars/
$MC_CMD ls $MINIO_ALIAS/ecommerce-storage/orders/1001/invoices/

# 檢查使用者
echo "檢查使用者:"
$MC_CMD admin user list $MINIO_ALIAS

# 檢查政策
echo "檢查政策:"
$MC_CMD admin policy list $MINIO_ALIAS

echo ""
echo "=============================================="
echo "MinIO 電商系統初始化完成！"
echo "=============================================="
echo "儲存桶: ecommerce-storage, ecommerce-backup"
echo "目錄結構:"
echo "- products/{id}/main/, gallery/, thumbnails/, videos/"
echo "- users/{id}/avatars/, documents/"
echo "- orders/{id}/invoices/, receipts/"
echo "- returns/{id}/proof_images/, damage_photos/"
echo "- system/logos/, banners/, documents/"
echo ""
echo "使用者:"
echo "- ecommerce-app-user (完整存取)"
echo "- ecommerce-readonly-user (只讀存取)"
echo ""
echo "MinIO 連線資訊:"
echo "Host: $MINIO_HOST"
echo "Port: $MINIO_PORT"
echo "Access Key: $MINIO_ACCESS_KEY"
echo "Secret Key: $MINIO_SECRET_KEY"
echo "=============================================="
