# 🛒 電商系統管理後台 API 設計文檔

## 📋 概述

本文件定義電商系統管理後台的所有 API 端點，包含用戶管理、訂單管理、營運分析、系統設定等功能。

## 🏗️ 系統架構

```
管理後台 API 架構
├── 🔐 認證授權 (Auth Service)
├── 👥 用戶管理 (User Service)
├── 📦 商品管理 (Product Service) ✅
├── 📋 訂單管理 (Order Service)
├── 📊 營運分析 (Analytics Service)
├── ⚙️ 系統設定 (Settings Service)
└── 🔍 搜尋推薦 (Search Service)
```

## 🔐 1. 認證授權 API (Auth Service)

### 1.1 管理員登入
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@ecommerce.com",
  "password": "admin123"
}
```

**回應**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "admin@ecommerce.com",
      "role": "admin",
      "permissions": ["users:read", "users:write", "orders:read"]
    }
  },
  "message": "登入成功"
}
```

### 1.2 管理員登出
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

### 1.3 取得管理員資料
```http
GET /api/v1/auth/profile
Authorization: Bearer {token}
```

### 1.4 修改密碼
```http
PUT /api/v1/auth/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "old123",
  "newPassword": "new123"
}
```

### 1.5 重新整理 Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}
```

## 👥 2. 用戶管理 API (User Service)

### 2.1 用戶列表
```http
GET /api/v1/users?page=1&limit=20&search=john&status=active
Authorization: Bearer {token}
```

**查詢參數**
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 20)
- `search`: 搜尋關鍵字 (用戶名、Email)
- `status`: 狀態篩選 (active, inactive, banned)
- `role`: 角色篩選 (user, vip, admin)
- `dateFrom`: 註冊日期開始
- `dateTo`: 註冊日期結束

### 2.2 用戶詳情
```http
GET /api/v1/users/{userId}
Authorization: Bearer {token}
```

### 2.3 新增用戶
```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+886912345678",
  "role": "user"
}
```

### 2.4 更新用戶
```http
PUT /api/v1/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+886912345679",
  "status": "active"
}
```

### 2.5 刪除用戶
```http
DELETE /api/v1/users/{userId}
Authorization: Bearer {token}
```

### 2.6 更新用戶角色
```http
PUT /api/v1/users/{userId}/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "vip"
}
```

### 2.7 用戶行為分析
```http
GET /api/v1/users/{userId}/analytics
Authorization: Bearer {token}
```

## 📋 3. 訂單管理 API (Order Service)

### 3.1 訂單列表
```http
GET /api/v1/orders?page=1&limit=20&status=pending&dateFrom=2024-01-01
Authorization: Bearer {token}
```

**查詢參數**
- `page`: 頁碼
- `limit`: 每頁數量
- `status`: 訂單狀態 (pending, paid, shipped, delivered, cancelled)
- `dateFrom`: 訂單日期開始
- `dateTo`: 訂單日期結束
- `customerId`: 客戶 ID
- `orderNumber`: 訂單編號

### 3.2 訂單詳情
```http
GET /api/v1/orders/{orderId}
Authorization: Bearer {token}
```

### 3.3 更新訂單狀態
```http
PUT /api/v1/orders/{orderId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "note": "已出貨"
}
```

### 3.4 退款處理
```http
POST /api/v1/orders/{orderId}/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1000,
  "reason": "客戶要求退款",
  "refundMethod": "credit_card"
}
```

### 3.5 訂單統計
```http
GET /api/v1/orders/statistics?period=month
Authorization: Bearer {token}
```

## 📊 4. 營運分析 API (Analytics Service)

### 4.1 銷售分析
```http
GET /api/v1/analytics/sales?period=month&dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer {token}
```

**回應**
```json
{
  "success": true,
  "data": {
    "totalSales": 1500000,
    "totalOrders": 150,
    "averageOrderValue": 10000,
    "salesByDay": [
      {"date": "2024-01-01", "sales": 50000, "orders": 5},
      {"date": "2024-01-02", "sales": 60000, "orders": 6}
    ],
    "topProducts": [
      {"productId": "prod1", "name": "iPhone 15", "sales": 200000},
      {"productId": "prod2", "name": "MacBook Pro", "sales": 180000}
    ]
  }
}
```

### 4.2 用戶分析
```http
GET /api/v1/analytics/users?period=month
Authorization: Bearer {token}
```

**回應**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "newUsers": 50,
    "activeUsers": 800,
    "userGrowth": [
      {"date": "2024-01-01", "newUsers": 10, "totalUsers": 950},
      {"date": "2024-01-02", "newUsers": 15, "totalUsers": 965}
    ],
    "userSegments": {
      "vip": 100,
      "regular": 800,
      "inactive": 100
    }
  }
}
```

