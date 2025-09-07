# 🚨 數據庫架構問題記錄

## 📅 發現日期
2025-09-06

## ❌ 當前問題

### 現狀
- **所有服務** 都使用 MongoDB
- **只有一個數據庫**：`ecommerce` (MongoDB)
- **架構不合理**：關係型數據也存儲在文檔數據庫中

### 問題分析
1. **性能問題**：關係型查詢在 MongoDB 中效率低
2. **數據一致性**：缺乏 ACID 事務支持
3. **擴展性問題**：無法充分利用不同數據庫的優勢
4. **維護困難**：所有數據混在一個數據庫中

## ✅ 正確的架構設計

### MongoDB (文檔數據庫) - 適合非結構化數據
```
📦 Product Service (商品管理)
├── products (商品信息)
├── categories (商品分類)
├── inventory (庫存信息)
└── product_reviews (商品評價)

📊 Analytics Service (分析服務)
├── analytics_data (分析數據)
├── user_behavior (用戶行為)
├── sales_reports (銷售報告)
└── performance_metrics (性能指標)

🖼️ MinIO Service (文件存儲)
├── file_metadata (文件元數據)
├── upload_logs (上傳日誌)
└── storage_stats (存儲統計)
```

### PostgreSQL (關係型數據庫) - 適合結構化數據
```
👥 User Service (用戶管理)
├── users (用戶表)
├── user_profiles (用戶資料)
├── user_preferences (用戶偏好)
└── user_sessions (用戶會話)

🔐 Auth Service (認證服務)
├── auth_tokens (認證令牌)
├── login_attempts (登入嘗試)
├── password_resets (密碼重置)
└── security_logs (安全日誌)

📋 Order Service (訂單管理)
├── orders (訂單表)
├── order_items (訂單項目)
├── order_status_history (訂單狀態歷史)
└── order_payments (訂單支付)

🔐 Permission Service (權限管理)
├── roles (角色表)
├── permissions (權限表)
├── user_roles (用戶角色關聯)
└── role_permissions (角色權限關聯)

⚙️ Settings Service (系統設定)
├── system_settings (系統設定)
├── feature_flags (功能開關)
├── configuration (配置項)
└── audit_logs (審計日誌)

💳 Payment Service (支付服務)
├── payment_methods (支付方式)
├── payment_transactions (支付交易)
├── refunds (退款記錄)
└── payment_gateways (支付網關)

🚚 Logistics Service (物流服務)
├── shipping_methods (配送方式)
├── delivery_addresses (配送地址)
├── tracking_info (物流追蹤)
└── shipping_costs (配送費用)
```

## 🔧 需要修正的服務

### 當前使用 MongoDB 但應該使用 PostgreSQL 的服務：
- [ ] **User Service** (3002) - 用戶管理
- [ ] **Auth Service** (3005) - 認證授權
- [ ] **Order Service** (3003) - 訂單管理
- [ ] **Permission Service** (3013) - 權限管理
- [ ] **Settings Service** (3007) - 系統設定
- [ ] **Payment Service** (3009) - 支付服務
- [ ] **Logistics Service** (3010) - 物流服務

### 保持使用 MongoDB 的服務：
- [x] **Product Service** (3001) - 商品管理
- [x] **Analytics Service** (3006) - 分析服務
- [x] **MinIO Service** (3008) - 文件存儲

## 📋 修正計劃

### 階段 1: 基礎設施
1. **添加 PostgreSQL 服務** 到 docker-compose.yml
2. **配置數據庫連接** 和環境變數
3. **創建數據庫初始化腳本**

### 階段 2: 數據模型遷移
1. **設計 PostgreSQL 表結構**
2. **創建 Sequelize/TypeORM 模型**
3. **編寫數據遷移腳本**

### 階段 3: 服務重構
1. **重構 User Service** (優先級：高)
2. **重構 Auth Service** (優先級：高)
3. **重構 Permission Service** (優先級：高)
4. **重構 Order Service** (優先級：中)
5. **重構其他服務** (優先級：低)

### 階段 4: 測試與驗證
1. **數據一致性測試**
2. **性能對比測試**
3. **API 兼容性測試**

## 🎯 預期收益

### 性能提升
- **查詢速度**：關係型查詢提升 3-5 倍
- **事務支持**：ACID 事務保證數據一致性
- **索引優化**：更好的索引策略

### 維護性提升
- **數據分離**：不同類型數據使用合適的數據庫
- **擴展性**：可以獨立擴展不同數據庫
- **備份策略**：可以針對不同數據庫制定不同備份策略

## 📝 注意事項

1. **數據遷移**：需要制定詳細的數據遷移計劃
2. **API 兼容性**：確保前端 API 調用不受影響
3. **測試覆蓋**：每個服務重構後都要進行完整測試
4. **回滾計劃**：準備回滾方案以防出現問題

## 🔗 相關文件

- `docker-compose.yml` - 需要添加 PostgreSQL 服務
- `DATABASE_DESIGN.md` - 需要重新設計數據庫架構
- 各服務的 `src/app.js` - 需要修改數據庫連接配置
- 各服務的 `package.json` - 需要添加 PostgreSQL 驅動

---

**狀態**: 🚨 待修正  
**優先級**: 🔴 高  
**影響範圍**: 全系統  
**預計工作量**: 2-3 週
