# 👥 電商系統 User Service API 文檔

## 📋 概述

這是電商系統用戶服務的 API 文檔，提供完整的用戶管理功能，包括用戶 CRUD、角色管理、統計分析等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3002/api-docs/
- **健康檢查**: http://localhost:3002/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 👥 用戶管理
- `GET /api/v1/users` - 取得用戶列表
- `GET /api/v1/users/:userId` - 取得用戶詳情
- `POST /api/v1/users` - 建立新用戶
- `PUT /api/v1/users/:userId` - 更新用戶資料
- `DELETE /api/v1/users/:userId` - 刪除用戶

### 🔐 角色管理
- `PUT /api/v1/users/:userId/role` - 更新用戶角色
- `GET /api/v1/users/:userId/permissions` - 取得用戶權限

### 📊 統計分析
- `GET /api/v1/users/overview` - 取得用戶概覽統計
- `GET /api/v1/users/:userId/analytics` - 取得用戶統計
- `GET /api/v1/users/statistics` - 取得用戶統計

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3002/health
```

### 2. 取得用戶列表
```bash
curl http://localhost:3002/api/v1/users
```

### 3. 建立新用戶
```bash
curl -X POST http://localhost:3002/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "張",
    "lastName": "三",
    "phone": "0912345678",
    "role": "customer"
  }'
```

### 4. 更新用戶角色
```bash
curl -X PUT http://localhost:3002/api/v1/users/68b7d361f9f4bfdffafa3350/role \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### 5. 取得用戶概覽統計
```bash
curl http://localhost:3002/api/v1/users/overview
```

## 📋 資料模型

### User (用戶)
```json
{
  "_id": "string",
  "email": "string (必填, 唯一, 格式驗證)",
  "password": "string (必填, 最小8字)",
  "firstName": "string (必填, 最大50字)",
  "lastName": "string (必填, 最大50字)",
  "phone": "string (可選, 格式驗證)",
  "role": "string (enum: admin, manager, customer, 預設customer)",
  "status": "string (enum: active, inactive, suspended, 預設active)",
  "profile": {
    "avatar": "string (可選)",
    "birthDate": "date (可選)",
    "gender": "string (enum: male, female, other, 可選)",
    "address": {
      "street": "string (可選)",
      "city": "string (可選)",
      "state": "string (可選)",
      "postalCode": "string (可選)",
      "country": "string (可選)"
    }
  },
  "preferences": {
    "language": "string (預設: zh-TW)",
    "timezone": "string (預設: Asia/Taipei)",
    "notifications": {
      "email": "boolean (預設: true)",
      "sms": "boolean (預設: false)",
      "push": "boolean (預設: true)"
    }
  },
  "lastLoginAt": "date-time (可選)",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### User Statistics (用戶統計)
```json
{
  "total": "number",
  "active": "number",
  "inactive": "number",
  "suspended": "number",
  "newThisMonth": "number",
  "newThisWeek": "number",
  "onlineNow": "number",
  "roleDistribution": {
    "admin": "number",
    "manager": "number",
    "customer": "number"
  },
  "growthRate": "number (百分比)",
  "retentionRate": "number (百分比)"
}
```

### User Analytics (用戶分析)
```json
{
  "userId": "string",
  "totalOrders": "number",
  "totalSpent": "number",
  "averageOrderValue": "number",
  "lastOrderDate": "date-time",
  "favoriteCategories": ["string"],
  "activityScore": "number (0-100)",
  "lifetimeValue": "number"
}
```

## 🔍 查詢參數

### 用戶列表篩選
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 10, 最大: 100)
- `role` - 角色篩選
- `status` - 狀態篩選
- `search` - 搜尋關鍵字 (姓名、郵箱)
- `sortBy` - 排序欄位 (預設: createdAt)
- `sortOrder` - 排序方向 (asc/desc, 預設: desc)
- `startDate` - 註冊開始日期
- `endDate` - 註冊結束日期

### 範例查詢
```bash
# 搜尋用戶
curl "http://localhost:3002/api/v1/users?search=張三&limit=20"

