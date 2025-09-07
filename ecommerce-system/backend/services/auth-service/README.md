# 🔐 電商系統 Auth Service

## 📋 概述

電商系統認證服務，提供管理員登入、登出、權限管理等功能。

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 環境設定
```bash
# 複製環境變數範例
cp env.example .env

# 編輯環境變數
nano .env
```

### 啟動服務
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

## 📚 API 文檔

- **互動式文檔**: http://localhost:3001/api-docs
- **健康檢查**: http://localhost:3001/health

## 🔧 API 端點

### 認證相關
- `POST /api/v1/auth/login` - 管理員登入
- `POST /api/v1/auth/logout` - 管理員登出
- `GET /api/v1/auth/profile` - 取得管理員資料
- `PUT /api/v1/auth/password` - 修改密碼
- `POST /api/v1/auth/refresh` - 重新整理 Token

## 🧪 測試

```bash
# 執行測試
npm test

# 監看模式
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

## 🐳 Docker

```bash
# 建立映像
docker build -t auth-service .

# 執行容器
docker run -p 3001:3001 auth-service
```

## 📝 開發注意事項

### 🔐 認證簡化版本

目前實作的是簡化版本，**不做實際的認證驗證**，方便開發測試：

1. **登入**: 任何 email/password 都會成功
2. **Token 驗證**: 直接通過，不檢查 JWT
3. **權限檢查**: 直接通過，不檢查權限

### 🔄 後續實作項目

標記為 `TODO` 的部分將在後續實作：

- [ ] 真實的密碼驗證
- [ ] JWT Token 驗證
- [ ] 權限檢查
- [ ] 角色驗證
- [ ] Token 黑名單
- [ ] 速率限制

## 🏗️ 專案結構

```
auth-service/
├── src/
│   ├── app.js              # 主應用程式
│   ├── models/
│   │   └── User.js         # 用戶模型
│   ├── routes/
│   │   └── auth.js         # 認證路由
│   ├── middleware/
│   │   └── auth.js         # 認證中間件
│   ├── controllers/
│   │   └── authController.js # 認證控制器
│   └── swagger.js          # Swagger 設定
├── tests/                  # 測試檔案
├── package.json
├── Dockerfile
├── env.example
└── README.md
```

## 🔧 環境變數

| 變數 | 描述 | 預設值 |
|------|------|--------|
| `NODE_ENV` | 環境模式 | `development` |
| `PORT` | 服務端口 | `3001` |
| `MONGODB_URI` | MongoDB 連線字串 | `mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin` |
| `JWT_SECRET` | JWT 密鑰 | `your-super-secret-jwt-key-for-development` |
| `JWT_EXPIRES_IN` | JWT 過期時間 | `24h` |
| `REDIS_URI` | Redis 連線字串 | `redis://localhost:6379` |

## 📊 監控

### 健康檢查
```bash
curl http://localhost:3001/health
```

### 日誌
```bash
# 查看應用程式日誌
docker logs auth-service

# 查看錯誤日誌
tail -f error.log
```

## 🤝 貢獻

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案