### 4.3 商品分析
```http
GET /api/v1/analytics/products?period=month
Authorization: Bearer {token}
```

### 4.4 營收分析
```http
GET /api/v1/analytics/revenue?period=month
Authorization: Bearer {token}
```

### 4.5 庫存分析
```http
GET /api/v1/analytics/inventory
Authorization: Bearer {token}
```

## ⚙️ 5. 系統設定 API (Settings Service)

### 5.1 取得系統設定
```http
GET /api/v1/settings
Authorization: Bearer {token}
```

**回應**
```json
{
  "success": true,
  "data": {
    "site": {
      "name": "電商系統",
      "description": "現代化電商平台",
      "logo": "https://example.com/logo.png",
      "favicon": "https://example.com/favicon.ico"
    },
    "contact": {
      "email": "support@ecommerce.com",
      "phone": "+886912345678",
      "address": "台北市信義區..."
    },
    "social": {
      "facebook": "https://facebook.com/ecommerce",
      "instagram": "https://instagram.com/ecommerce"
    }
  }
}
```

### 5.2 更新系統設定
```http
PUT /api/v1/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "site": {
    "name": "新電商系統",
    "description": "全新電商平台"
  }
}
```

### 5.3 支付設定
```http
GET /api/v1/settings/payment
Authorization: Bearer {token}
```

### 5.4 更新支付設定
```http
PUT /api/v1/settings/payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "creditCard": {
    "enabled": true,
    "merchantId": "merchant_123",
    "apiKey": "api_key_123"
  },
  "bankTransfer": {
    "enabled": true,
    "accountNumber": "1234567890",
    "bankName": "台灣銀行"
  }
}
```

### 5.5 物流設定
```http
GET /api/v1/settings/shipping
Authorization: Bearer {token}
```

### 5.6 更新物流設定
```http
PUT /api/v1/settings/shipping
Authorization: Bearer {token}
Content-Type: application/json

{
  "methods": [
    {
      "name": "宅配",
      "price": 100,
      "enabled": true
    },
    {
      "name": "超商取貨",
      "price": 60,
      "enabled": true
    }
  ]
}
```

## 🔍 6. 搜尋推薦 API (Search Service)

### 6.1 搜尋商品
```http
GET /api/v1/search/products?q=iPhone&category=smartphone&priceMin=10000&priceMax=50000
Authorization: Bearer {token}
```

### 6.2 搜尋用戶
```http
GET /api/v1/search/users?q=john&role=user
Authorization: Bearer {token}
```

### 6.3 搜尋訂單
```http
GET /api/v1/search/orders?q=ORD123456
Authorization: Bearer {token}
```

### 6.4 推薦設定
```http
GET /api/v1/search/recommendations/settings
Authorization: Bearer {token}
```

### 6.5 更新推薦設定
```http
PUT /api/v1/search/recommendations/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "algorithm": "collaborative_filtering",
  "maxRecommendations": 10,
  "enabled": true
}
```

## 📦 7. 商品管理 API (Product Service) - 擴展

### 7.1 批量操作
```http
POST /api/v1/products/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "update_status",
  "productIds": ["prod1", "prod2", "prod3"],
  "data": {
    "status": "active"
  }
}
```

### 7.2 商品統計
```http
GET /api/v1/products/statistics
Authorization: Bearer {token}
```

### 7.3 庫存警告
```http
GET /api/v1/products/low-stock?threshold=10
Authorization: Bearer {token}
```

### 7.4 商品匯入
```http
POST /api/v1/products/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": "products.csv"
}
```

### 7.5 商品匯出
```http
GET /api/v1/products/export?format=csv
Authorization: Bearer {token}
```

## 🔐 8. 權限管理 API (Permission Service)

### 8.1 角色列表
```http
GET /api/v1/roles
Authorization: Bearer {token}
```

