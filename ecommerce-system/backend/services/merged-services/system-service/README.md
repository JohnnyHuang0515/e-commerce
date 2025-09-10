# System Service - MinIO 整合版

## 📋 概述

系統服務已整合 MinIO 對象存儲，提供完整的文件管理功能，包括圖片處理、縮略圖生成、文件上傳下載等。

## 🏗️ 架構設計

### 存儲架構
- **MinIO**: 對象存儲 (實際文件)
- **PostgreSQL**: 元數據存儲 (文件信息)
- **Redis**: 緩存 (可選)

### 存儲桶分類
- `product-images`: 商品圖片
- `user-avatars`: 用戶頭像
- `category-images`: 分類圖片
- `system-files`: 系統文件

## 🚀 快速開始

### 1. 環境配置

```bash
# 複製環境變數文件
cp env.example .env

# 編輯環境變數
nano .env
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動服務

#### 使用 Docker Compose (推薦)
```bash
# 啟動所有服務 (MinIO + PostgreSQL + System Service)
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f system-service
```

#### 手動啟動
```bash
# 1. 啟動 MinIO
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"

# 2. 啟動 PostgreSQL
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=ecommerce_system \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  postgres:15-alpine

# 3. 啟動系統服務
npm start
```

## 📡 API 端點

### 文件上傳

#### 上傳圖片
```http
POST /api/v1/utilities/upload/image
Content-Type: multipart/form-data

{
  "image": <file>,
  "entityType": "product",
  "entityId": "123",
  "description": "商品主圖",
  "tags": "主圖,商品",
  "category": "image",
  "is_public": true
}
```

#### 上傳普通文件
```http
POST /api/v1/utilities/upload/file
Content-Type: multipart/form-data

{
  "file": <file>,
  "category": "system",
  "description": "系統文件",
  "tags": "系統,配置",
  "is_public": false
}
```

### 文件管理

#### 獲取文件列表
```http
GET /api/v1/utilities/files?category=image&page=1&limit=20
```

#### 獲取文件信息
```http
GET /api/v1/utilities/files/{fileId}
```

#### 獲取文件統計
```http
GET /api/v1/utilities/files/stats
```

#### 刪除文件
```http
DELETE /api/v1/utilities/files/{fileId}
```

### 備份管理

#### 創建備份
```http
POST /api/v1/utilities/backup
{
  "backup_type": "full",
  "include_logs": true,
  "description": "系統全量備份"
}
```

#### 獲取備份列表
```http
GET /api/v1/utilities/backup?page=1&limit=10
```

### 系統清理

#### 清理數據
```http
POST /api/v1/utilities/cleanup
{
  "cleanup_type": "logs",
  "older_than_days": 30
}
```

## 🔧 配置說明

### 環境變數

```bash
# MinIO 配置
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# 存儲桶配置
BUCKET_PRODUCTS=product-images
BUCKET_AVATARS=user-avatars
BUCKET_CATEGORIES=category-images
BUCKET_SYSTEM=system-files

# 圖片處理配置
MAX_FILE_SIZE=10485760          # 10MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
IMAGE_QUALITY=80
THUMBNAIL_SIZE=300
```

### 數據庫模型

#### FileUpload 模型
```javascript
{
  id: UUID,
  filename: String,              // 文件名
  original_name: String,         // 原始文件名
  bucket_name: String,          // MinIO 存儲桶
  object_name: String,          // MinIO 對象名
  url: String,                  // 訪問 URL
  width: Integer,               // 圖片寬度
  height: Integer,              // 圖片高度
  thumbnail_url: String,        // 縮略圖 URL
  entity_type: String,          // 實體類型
  entity_id: String,           // 實體 ID
  file_size: BigInt,           // 文件大小
  mime_type: String,           // MIME 類型
  uploader_id: UUID,           // 上傳者 ID
  category: String,            // 文件分類
  tags: JSONB,                 // 標籤
  description: Text,           // 描述
  is_public: Boolean,          // 是否公開
  status: String,              // 狀態
  expires_at: Date             // 過期時間
}
```

## 🖼️ 圖片處理功能

### 自動處理
- **格式轉換**: 自動轉換為 JPEG/PNG/WebP
- **壓縮優化**: 可配置質量參數
- **縮略圖生成**: 自動生成 300px 縮略圖
- **元數據提取**: 自動提取圖片尺寸信息

### 支援格式
- JPEG/JPG
- PNG
- GIF
- WebP

## 🔍 監控與日誌

### 健康檢查
```http
GET /api/v1/health
```

響應示例：
```json
{
  "success": true,
  "service": "System Service",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "databases": {
    "postgresql": "connected",
    "minio": "connected"
  }
}
```

### 日誌配置
- 使用 Winston 日誌庫
- 支援多級別日誌 (error, warn, info, debug)
- 自動輪轉和壓縮
- 結構化日誌輸出

## 🛠️ 開發指南

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 運行測試
npm test

# 代碼檢查
npm run lint
```

### 測試 MinIO 連接

```bash
# 檢查 MinIO 服務狀態
curl http://localhost:9000/minio/health/live

# 檢查存儲桶
curl http://localhost:9000/minio/health/ready
```

### 數據庫遷移

```bash
# 創建遷移文件
npx sequelize-cli migration:generate --name add-minio-fields

# 執行遷移
npx sequelize-cli db:migrate

# 回滾遷移
npx sequelize-cli db:migrate:undo
```

## 🚨 故障排除

### 常見問題

#### 1. MinIO 連接失敗
```bash
# 檢查 MinIO 服務狀態
docker ps | grep minio

# 檢查網絡連接
curl -I http://localhost:9000

# 檢查環境變數
echo $MINIO_ENDPOINT
echo $MINIO_ACCESS_KEY
```

#### 2. 文件上傳失敗
- 檢查文件大小限制
- 檢查文件類型是否支援
- 檢查 MinIO 存儲桶是否存在
- 檢查磁盤空間

#### 3. 圖片處理失敗
- 檢查 Sharp 依賴是否正確安裝
- 檢查圖片格式是否支援
- 檢查內存使用情況

### 日誌查看

```bash
# Docker 環境
docker-compose logs -f system-service

# 本地環境
tail -f logs/system-service.log
```

## 📚 相關文檔

- [MinIO 官方文檔](https://docs.min.io/)
- [Sharp 圖片處理庫](https://sharp.pixelplumbing.com/)
- [Sequelize ORM](https://sequelize.org/)
- [Multer 文件上傳](https://github.com/expressjs/multer)

## 🤝 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 許可證

MIT License - 詳見 [LICENSE](LICENSE) 文件
