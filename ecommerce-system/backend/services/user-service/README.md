# 👥 User Service - 電商系統用戶管理服務

## 📋 服務概述

User Service 是電商系統的用戶管理微服務，負責處理所有與用戶相關的操作，包括用戶註冊、資料管理、角色權限、統計分析等功能。

## ✨ 主要功能

### 🔐 用戶管理
- **用戶 CRUD 操作**: 建立、讀取、更新、刪除用戶
- **用戶搜尋與篩選**: 支援姓名、電子郵件搜尋，角色、狀態篩選
- **用戶角色管理**: 支援 user、vip、admin 三種角色
- **用戶狀態管理**: 支援 active、inactive、banned 三種狀態

### 📊 統計分析
- **用戶概覽統計**: 總用戶數、活躍用戶、管理員數量等
- **個人統計**: 訂單數量、消費金額、登入次數等
- **活躍用戶分析**: 最近登入用戶、註冊趨勢等

### 🔒 安全功能
- **密碼加密**: 使用 bcryptjs 進行密碼雜湊
- **資料驗證**: 電子郵件格式、電話號碼格式驗證
- **權限控制**: 整合 Auth Service 的認證機制

## 🚀 快速開始

### 環境需求
- Node.js 20.x
- MongoDB 7.x
- Docker (可選)

### 安裝與啟動

#### 1. 安裝依賴
```bash
npm install
```

#### 2. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env 檔案，設定必要的環境變數
```

#### 3. 啟動服務
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

#### 4. 驗證安裝
```bash
# 健康檢查
curl http://localhost:3002/health

# API 文檔
open http://localhost:3002/api-docs
```

## 🔧 API 端點

### 用戶管理
| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/v1/users` | 取得用戶列表 |
| GET | `/api/v1/users/overview` | 取得用戶概覽統計 |
| GET | `/api/v1/users/{userId}` | 取得單一用戶 |
| POST | `/api/v1/users` | 建立新用戶 |
| PUT | `/api/v1/users/{userId}` | 更新用戶資料 |
| DELETE | `/api/v1/users/{userId}` | 刪除用戶 |
| PUT | `/api/v1/users/{userId}/role` | 更新用戶角色 |
| GET | `/api/v1/users/{userId}/analytics` | 取得用戶統計 |

### 查詢參數
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 10)
- `search`: 搜尋關鍵字
- `role`: 角色篩選 (user/vip/admin)
- `status`: 狀態篩選 (active/inactive/banned)
- `sortBy`: 排序欄位 (預設: createdAt)
- `sortOrder`: 排序方向 (asc/desc)

## 📊 資料模型

### User Schema
```javascript
{
  email: String,           // 電子郵件 (必填，唯一)
  password: String,        // 密碼 (必填，最少6字元)
  name: String,            // 姓名 (必填，最多50字元)
  phone: String,           // 電話號碼
  avatar: String,         // 頭像URL
  role: String,           // 角色 (user/vip/admin)
  status: String,         // 狀態 (active/inactive/banned)
  permissions: [String],  // 權限列表
  profile: {             // 個人資料
    gender: String,       // 性別
    birthDate: Date,      // 生日
    address: {           // 地址
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    preferences: {        // 偏好設定
      language: String,
      currency: String,
      timezone: String,
      notifications: {   // 通知設定
        email: Boolean,
        sms: Boolean,
        push: Boolean
      }
    }
  },
  statistics: {          // 統計資料
    totalOrders: Number,
    totalSpent: Number,
    lastLogin: Date,
    loginCount: Number
  },
  verification: {        // 驗證資料
    emailVerified: Boolean,
    phoneVerified: Boolean,
    emailVerificationToken: String,
    phoneVerificationCode: String,
    verificationExpires: Date
  },
  security: {           // 安全資料
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: Boolean,
    twoFactorSecret: String
  }
}
```

## 🔐 認證與權限

### 簡化版本說明
目前實作的是簡化版本，方便開發測試：