### 8.2 新增角色
```http
POST /api/v1/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "商品管理員",
  "permissions": ["products:read", "products:write", "categories:read"]
}
```

### 8.3 更新角色
```http
PUT /api/v1/roles/{roleId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": ["products:read", "products:write", "categories:read", "orders:read"]
}
```

### 8.4 刪除角色
```http
DELETE /api/v1/roles/{roleId}
Authorization: Bearer {token}
```

## 📝 9. 日誌管理 API (Log Service)

### 9.1 系統日誌
```http
GET /api/v1/logs/system?level=error&dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer {token}
```

### 9.2 用戶操作日誌
```http
GET /api/v1/logs/user-actions?userId=user123&action=login&dateFrom=2024-01-01
Authorization: Bearer {token}
```

### 9.3 API 存取日誌
```http
GET /api/v1/logs/api-access?endpoint=/api/v1/products&status=200&dateFrom=2024-01-01
Authorization: Bearer {token}
```

## 🔔 10. 通知管理 API (Notification Service)

### 10.1 系統通知
```http
GET /api/v1/notifications?type=system&read=false
Authorization: Bearer {token}
```

### 10.2 發送通知
```http
POST /api/v1/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "system",
  "title": "系統維護通知",
  "message": "系統將於今晚進行維護",
  "recipients": ["all", "admin"]
}
```

### 10.3 標記已讀
```http
PUT /api/v1/notifications/{notificationId}/read
Authorization: Bearer {token}
```

## 📊 11. 儀表板 API (Dashboard Service)

### 11.1 儀表板概覽
```http
GET /api/v1/dashboard/overview
Authorization: Bearer {token}
```

**查詢參數**
- `period`: 時間週期 (today, week, month, year)
- `timezone`: 時區 (預設: Asia/Taipei)

