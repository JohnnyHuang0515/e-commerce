# 🔔 Notification Service

電商系統通知管理服務，提供多種通知方式的統一管理平台。

## 🚀 功能特色

- **多種通知類型**: 支援郵件、簡訊、推播、應用內通知、系統通知
- **模板管理**: 可重用的通知模板，支援變數替換
- **排程發送**: 支援定時發送通知
- **狀態追蹤**: 完整的通知發送狀態追蹤
- **統計分析**: 通知發送統計和分析
- **重試機制**: 自動重試失敗的通知
- **實時通訊**: Socket.IO 支援實時通知推送

## 📋 技術棧

- **Node.js** - 運行環境
- **Express.js** - Web 框架
- **MongoDB** - 資料庫
- **Socket.IO** - 實時通訊
- **Nodemailer** - 郵件發送
- **Winston** - 日誌管理
- **Moment.js** - 時間處理

## 🛠️ 安裝與運行

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境變數
```bash
cp env.example .env
# 編輯 .env 文件配置您的環境變數
```

### 3. 啟動服務
```bash
# 開發模式
npm run dev

# 生產模式
npm start

# 或使用啟動腳本
./start.sh
```

## 📡 API 端點

### 健康檢查
- `GET /api/v1/health` - 服務健康狀態

### 通知模板
- `POST /api/v1/notifications/templates` - 創建通知模板
- `GET /api/v1/notifications/templates` - 獲取模板列表
- `GET /api/v1/notifications/templates/:id` - 獲取單個模板
- `PUT /api/v1/notifications/templates/:id` - 更新模板
- `DELETE /api/v1/notifications/templates/:id` - 刪除模板

### 通知管理
- `POST /api/v1/notifications/send` - 發送通知
- `GET /api/v1/notifications/notifications` - 獲取通知列表
- `GET /api/v1/notifications/notifications/:id` - 獲取單個通知
- `PUT /api/v1/notifications/notifications/:id/read` - 標記為已讀
- `DELETE /api/v1/notifications/notifications/:id` - 刪除通知

### 統計與處理
- `GET /api/v1/notifications/stats` - 獲取通知統計
- `POST /api/v1/notifications/process-pending` - 處理待發送通知
- `POST /api/v1/notifications/retry-failed` - 重試失敗通知

## 📊 數據模型

### NotificationTemplate (通知模板)
```javascript
{
  name: String,           // 模板名稱
  title: String,          // 通知標題
  content: String,        // 通知內容
  type: String,           // 通知類型 (email, sms, push, in_app, system)
  category: String,       // 通知類別 (order, payment, user, system, promotion, security)
  variables: Array,       // 變數定義
  isActive: Boolean       // 是否啟用
}
```

### Notification (通知記錄)
```javascript
{
  templateId: ObjectId,   // 模板ID
  recipientId: ObjectId,  // 接收者ID
  recipientType: String,  // 接收者類型 (user, admin, system)
  title: String,         // 通知標題
  content: String,       // 通知內容
  type: String,          // 通知類型
  category: String,      // 通知類別
  status: String,        // 狀態 (pending, sent, delivered, failed, read, unread)
  priority: String,      // 優先級 (low, normal, high, urgent)
  scheduledAt: Date,     // 排程時間
  sentAt: Date,          // 發送時間
  deliveredAt: Date,     // 送達時間
  readAt: Date,          // 讀取時間
  metadata: Object,      // 元數據
  variables: Object,     // 變數值
  retryCount: Number,    // 重試次數
  maxRetries: Number,    // 最大重試次數
  errorMessage: String   // 錯誤訊息
}
```

## 🔧 配置說明

### 環境變數
- `PORT` - 服務端口 (預設: 3017)
- `SOCKET_PORT` - Socket.IO 端口 (預設: 3016)
- `MONGODB_URI` - MongoDB 連接字串
- `SMTP_HOST` - SMTP 服務器主機
- `SMTP_PORT` - SMTP 服務器端口
- `SMTP_USER` - SMTP 用戶名
- `SMTP_PASS` - SMTP 密碼
- `SMTP_FROM` - 發件人郵箱

### 通知類型
- **email** - 郵件通知
- **sms** - 簡訊通知
- **push** - 推播通知
- **in_app** - 應用內通知
- **system** - 系統通知

### 通知類別
- **order** - 訂單相關
- **payment** - 支付相關
- **user** - 用戶相關
- **system** - 系統相關
- **promotion** - 促銷相關
- **security** - 安全相關

## 🧪 測試

```bash
# 運行測試
npm test

# 監聽模式測試
npm run test:watch
```

## 📝 日誌

日誌文件位於 `logs/` 目錄，支援按日期輪轉。

## 🔒 安全

- 使用 Helmet.js 提供安全標頭
- 速率限制防止濫用
- 輸入驗證和清理
- 錯誤處理不洩露敏感信息

## 📈 監控

- 健康檢查端點
- 詳細的日誌記錄
- 性能指標監控
- 錯誤追蹤和報告

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License
