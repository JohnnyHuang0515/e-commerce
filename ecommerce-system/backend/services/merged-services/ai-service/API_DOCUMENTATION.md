# 🧠 電商系統 AI Service API 文檔

## 📋 概述

這是電商系統 AI 服務的 API 文檔，提供完整的 AI 功能，包括搜尋、推薦、分析、快取管理等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3005/api-docs/
- **健康檢查**: http://localhost:3005/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 🧠 AI 搜尋
- `POST /api/v1/search` - 執行搜尋
- `GET /api/v1/search/suggestions` - 獲取搜尋建議
- `GET /api/v1/search/trending` - 獲取熱門搜尋
- `GET /api/v1/search/analytics` - 獲取搜尋分析
- `POST /api/v1/search/click` - 記錄搜尋結果點擊

### 💡 AI 推薦
- `GET /api/v1/recommendations` - 獲取推薦項目
- `GET /api/v1/recommendations/similar` - 獲取相似項目推薦
- `GET /api/v1/recommendations/personalized` - 獲取個人化推薦
- `GET /api/v1/recommendations/trending` - 獲取熱門推薦
- `POST /api/v1/recommendations/click` - 記錄推薦項目點擊
- `GET /api/v1/recommendations/analytics` - 獲取推薦分析

### 📈 AI 分析
- `GET /api/v1/analytics/overview` - 獲取分析概覽
- `GET /api/v1/analytics/user-behavior` - 獲取用戶行為分析
- `GET /api/v1/analytics/trends` - 獲取趨勢分析
- `GET /api/v1/analytics/insights` - 獲取 AI 洞察
- `GET /api/v1/analytics/reports` - 獲取分析報告列表
- `POST /api/v1/analytics/reports` - 生成分析報告
- `GET /api/v1/analytics/reports/:reportId` - 獲取分析報告詳情

### ⚡ 快取管理
- `GET /api/v1/cache/stats` - 獲取快取統計信息
- `GET /api/v1/cache/health` - 快取健康檢查
- `POST /api/v1/cache/clear` - 清理快取
- `GET /api/v1/cache/get/:key` - 獲取快取值
- `POST /api/v1/cache/set` - 設置快取值
- `DELETE /api/v1/cache/delete/:key` - 刪除快取值

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3005/health
```

### 2. 執行搜尋
```bash
curl -X POST http://localhost:3005/api/v1/search \
  -H "Content-Type: application/json" \
  -d ".{
    \"query\": \"夏季運動鞋\",
    \"limit\": 5
  }"
```

### 3. 獲取推薦
```bash
curl "http://localhost:3005/api/v1/recommendations?type=trending&limit=3"
```

### 4. 獲取分析概覽
```bash
curl "http://localhost:3005/api/v1/analytics/overview?period=week"
```

### 5. 清理快取
```bash
curl -X POST http://localhost:3005/api/v1/cache/clear \
  -H "Content-Type: application/json" \
  -d ".{
    \"pattern\": \"search:*\"
  }"
```