**回應**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSales": 1500000,
      "totalOrders": 750,
      "totalUsers": 300,
      "totalProducts": 150,
      "averageOrderValue": 2000,
      "conversionRate": 2.5
    },
    "periods": {
      "today": {
        "sales": 50000,
        "orders": 25,
        "newUsers": 10,
        "visitors": 1000,
        "growth": {
          "sales": 15.5,
          "orders": 8.2,
          "users": 12.3
        }
      },
      "thisWeek": {
        "sales": 350000,
        "orders": 175,
        "newUsers": 70,
        "visitors": 7000,
        "growth": {
          "sales": 22.1,
          "orders": 18.7,
          "users": 25.4
        }
      },
      "thisMonth": {
        "sales": 1500000,
        "orders": 750,
        "newUsers": 300,
        "visitors": 30000,
        "growth": {
          "sales": 35.2,
          "orders": 28.9,
          "users": 42.1
        }
      }
    },
    "alerts": [
      {
        "id": "alert_001",
        "type": "low_stock",
        "message": "iPhone 15 Pro 庫存不足 (剩餘: 5件)",
        "severity": "warning",
        "timestamp": "2025-09-03T13:00:00Z",
        "action": "restock"
      },
      {
        "id": "alert_002",
        "type": "high_demand",
        "message": "MacBook Pro 需求激增 (+150%)",
        "severity": "info",
        "timestamp": "2025-09-03T12:30:00Z",
        "action": "monitor"
      }
    ],
    "systemStatus": {
      "overall": "healthy",
      "services": {
        "product": "healthy",
        "order": "healthy",
        "user": "healthy",
        "analytics": "healthy",
        "settings": "healthy"
      },
      "lastUpdated": "2025-09-03T13:05:00Z"
    }
  }
}
```

### 11.2 即時統計
```http
GET /api/v1/dashboard/realtime
Authorization: Bearer {token}
```

**查詢參數**
- `interval`: 更新間隔 (5s, 10s, 30s, 60s)

**回應**
```json
{
  "success": true,
  "data": {
    "current": {
      "activeUsers": 45,
      "pendingOrders": 12,
      "processingOrders": 8,
      "lowStockProducts": 3,
      "systemLoad": 65.2
    },
    "trends": {
      "userActivity": {
        "current": 45,
        "trend": "up",
        "change": 12.5
      },
      "orderVolume": {
        "current": 20,
        "trend": "up",
        "change": 8.3
      },
      "revenue": {
        "current": 25000,
        "trend": "up",
        "change": 15.7
      }
    },
    "liveEvents": [
      {
        "id": "event_001",
        "type": "new_order",
        "message": "新訂單 #ORD-2025-001",
        "timestamp": "2025-09-03T13:05:30Z",
        "amount": 3500
      },
      {
        "id": "event_002",
        "type": "new_user",
        "message": "新用戶註冊: john.doe@example.com",
        "timestamp": "2025-09-03T13:04:15Z"
      }
    ],
    "lastUpdated": "2025-09-03T13:05:30Z"
  }
}
```

### 11.3 詳細分析數據
```http
GET /api/v1/dashboard/analytics
Authorization: Bearer {token}
```

**查詢參數**
- `type`: 分析類型 (sales, users, products, performance)
- `period`: 時間週期 (7d, 30d, 90d, 1y)
- `groupBy`: 分組方式 (day, week, month, category)

**回應**
```json
{
  "success": true,
  "data": {
    "salesAnalytics": {
      "trend": [
        {
          "date": "2025-09-01",
          "sales": 45000,
          "orders": 22,
          "averageOrderValue": 2045
        },
        {
          "date": "2025-09-02",
          "sales": 52000,
          "orders": 28,
          "averageOrderValue": 1857
        }
      ],
      "topProducts": [
        {
          "productId": "prod_001",
          "name": "iPhone 15 Pro",
          "sales": 150000,
          "orders": 75,
          "revenue": 150000
        }
      ],
      "topCategories": [
        {
          "categoryId": "cat_001",
          "name": "智慧型手機",
          "sales": 250000,
          "orders": 125,
          "revenue": 250000
        }
      ]
    },
    "userAnalytics": {
      "growth": [
        {
          "date": "2025-09-01",
          "newUsers": 15,
          "activeUsers": 120,
          "retentionRate": 85.5
        }
      ],
      "demographics": {
        "ageGroups": {
          "18-25": 25,
          "26-35": 40,
          "36-45": 20,
          "46+": 15
        },
        "locations": {
          "台北市": 35,
          "新北市": 25,
          "桃園市": 20,
          "其他": 20
        }
      },
      "behavior": {
        "averageSessionDuration": 450,
        "bounceRate": 35.2,
        "conversionRate": 2.8
      }
    },
    "performanceMetrics": {
      "systemPerformance": {
        "responseTime": 120,
        "uptime": 99.9,
        "errorRate": 0.1
      },
      "businessMetrics": {
        "customerSatisfaction": 4.8,
        "returnRate": 2.5,
        "customerLifetimeValue": 8500
      }
    }
  }
}
```

### 11.4 設定整合
```http
GET /api/v1/dashboard/settings
Authorization: Bearer {token}
```

**查詢參數**
- `category`: 設定分類 (system, payment, shipping, notification, security)

**回應**
```json
{
  "success": true,
  "data": {
    "systemSettings": {
      "siteInfo": {
        "siteName": "電商系統",
        "siteDescription": "專業的電商平台",
        "contactEmail": "support@ecommerce.com",
        "timezone": "Asia/Taipei",
        "currency": "TWD",
        "language": "zh-TW"
      },
      "maintenance": {
        "maintenanceMode": false,
        "maintenanceMessage": "系統維護中，請稍後再試"
      }
    },
    "businessSettings": {
      "paymentMethods": {
        "stripeEnabled": false,
        "paypalEnabled": false,
        "bankTransferEnabled": true,
        "cashOnDeliveryEnabled": true,
        "cashOnDeliveryFee": 0
      },
      "shippingConfig": {
        "freeShippingThreshold": 1000,
        "defaultShippingFee": 100,
        "returnPolicy": {
          "enabled": true,
          "days": 7,
          "conditions": ["商品必須完整未使用", "包裝必須完整"]
        }
      }
    },
    "notificationSettings": {
      "emailNotifications": {
        "orderConfirmation": true,
        "orderStatusUpdate": true,
        "shippingConfirmation": true,
        "deliveryConfirmation": true
      }
    },
    "securitySettings": {
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": true
      },
      "sessionSettings": {
        "sessionTimeout": 30,
        "maxSessions": 5,
        "rememberMeEnabled": true
      }
    }
  }
}
```

### 11.5 小工具數據
```http
GET /api/v1/dashboard/widgets
Authorization: Bearer {token}
```

**查詢參數**
- `widgets`: 小工具列表 (comma separated)
- `refresh`: 是否強制刷新 (true/false)

**回應**
```json
{
  "success": true,
  "data": {
    "quickStats": {
      "totalRevenue": 1500000,
      "totalOrders": 750,
      "totalCustomers": 300,
      "totalProducts": 150
    },
    "recentOrders": [
      {
        "orderId": "ORD-2025-001",
        "customerName": "張小明",
        "amount": 3500,
        "status": "processing",
        "createdAt": "2025-09-03T13:05:30Z"
      }
    ],
    "topProducts": [
      {
        "productId": "prod_001",
        "name": "iPhone 15 Pro",
        "sales": 150000,
        "stock": 25,
        "image": "https://example.com/iphone15pro.jpg"
      }
    ],
    "systemAlerts": [
      {
        "id": "alert_001",
        "type": "low_stock",
        "message": "iPhone 15 Pro 庫存不足",
        "severity": "warning",
        "timestamp": "2025-09-03T13:00:00Z"
      }
    ],
    "performanceMetrics": {
      "responseTime": 120,
      "uptime": 99.9,
      "errorRate": 0.1,
      "activeUsers": 45
    }
  }
}
```

### 11.6 自定義報表
```http
POST /api/v1/dashboard/reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "sales_report",
  "period": {
    "start": "2025-09-01",
    "end": "2025-09-30"
  },
  "filters": {
    "category": "electronics",
    "status": "completed"
  },
  "format": "pdf"
}
```

**回應**
```json
{
  "success": true,
  "data": {
    "reportId": "report_20250903_001",
    "status": "generating",
    "downloadUrl": "https://api.ecommerce.com/reports/report_20250903_001.pdf",
    "expiresAt": "2025-09-10T13:05:30Z"
  }
}
```

### 11.7 報表狀態查詢
```http
GET /api/v1/dashboard/reports/{reportId}
Authorization: Bearer {token}
```

**回應**
```json
{
  "success": true,
  "data": {
    "reportId": "report_20250903_001",
    "status": "completed",
    "progress": 100,
    "downloadUrl": "https://api.ecommerce.com/reports/report_20250903_001.pdf",
    "expiresAt": "2025-09-10T13:05:30Z",
    "createdAt": "2025-09-03T13:05:30Z",
    "completedAt": "2025-09-03T13:06:15Z"
  }
}
```

## 🔧 12. 工具 API (Utility Service)

### 12.1 檔案上傳
```http
POST /api/v1/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": "image.jpg"
}
```

### 12.2 資料備份
```http
POST /api/v1/backup/create
Authorization: Bearer {token}
```

### 12.3 資料還原
```http
POST /api/v1/backup/restore
Authorization: Bearer {token}
Content-Type: application/json