# 取得管理員用戶
curl "http://localhost:3002/api/v1/users?role=admin"

# 取得本月新用戶
curl "http://localhost:3002/api/v1/users?startDate=2025-09-01&endDate=2025-09-30"

# 取得活躍用戶
curl "http://localhost:3002/api/v1/users?status=active&sortBy=lastLoginAt&sortOrder=desc"
```

## 🔐 角色與權限

### 角色定義
- **admin** - 系統管理員：所有權限
- **manager** - 管理員：用戶管理、商品管理
- **customer** - 客戶：基本用戶功能

### 權限矩陣
| 功能 | admin | manager | customer |
|------|-------|---------|----------|
| 查看用戶列表 | ✅ | ✅ | ❌ |
| 建立用戶 | ✅ | ✅ | ❌ |
| 更新用戶 | ✅ | ✅ | 自己 |
| 刪除用戶 | ✅ | ❌ | ❌ |
| 角色管理 | ✅ | ❌ | ❌ |
| 統計查看 | ✅ | ✅ | ❌ |

## 🔒 錯誤處理

### 常見錯誤碼
- `400` - 請求參數錯誤
- `401` - 未授權
- `403` - 權限不足
- `404` - 用戶不存在
- `409` - 郵箱已存在
- `422` - 驗證失敗
- `500` - 伺服器錯誤

### 錯誤回應格式
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用戶不存在",
    "details": "User with ID 68b7d361f9f4bfdffafa3350 not found"
  }
}
```

## 🔄 業務邏輯

### 用戶建立
1. 驗證郵箱唯一性
2. 密碼加密
3. 設定預設偏好
4. 建立用戶記錄
5. 發送歡迎郵件

### 密碼更新
1. 驗證舊密碼
2. 新密碼強度檢查
3. 密碼加密
4. 更新記錄
5. 通知用戶

### 角色更新
1. 驗證權限
2. 檢查角色有效性
3. 更新角色
4. 記錄變更歷史
5. 通知相關人員

## 🧪 測試案例

### 單元測試
- 用戶 CRUD 操作
- 密碼加密驗證
- 角色權限檢查
- 資料驗證

### 整合測試
- 與 Auth Service 整合
- 與 Order Service 整合
- 與 Analytics Service 整合

### 端到端測試
- 用戶註冊流程
- 角色管理流程
- 統計功能

## 📈 效能考量

### 資料庫索引
- `email` - 唯一索引
- `role` - 角色查詢優化
- `status` - 狀態篩選優化
- `createdAt` - 時間排序優化
- `lastLoginAt` - 活躍度查詢優化

### 快取策略
- 用戶統計快取 (5分鐘)
- 角色權限快取 (30分鐘)
- 熱門用戶快取 (1小時)

## 🔐 安全性

### 密碼安全
- 最小長度 8 字
- 包含大小寫字母、數字、特殊字符
- BCrypt 加密
- 密碼歷史記錄

### 資料保護
- 敏感資料加密
- 個人資料匿名化
- 資料保留政策
- GDPR 合規

### 存取控制
- JWT Token 驗證
- 角色基礎權限控制
- API 速率限制
- IP 白名單

## 📊 監控與日誌

### 關鍵指標
- 用戶註冊率
- 用戶活躍度
- 角色分布
- API 回應時間
- 錯誤率

### 日誌記錄
- 用戶操作日誌
- 權限變更日誌
- 登入失敗日誌
- 系統錯誤日誌

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Auth Service API](../auth-service/API_TEST.md)
- [Order Service API](../order-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-03)
- 初始版本發布
- 基本 CRUD 功能
- 角色管理
- 統計功能

### v1.1.0 (2025-09-04)
- 新增用戶分析功能
- 優化查詢效能
- 增強安全性

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.1.0  
**維護者**: 電商系統開發團隊
