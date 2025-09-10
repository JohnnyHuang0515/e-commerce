# MinIO 圖片存儲服務 API 文檔

## 概述

MinIO 圖片存儲服務是電商系統的圖片管理微服務，提供圖片上傳、存儲、處理和管理的功能。

## 服務信息

- **服務名稱**: minio-service
- **端口**: 3008
- **技術棧**: Node.js + Express + MinIO + MongoDB + Sharp
- **API 版本**: v1

## 功能特性

- ✅ 圖片上傳（單個/批量）
- ✅ 圖片處理（壓縮、縮略圖生成）
- ✅ 多存儲桶管理
- ✅ 圖片元數據存儲
- ✅ 圖片刪除（軟刪除）
- ✅ 圖片統計信息
- ✅ 支持多種圖片格式
- ✅ 圖片驗證和安全檢查

## API 端點

### 健康檢查

#### GET /health
檢查服務健康狀態

**響應示例:**
```json
{
  "status": "healthy",
  "service": "minio-service",
  "timestamp": "2025-09-05T07:30:00.000Z",
  "minio": true,
  "mongodb": true
}
```

### 圖片管理

#### POST /api/v1/images
上傳單個圖片

**請求參數:**
- `image` (file): 圖片文件
- `entityType` (string): 實體類型 (product/user/category)
- `entityId` (string): 實體ID
- `description` (string, 可選): 圖片描述
- `tags` (string, 可選): 標籤（逗號分隔）

**響應示例:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "filename": "product-image.jpg",
    "originalName": "product-image.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "bucket": "product-images",
    "objectName": "product/64f8a1b2c3d4e5f6a7b8c9d0/1693900800000-abc123-product-image.jpg",
    "url": "http://localhost:9000/product-images/product/64f8a1b2c3d4e5f6a7b8c9d0/1693900800000-abc123-product-image.jpg",
    "width": 1920,
    "height": 1080,
    "thumbnailUrl": "http://localhost:9000/product-images/thumbnails/product/64f8a1b2c3d4e5f6a7b8c9d0/1693900800000-abc123-product-image.jpg",
    "entityType": "product",
    "entityId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "tags": ["product", "main"],
    "description": "商品主圖",
    "status": "active",
    "isPublic": true,
    "createdAt": "2025-09-05T07:30:00.000Z",
    "updatedAt": "2025-09-05T07:30:00.000Z"
  },
  "message": "圖片上傳成功"
}
```

#### POST /api/v1/images/batch
批量上傳圖片

**請求參數:**
- `images` (files): 圖片文件數組
- `entityType` (string): 實體類型
- `entityId` (string): 實體ID
- `description` (string, 可選): 圖片描述
- `tags` (string, 可選): 標籤（逗號分隔）

**響應示例:**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "filename": "image1.jpg",
        "url": "http://localhost:9000/product-images/...",
        "entityType": "product",
        "entityId": "64f8a1b2c3d4e5f6a7b8c9d0"
      }
    ],
    "errors": [
      {
        "filename": "invalid.txt",
        "errors": ["不支持的文件類型: text/plain"]
      }
    ]
  },
  "message": "成功上傳 1 個圖片，1 個失敗"
}
```

#### GET /api/v1/images
獲取圖片列表

**查詢參數:**
- `entityType` (string, 可選): 實體類型篩選
- `entityId` (string, 可選): 實體ID篩選
- `bucket` (string, 可選): 存儲桶篩選
- `page` (number, 可選): 頁碼，默認 1
- `limit` (number, 可選): 每頁數量，默認 20

**響應示例:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "filename": "product-image.jpg",
        "url": "http://localhost:9000/product-images/...",
        "entityType": "product",
        "entityId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "createdAt": "2025-09-05T07:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### GET /api/v1/images/:id
獲取單個圖片詳情

