# 🛒 電商系統 Product Service API 文檔

## 📋 概述

這是電商系統商品服務的 API 文檔，提供完整的商品和分類管理功能。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3001/api-docs/
- **健康檢查**: http://localhost:3001/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 📦 商品管理
- `GET /api/v1/products` - 取得商品列表
- `GET /api/v1/products/:id` - 取得商品詳情
- `POST /api/v1/products` - 新增商品
- `PUT /api/v1/products/:id` - 更新商品
- `DELETE /api/v1/products/:id` - 刪除商品

### 🏷️ 分類管理
- `GET /api/v1/categories` - 取得分類列表
- `POST /api/v1/categories` - 新增分類

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3001/health
```

### 2. 取得商品列表
```bash
curl http://localhost:3001/api/v1/products
```

### 3. 取得分類列表
```bash
curl http://localhost:3001/api/v1/categories
```

### 4. 新增商品
```bash
curl -X POST http://localhost:3001/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試商品",
    "description": "這是一個測試商品",
    "price": 1000,
    "categoryId": "68b7d361f9f4bfdffafa3350",
    "stock": 10
  }'
```

## 📋 資料模型

### Product (商品)
```json
{
  "_id": "string",
  "name": "string (必填, 最大255字)",
  "description": "string (必填)",
  "price": "number (必填, 最小值0)",
  "categoryId": "string (必填)",
  "stock": "number (最小值0, 預設0)",
  "status": "string (enum: active, inactive, 預設inactive)",
  "attributes": "object",
  "images": "array of strings",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Category (分類)
```json
{
  "_id": "string",
  "name": "string (必填, 最大100字)",
  "parentId": "string (可選)",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

## 🔍 查詢參數

### 商品列表篩選
- `page` (number): 頁碼，預設 1
- `limit` (number): 每頁數量，預設 20
- `category` (string): 分類 ID 篩選
- `status` (string): 狀態篩選 (active, inactive)
- `search` (string): 搜尋關鍵字 (商品名稱和描述)

### 範例
```bash
# 搜尋 iPhone 相關商品
curl "http://localhost:3001/api/v1/products?search=iPhone"

# 取得第2頁，每頁10筆
curl "http://localhost:3001/api/v1/products?page=2&limit=10"

# 篩選活躍商品
curl "http://localhost:3001/api/v1/products?status=active"
```

## 📊 回應格式

### 成功回應
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功訊息",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息",
    "details": [
      {
        "field": "fieldName",
        "message": "欄位錯誤訊息"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🚀 部署資訊

- **服務名稱**: Product Service
- **版本**: 1.0.0
- **端口**: 3001
- **資料庫**: MongoDB
- **框架**: Express.js
- **文檔**: Swagger UI

## 🔗 相關連結

- [Swagger UI 文檔](http://localhost:3001/api-docs/)
- [健康檢查](http://localhost:3001/health)
- [GitHub 專案](https://github.com/ecommerce-system)

## 📞 支援

如有問題或建議，請聯繫：
- 團隊: 電商系統團隊
- Email: team@ecommerce.com
- 專案: https://github.com/ecommerce-system

---

*最後更新: 2025-09-03*
