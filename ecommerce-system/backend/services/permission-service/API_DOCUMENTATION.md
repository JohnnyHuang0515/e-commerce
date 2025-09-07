# 🔐 Permission Service API 文檔

---

**服務名稱**: Permission Service  
**版本**: v1.0.0  
**端口**: 3013  
**基礎路徑**: `/api/v1/permissions`  

---

## 📋 概述

Permission Service 提供完整的權限管理功能，包括角色管理、權限檢查、用戶角色分配等。基於 RBAC (Role-Based Access Control) 模型實現。

## 🎯 核心功能

- **權限檢查**: 檢查用戶是否有特定權限
- **角色管理**: 創建、更新、刪除角色
- **用戶角色分配**: 為用戶分配或移除角色
- **權限統計**: 提供權限使用統計
- **系統初始化**: 初始化系統預設角色和權限

## 🔐 認證

所有 API 都需要 JWT Token 認證：

```http
Authorization: Bearer <your-jwt-token>
```

## 📚 API 端點

### 1. 權限檢查

#### 檢查權限
```http
POST /api/v1/permissions/check
```

**請求體**:
```json
{
  "permission": "products:write",
  "resource": "product_123"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permission": "products:write",
    "resource": "product_123",
    "userId": "user_id"
  }
}
```

### 2. 用戶權限管理

#### 獲取用戶權限
```http
GET /api/v1/permissions/user/{userId}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "permissions": ["products:read", "products:write"],
    "roles": [
      {
        "id": "role_id",
        "name": "MERCHANT",
        "displayName": "商家管理員",
        "assignedAt": "2025-09-06T10:00:00Z",
        "expiresAt": null,
        "isValid": true
      }
    ]
  }
}
```

### 3. 角色管理

#### 獲取所有角色
```http
GET /api/v1/permissions/roles?page=1&limit=20&search=admin
```

**查詢參數**:
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 20)
- `search`: 搜尋關鍵字
- `isActive`: 是否活躍 (true/false)

**回應**:
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role_id",
        "name": "ADMIN",
        "displayName": "系統管理員",
        "description": "擁有所有權限的系統管理員",
        "permissions": ["*"],
        "permissionCount": 1,
        "isActive": true,
        "isSystem": true,
        "createdAt": "2025-09-06T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### 創建新角色
```http
POST /api/v1/permissions/roles
```

**請求體**:
```json
{
  "name": "CUSTOM_ROLE",
  "displayName": "自訂角色",
  "description": "自訂角色描述",
  "permissions": ["products:read", "orders:read"]
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "new_role_id",
      "name": "CUSTOM_ROLE",
      "displayName": "自訂角色",
      "description": "自訂角色描述",
      "permissions": ["products:read", "orders:read"],
      "permissionCount": 2,
      "isActive": true,
      "isSystem": false
    }
  },
  "message": "角色創建成功"
}
```

#### 獲取角色權限
```http
GET /api/v1/permissions/role/{roleId}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "role_id",
      "name": "MERCHANT",
      "displayName": "商家管理員",
      "description": "商家後台管理員",
      "permissions": ["products:read", "products:write", "orders:read"],
      "permissionCount": 3
    }
  }
}
```

#### 更新角色權限
```http
PUT /api/v1/permissions/role/{roleId}
```

**請求體**:
```json
{
  "permissions": ["products:read", "products:write", "orders:read", "orders:write"]
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "role_id",
      "name": "MERCHANT",
      "displayName": "商家管理員",
      "permissions": ["products:read", "products:write", "orders:read", "orders:write"],
      "permissionCount": 4
    }
  },
  "message": "角色權限更新成功"
}
```

### 4. 用戶角色分配

#### 分配角色給用戶
```http
POST /api/v1/permissions/assign
```

**請求體**:
```json
{
  "userId": "user_id",
  "roleId": "role_id",
  "expiresAt": "2025-12-31T23:59:59Z",
  "reason": "臨時管理員權限"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "userRole": {
      "id": "user_role_id",
      "userId": "user_id",
      "roleId": "role_id",
      "assignedBy": "admin_user_id",
      "assignedAt": "2025-09-06T10:00:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "reason": "臨時管理員權限",
      "isActive": true
    }
  },
  "message": "角色分配成功"
}
```

#### 移除用戶角色
```http
DELETE /api/v1/permissions/user/{userId}/role/{roleId}
```

**回應**:
```json
{
  "success": true,
  "message": "角色移除成功"
}
```

### 5. 權限管理

#### 獲取所有權限
```http
GET /api/v1/permissions/permissions?module=products&category=basic
```