**響應示例:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "filename": "product-image.jpg",
    "originalName": "product-image.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "bucket": "product-images",
    "objectName": "product/64f8a1b2c3d4e5f6a7b8c9d0/1693900800000-abc123-product-image.jpg",
    "url": "http://localhost:9000/product-images/product/64f8a1b2c3d4e5f6a7b8c9d0/1693900800000-abc123-product-image.jpg",
    "width": 1920,
    "height": 1080,
    "thumbnailUrl": "http://localhost:9000/product-images/thumbnails/product/64f8a1b2c3d4e5f6a7b8c9d0/1693900800000-abc123-product-image.jpg",
    "entityType": "product",
    "entityId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "tags": ["product", "main"],
    "description": "商品主圖",
    "status": "active",
    "isPublic": true,
    "createdAt": "2025-09-05T07:30:00.000Z",
    "updatedAt": "2025-09-05T07:30:00.000Z"
  }
}
```

#### DELETE /api/v1/images/:id
刪除圖片（軟刪除）

**響應示例:**
```json
{
  "success": true,
  "message": "圖片刪除成功"
}
```

#### GET /api/v1/images/stats
獲取圖片統計信息

**響應示例:**
```json
{
  "success": true,
  "data": {
    "totalImages": 150,
    "totalSize": 52428800,
    "byBucket": [
      {
        "_id": "product-images",
        "count": 100,
        "totalSize": 41943040
      },
      {
        "_id": "user-avatars",
        "count": 30,
        "totalSize": 5242880
      },
      {
        "_id": "category-images",
        "count": 20,
        "totalSize": 5242880
      }
    ]
  }
}
```

## 錯誤代碼

| 錯誤代碼 | 描述 |
|---------|------|
| VALIDATION_ERROR | 請求參數驗證錯誤 |
| INVALID_FILE | 無效的文件 |
| FILE_TOO_LARGE | 文件大小超過限制 |
| TOO_MANY_FILES | 文件數量超過限制 |
| UNEXPECTED_FILE | 意外的文件字段 |
| IMAGE_PROCESSING_ERROR | 圖片處理錯誤 |
| INVALID_ENTITY_TYPE | 無效的實體類型 |
| UPLOAD_ERROR | 上傳錯誤 |
| BATCH_UPLOAD_ERROR | 批量上傳錯誤 |
| FETCH_ERROR | 獲取數據錯誤 |
| IMAGE_NOT_FOUND | 圖片不存在 |
| DELETE_ERROR | 刪除錯誤 |
| STATS_ERROR | 統計信息錯誤 |
| RATE_LIMIT_EXCEEDED | 請求頻率過高 |
| NOT_FOUND | 資源不存在 |
| INTERNAL_ERROR | 服務器內部錯誤 |

## 配置說明

### 環境變量

| 變量名 | 描述 | 默認值 |
|-------|------|--------|
| PORT | 服務端口 | 3008 |
| MINIO_ENDPOINT | MinIO 服務器地址 | localhost |
| MINIO_PORT | MinIO 服務器端口 | 9000 |
| MINIO_ACCESS_KEY | MinIO 訪問密鑰 | minioadmin |
| MINIO_SECRET_KEY | MinIO 秘密密鑰 | minioadmin |
| MINIO_USE_SSL | 是否使用 SSL | false |
| MONGODB_URI | MongoDB 連接字符串 | mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin |
| MAX_FILE_SIZE | 最大文件大小（字節） | 10485760 (10MB) |
| ALLOWED_IMAGE_TYPES | 允許的圖片類型 | image/jpeg,image/png,image/gif,image/webp |
| IMAGE_QUALITY | 圖片質量 | 80 |
| THUMBNAIL_SIZE | 縮略圖大小 | 300 |
| BUCKET_PRODUCTS | 商品圖片存儲桶 | product-images |
| BUCKET_AVATARS | 用戶頭像存儲桶 | user-avatars |
| BUCKET_CATEGORIES | 分類圖片存儲桶 | category-images |

### 存儲桶說明

- **product-images**: 存儲商品相關圖片
- **user-avatars**: 存儲用戶頭像
- **category-images**: 存儲商品分類圖片

## 使用示例

### 上傳商品圖片

```bash
curl -X POST http://localhost:3008/api/v1/images \
  -F "image=@product.jpg" \
  -F "entityType=product" \
  -F "entityId=64f8a1b2c3d4e5f6a7b8c9d0" \
  -F "description=商品主圖" \
  -F "tags=product,main"
```

### 批量上傳圖片

```bash
curl -X POST http://localhost:3008/api/v1/images/batch \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "entityType=product" \
  -F "entityId=64f8a1b2c3d4e5f6a7b8c9d0"
```

### 獲取商品圖片列表

```bash
curl "http://localhost:3008/api/v1/images?entityType=product&entityId=64f8a1b2c3d4e5f6a7b8c9d0"
```

## 注意事項

1. **文件大小限制**: 默認最大 10MB
2. **支持格式**: JPEG, PNG, GIF, WebP
3. **自動處理**: 上傳時自動壓縮和生成縮略圖
4. **軟刪除**: 刪除圖片時只標記為刪除狀態，不立即從存儲中移除
5. **速率限制**: 15 分鐘內最多 50 次上傳請求
6. **安全**: 所有上傳的文件都會進行驗證和處理

## 相關服務

- **商品服務**: 使用此服務存儲商品圖片
- **用戶服務**: 使用此服務存儲用戶頭像
- **分類服務**: 使用此服務存儲分類圖片
