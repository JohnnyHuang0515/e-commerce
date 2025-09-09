# Nginx + MVC 架構規劃文件

## 當前系統現狀

### 現有架構
- **前端**: React + Vite (端口 3000)
- **後端**: 5個合併服務
  - AUTH-SERVICE: 3001
  - PRODUCT-SERVICE: 3002
  - ORDER-SERVICE: 3003
  - AI-SERVICE: 3004
  - SYSTEM-SERVICE: 3005
- **資料庫**: PostgreSQL + MongoDB
- **問題**: 缺乏統一入口點，前端需要配置多個代理

## 目標架構

### Nginx + MVC 架構設計
```
[Browser] 
    ↓ HTTP Request
[Nginx:80/443] 
    ├── /static/ → 前端靜態檔案 (快取優化)
    ├── /api/v1/auth/* → AUTH-SERVICE:3001
    ├── /api/v1/products/* → PRODUCT-SERVICE:3002  
    ├── /api/v1/orders/* → ORDER-SERVICE:3003
    ├── /api/v1/ai/* → AI-SERVICE:3004
    └── /api/v1/system/* → SYSTEM-SERVICE:3005
```

## 實施計劃

### 階段 1: 基礎配置
1. **創建 Nginx 配置檔案**
   - 主配置: `nginx.conf`
   - 站點配置: `ecommerce.conf`
   - SSL 配置: `ssl.conf`

2. **更新前端配置**
   - 移除 Vite proxy 配置
   - 統一 API 基礎路徑
   - 更新服務配置

3. **統一 API 路徑規範**
   - 確保所有服務路徑一致
   - 標準化錯誤回應格式

### 階段 2: 性能優化
1. **靜態檔案快取**
   - JS/CSS 檔案長期快取
   - 圖片檔案快取策略
   - Gzip 壓縮

2. **API 優化**
   - 請求快取策略
   - 負載平衡準備
   - 健康檢查端點

### 階段 3: 安全與監控
1. **SSL/TLS 支援**
   - Let's Encrypt 證書
   - HTTP 重定向到 HTTPS
   - 安全標頭設定

2. **監控與日誌**
   - 存取日誌配置
   - 錯誤日誌監控
   - 性能指標收集

## 技術規格

### Nginx 配置要點
```nginx
# 主要功能
- 靜態檔案服務
- 反向代理
- 負載平衡
- SSL 終結點
- 快取管理
- 安全標頭

# 性能優化
- Gzip 壓縮
- 靜態檔案快取
- 連接池管理
- 緩衝區優化
```

### API 路徑映射
```
/api/v1/auth/*     → AUTH-SERVICE:3001
/api/v1/products/* → PRODUCT-SERVICE:3002
/api/v1/orders/*   → ORDER-SERVICE:3003
/api/v1/ai/*       → AI-SERVICE:3004
/api/v1/system/*   → SYSTEM-SERVICE:3005
```

### 前端配置變更
```typescript
// 移除 Vite proxy 配置
// 統一 API 基礎路徑
const API_BASE_URL = 'http://localhost/api/v1';
```

## 檔案結構

```
ecommerce-system/
├── nginx/
│   ├── nginx.conf
│   ├── ecommerce.conf
│   └── ssl.conf
├── frontend/
│   ├── vite.config.ts (更新)
│   └── src/services/api.ts (更新)
└── backend/
    └── services/merged-services/
        ├── auth-service/
        ├── product-service/
        ├── order-service/
        ├── ai-service/
        └── system-service/
```

## 部署流程

### 1. 開發環境
```bash
# 啟動所有服務
./start-all-services.sh

# 啟動 Nginx
sudo nginx -t
sudo nginx -s reload

# 測試前端
npm run dev
```

### 2. 生產環境
```bash
# 建構前端
npm run build

# 配置 Nginx
sudo cp nginx/ecommerce.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/ecommerce.conf /etc/nginx/sites-enabled/

# 重啟 Nginx
sudo systemctl restart nginx
```

## 測試計劃

### 功能測試
- [ ] 前端靜態檔案載入
- [ ] API 代理功能
- [ ] 認證流程
- [ ] 商品管理
- [ ] 訂單處理
- [ ] AI 功能
- [ ] 系統管理

### 性能測試
- [ ] 靜態檔案快取
- [ ] API 回應時間
- [ ] 並發處理能力
- [ ] 記憶體使用量

### 安全測試
- [ ] SSL 證書驗證
- [ ] 安全標頭檢查
- [ ] 跨域請求處理
- [ ] 認證授權機制

## 風險評估

### 低風險
- 前端配置更新
- API 路徑統一
- 靜態檔案快取

### 中風險
- Nginx 配置錯誤
- 服務間通訊問題
- 快取策略不當

### 高風險
- SSL 證書配置
- 生產環境部署
- 資料庫連線問題

## 回滾計劃

### 緊急回滾
1. 停止 Nginx
2. 恢復 Vite proxy 配置
3. 重啟前端服務
4. 驗證功能正常

### 逐步回滾
1. 移除 Nginx 配置
2. 恢復原始前端配置
3. 測試各服務功能
4. 重新部署

## 後續優化

### 短期 (1-2週)
- 完成基礎架構
- 性能優化
- 安全加固

### 中期 (1-2月)
- 監控系統整合
- 自動化部署
- 負載平衡

### 長期 (3-6月)
- 微服務治理
- 容器化部署
- CI/CD 整合

## 注意事項

1. **備份現有配置** - 在修改前備份所有配置檔案
2. **逐步測試** - 每個階段都要充分測試
3. **監控日誌** - 密切關注 Nginx 和服務日誌
4. **性能基準** - 記錄修改前後的性能指標
5. **文檔更新** - 及時更新相關文檔

---

**創建時間**: 2025-01-08
**版本**: v1.0
**狀態**: 規劃中
**負責人**: 開發團隊