**查詢參數**:
- `module`: 權限模組 (users, products, orders, analytics, system, payments, logistics, inventory)
- `category`: 權限類別 (basic, advanced, admin, system)

**回應**:
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "permission_id",
        "name": "products:read",
        "displayName": "查看商品",
        "description": "查看商品列表和詳情",
        "module": "products",
        "action": "read",
        "category": "basic",
        "riskLevel": "low",
        "isActive": true,
        "isSystem": true
      }
    ]
  }
}
```

### 6. 統計信息

#### 獲取權限統計
```http
GET /api/v1/permissions/stats
```

**回應**:
```json
{
  "success": true,
  "data": {
    "totalRoles": 5,
    "totalPermissions": 25,
    "totalUserRoles": 150,
    "roleStats": [
      {
        "name": "ADMIN",
        "displayName": "系統管理員",
        "userCount": 3,
        "permissionCount": 1
      },
      {
        "name": "MERCHANT",
        "displayName": "商家管理員",
        "userCount": 25,
        "permissionCount": 15
      }
    ]
  }
}
```

### 7. 系統管理

#### 初始化系統數據
```http
POST /api/v1/permissions/initialize
```

**權限要求**: 僅限 ADMIN 角色

**回應**:
```json
{
  "success": true,
  "message": "系統數據初始化成功"
}
```

## 🔐 權限要求

| API 端點 | 所需權限 | 說明 |
|----------|----------|------|
| `POST /check` | 無 | 檢查權限 |
| `GET /user/:userId` | 無 | 查看自己的權限 |
| `GET /roles` | 無 | 查看角色列表 |
| `POST /roles` | `system:settings` | 創建角色 |
| `PUT /role/:roleId` | `system:settings` | 更新角色權限 |
| `POST /assign` | `users:manage` | 分配角色 |
| `DELETE /user/:userId/role/:roleId` | `users:manage` | 移除角色 |
| `GET /permissions` | 無 | 查看權限列表 |
| `GET /stats` | `analytics:read` | 查看統計 |
| `POST /initialize` | ADMIN 角色 | 初始化系統 |

## 🎭 預設角色

### ADMIN (系統管理員)
- **權限**: `*` (所有權限)
- **描述**: 擁有所有權限的系統管理員

### MERCHANT (商家管理員)
- **權限**: 商品管理、訂單管理、營運分析、支付物流
- **描述**: 商家後台管理員

### STAFF (商家員工)
- **權限**: 基礎商品操作、訂單處理、庫存管理
- **描述**: 商家一般員工

### CUSTOMER (客戶)
- **權限**: 商品瀏覽、訂單操作、個人資料管理
- **描述**: 終端購物用戶

### GUEST (訪客)
- **權限**: 僅商品瀏覽
- **描述**: 未登入用戶

## 🔧 權限命名規範

格式: `{模組}:{操作}`

### 模組列表
- `users`: 用戶管理
- `products`: 商品管理
- `orders`: 訂單管理
- `analytics`: 營運分析
- `system`: 系統管理
- `payments`: 支付管理
- `logistics`: 物流管理
- `inventory`: 庫存管理

### 操作列表
- `read`: 查看
- `write`: 編輯
- `delete`: 刪除
- `manage`: 管理
- `analyze`: 分析
- `process`: 處理
- `refund`: 退款
- `publish`: 發布
- `export`: 導出
- `monitor`: 監控
- `settings`: 設定

## 🚨 錯誤代碼

| 代碼 | HTTP 狀態 | 說明 |
|------|-----------|------|
| `UNAUTHORIZED` | 401 | 未認證或認證失敗 |
| `FORBIDDEN` | 403 | 權限不足 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `BAD_REQUEST` | 400 | 請求參數錯誤 |
| `CONFLICT` | 409 | 資源衝突 |
| `VALIDATION_ERROR` | 400 | 數據驗證失敗 |
| `DUPLICATE_KEY` | 409 | 重複鍵值 |
| `RATE_LIMIT_EXCEEDED` | 429 | 請求過於頻繁 |
| `INTERNAL_ERROR` | 500 | 內部服務錯誤 |

## 📊 健康檢查

```http
GET /health
```

**回應**:
```json
{
  "success": true,
  "data": {
    "service": "Permission Service",
    "version": "1.0.0",
    "status": "healthy",
    "timestamp": "2025-09-06T10:00:00Z",
    "uptime": 3600
  }
}
```

## 📖 API 文檔

Swagger UI 文檔地址: `http://localhost:3013/api-docs`

---

**最後更新**: 2025-09-06  
**維護者**: 電商開發團隊