1. **認證**: 任何請求都會通過認證檢查
2. **權限**: 所有權限檢查都會通過
3. **角色**: 角色驗證會直接通過

### 後續實作項目
標記為 `TODO` 的部分將在後續實作：
- [ ] 真實的 JWT Token 驗證
- [ ] 權限檢查邏輯
- [ ] 角色驗證機制
- [ ] 速率限制
- [ ] 安全強化

## 🧪 測試

### 執行測試
```bash
# 執行所有測試
npm test

# 監控模式
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

### API 測試範例
```bash
# 取得用戶列表
curl -X GET "http://localhost:3002/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer your-token"

# 建立新用戶
curl -X POST "http://localhost:3002/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "測試用戶",
    "phone": "0912345678",
    "role": "user"
  }'

# 取得用戶概覽統計
curl -X GET "http://localhost:3002/api/v1/users/overview" \
  -H "Authorization: Bearer your-token"
```

## 🐳 Docker 部署

### 建立映像檔
```bash
docker build -t user-service .
```

### 執行容器
```bash
docker run -d \
  --name user-service \
  -p 3002:3002 \
  -e MONGODB_URI=mongodb://admin:password123@host.docker.internal:27017/ecommerce?authSource=admin \
  user-service
```

### Docker Compose
```yaml
version: '3.8'
services:
  user-service:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin
    depends_on:
      - mongodb
```

## 📈 監控與日誌

### 健康檢查
- **端點**: `GET /health`
- **檢查項目**: MongoDB 連線狀態、服務運行時間
- **回應格式**: JSON

### 日誌格式
使用 Morgan 進行 HTTP 請求日誌記錄，格式為 `combined`。

### 監控指標
- API 響應時間
- 資料庫連線狀態
- 錯誤率統計
- 用戶操作統計

## 🔧 開發

### 開發模式
```bash
npm run dev
```

### 程式碼檢查
```bash
npm run lint
npm run lint:fix
```

### 環境變數
| 變數名稱 | 描述 | 預設值 |
|----------|------|--------|
| NODE_ENV | 環境模式 | development |
| PORT | 服務端口 | 3002 |
| MONGODB_URI | MongoDB 連線字串 | mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin |
| JWT_SECRET | JWT 密鑰 | your-super-secret-jwt-key-for-development |
| JWT_EXPIRES_IN | JWT 過期時間 | 24h |
| REDIS_URI | Redis 連線字串 | redis://localhost:6379 |

## 🤝 整合

### 與 Auth Service 整合
- 使用相同的 JWT 認證機制
- 共享用戶資料模型
- 統一的權限管理

### 與其他服務整合
- **Order Service**: 用戶訂單資料
- **Analytics Service**: 用戶行為分析
- **Dashboard Service**: 用戶統計資料

## 🚨 注意事項

### 安全考量
1. **密碼安全**: 使用 bcryptjs 進行密碼雜湊
2. **資料驗證**: 嚴格驗證輸入資料格式
3. **權限控制**: 實作細粒度權限檢查
4. **SQL 注入防護**: 使用 Mongoose 防止注入攻擊

### 效能優化
1. **索引設計**: 針對常用查詢建立索引
2. **分頁查詢**: 實作高效的分頁機制
3. **快取策略**: 可整合 Redis 進行快取
4. **資料庫連線池**: 優化 MongoDB 連線

## 📚 相關文檔

- [API 設計文檔](../../API_DESIGN.md)
- [資料庫設計文檔](../../DATABASE_DESIGN.md)
- [API 實作計劃](../../API_IMPLEMENTATION_PLAN.md)
- [開發進度文檔](../../DEVELOPMENT_PROGRESS.md)

## 🐛 問題回報

如果您發現任何問題或有改進建議，請：
1. 查看 [Issues](../../issues)
2. 建立新的 Issue
3. 提供詳細的問題描述和重現步驟

---

**版本**: v1.0.0  
**最後更新**: 2025-09-03  
**狀態**: 開發中