{
  "backupId": "backup_123"
}
```

## 📋 API 回應格式標準

### 成功回應
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功",
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
    "code": "VALIDATION_ERROR",
    "message": "驗證失敗",
    "details": [
      {
        "field": "email",
        "message": "Email 格式不正確"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔐 認證與授權

### JWT Token 格式
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "user_123",
    "email": "admin@ecommerce.com",
    "role": "admin",
    "permissions": ["users:read", "users:write"],
    "iat": 1642234567,
    "exp": 1642320967
  }
}
```

### 權限代碼
- `users:read` - 讀取用戶資料
- `users:write` - 修改用戶資料
- `orders:read` - 讀取訂單資料
- `orders:write` - 修改訂單資料
- `products:read` - 讀取商品資料
- `products:write` - 修改商品資料
- `analytics:read` - 讀取分析資料
- `settings:write` - 修改系統設定

## 🚀 部署資訊

### 服務端口
- Auth Service: 3001
- User Service: 3002
- Product Service: 3003
- Order Service: 3004
- Analytics Service: 3005
- Settings Service: 3006
- Search Service: 3007

### 環境變數
```bash
# 資料庫
MONGODB_URI=mongodb://admin:password123@localhost:27017/ecommerce
REDIS_URI=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# 服務
NODE_ENV=development
PORT=3001
```

---

*最後更新: 2025-09-03*
