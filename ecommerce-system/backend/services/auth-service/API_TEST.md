# 🔐 Auth Service API 測試文檔

## 📋 概述

本文件提供 Auth Service 的 API 測試範例，包含所有端點的測試指令。

## 🚀 服務狀態

- **服務地址**: http://localhost:3001
- **API 文檔**: http://localhost:3001/api-docs
- **健康檢查**: http://localhost:3001/health
- **狀態**: ✅ 運行中

## 🔧 API 測試

### 1. 健康檢查
```bash
curl http://localhost:3001/health
```

**回應範例**:
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2025-09-03T07:59:17.701Z",
  "uptime": 8.709764355,
  "memory": {
    "rss": 74772480,
    "heapTotal": 23588864,
    "heapUsed": 21720448,
    "external": 20501740,
    "arrayBuffers": 18262464
  }
}
```

### 2. 管理員登入
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecommerce.com",
    "password": "admin123"
  }'
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "mock-user-id",
      "email": "admin@ecommerce.com",
      "name": "管理員",
      "role": "admin",
      "permissions": [
        "users:read",
        "users:write",
        "orders:read",
        "orders:write"
      ]
    }
  },
  "message": "登入成功"
}
```

### 3. 取得管理員資料
```bash
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "id": "mock-user-id",
    "email": "admin@ecommerce.com",
    "name": "管理員",
    "role": "admin",
    "permissions": [
      "users:read",
      "users:write",
      "orders:read",
      "orders:write"
    ],
    "profile": {
      "birthday": null,
      "gender": null,
      "address": null
    },
    "preferences": {
      "language": "zh-TW",
      "currency": "TWD",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    },
    "statistics": {
      "totalOrders": 0,
      "totalSpent": 0,
      "lastLoginAt": "2025-09-03T07:59:43.427Z",
      "loginCount": 1
    }
  }
}
```

### 4. 修改密碼
```bash
curl -X PUT http://localhost:3001/api/v1/auth/password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old123",
    "newPassword": "new123"
  }'
```

**回應範例**:
```json
{
  "success": true,
  "message": "密碼修改成功"
}
```

### 5. 重新整理 Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token 重新整理成功"
}
```

### 6. 管理員登出
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**回應範例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

## 🧪 完整測試腳本

### 自動化測試腳本
```bash
#!/bin/bash

echo "🔐 Auth Service API 測試"
echo "========================"

# 1. 健康檢查
echo "1. 健康檢查..."
curl -s http://localhost:3001/health | jq .
echo ""

# 2. 登入
echo "2. 管理員登入..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecommerce.com", "password": "admin123"}')

echo $LOGIN_RESPONSE | jq .

# 提取 Token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo ""

# 3. 取得資料
echo "3. 取得管理員資料..."
curl -s -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 4. 修改密碼
echo "4. 修改密碼..."
curl -s -X PUT http://localhost:3001/api/v1/auth/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old123", "newPassword": "new123"}' | jq .
echo ""

# 5. 重新整理 Token
echo "5. 重新整理 Token..."
curl -s -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 6. 登出
echo "6. 管理員登出..."
curl -s -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 測試完成！"
```

## 📝 測試注意事項

### 🔐 簡化認證版本

目前實作的是簡化版本，具有以下特點：

1. **登入**: 任何 email/password 都會成功
2. **Token 驗證**: 直接通過，不檢查 JWT 有效性
3. **權限檢查**: 直接通過，不檢查權限

### 🔄 後續實作項目

標記為 `TODO` 的部分將在後續實作：

- [ ] 真實的密碼驗證
- [ ] JWT Token 驗證
- [ ] 權限檢查
- [ ] 角色驗證
- [ ] Token 黑名單
- [ ] 速率限制

## 🐛 常見問題

### 1. 端口被佔用
```bash
# 檢查端口使用情況
lsof -i :3001

# 停止佔用端口的程序
kill -9 PID
```

### 2. 服務無法啟動
```bash
# 檢查日誌
cat auth.log

# 重新啟動服務
npm start
```

### 3. 資料庫連線失敗
```bash
# 檢查 MongoDB 狀態
sudo systemctl status mongodb

# 啟動 MongoDB
sudo systemctl start mongodb
```

## 📊 效能測試

### 壓力測試
```bash
# 使用 Apache Bench 進行壓力測試
ab -n 1000 -c 10 -H "Content-Type: application/json" \
  -p login_data.json \
  http://localhost:3001/api/v1/auth/login
```

### 登入資料檔案 (login_data.json)
```json
{
  "email": "admin@ecommerce.com",
  "password": "admin123"
}
```

---

*最後更新: 2025-09-03*
