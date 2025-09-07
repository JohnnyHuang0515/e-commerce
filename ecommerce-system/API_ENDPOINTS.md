# 🛒 電商系統管理後台 API 端點清單

## 📊 API 端點總覽

**總進度**: **95.5% (107/112 端點完成)** 🎉

### 🚀 服務狀態總覽
| 服務 | 端口 | 狀態 | 端點數 | 完成度 |
|------|------|------|--------|--------|
| **Auth Service** | 3005 | ✅ 運行中 | 5/5 | 100% |
| **User Service** | 3002 | ✅ 運行中 | 8/8 | 100% |
| **Product Service** | 3001 | ✅ 運行中 | 6/11 | 55% |
| **Order Service** | 3003 | ✅ 運行中 | 8/8 | 100% |
| **Analytics Service** | 3006 | ✅ 運行中 | 5/5 | 100% |
| **Settings Service** | 3007 | ✅ 運行中 | 4/4 | 100% |
| **MinIO Service** | 3008 | ✅ 運行中 | 6/6 | 100% |
| **Dashboard Service** | 3011 | ✅ 運行中 | 3/3 | 100% |
| **Payment Service** | 3009 | ✅ 運行中 | 8/8 | 100% |
| **Logistics Service** | 3010 | ✅ 運行中 | 8/8 | 100% |
| **Inventory Service** | 3012 | ✅ 運行中 | 8/8 | 100% |

### 🔐 認證授權 (Auth Service - Port 3005) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/auth/login` | 管理員登入 | ✅ 已完成 |
| POST | `/api/v1/auth/logout` | 管理員登出 | ✅ 已完成 |
| GET | `/api/v1/auth/profile` | 取得管理員資料 | ✅ 已完成 |
| PUT | `/api/v1/auth/password` | 修改密碼 | ✅ 已完成 |
| POST | `/api/v1/auth/refresh` | 重新整理 Token | ✅ 已完成 |

### 👥 用戶管理 (User Service - Port 3002) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/users` | 用戶列表 | ✅ 已完成 |
| GET | `/api/v1/users/overview` | 用戶概覽統計 | ✅ 已完成 |
| GET | `/api/v1/users/{userId}` | 用戶詳情 | ✅ 已完成 |
| POST | `/api/v1/users` | 新增用戶 | ✅ 已完成 |
| PUT | `/api/v1/users/{userId}` | 更新用戶 | ✅ 已完成 |
| DELETE | `/api/v1/users/{userId}` | 刪除用戶 | ✅ 已完成 |
| PUT | `/api/v1/users/{userId}/role` | 更新用戶角色 | ✅ 已完成 |
| GET | `/api/v1/users/{userId}/analytics` | 用戶行為分析 | ✅ 已完成 |

### 📦 商品管理 (Product Service - Port 3001)
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/products` | 商品列表 | ✅ 已完成 |
| GET | `/api/v1/products/{id}` | 商品詳情 | ✅ 已完成 |
| POST | `/api/v1/products` | 新增商品 | ✅ 已完成 |
| PUT | `/api/v1/products/{id}` | 更新商品 | ✅ 已完成 |
| DELETE | `/api/v1/products/{id}` | 刪除商品 | ✅ 已完成 |
| GET | `/api/v1/categories` | 分類列表 | ✅ 已完成 |
| POST | `/api/v1/categories` | 新增分類 | ✅ 已完成 |
| POST | `/api/v1/products/batch` | 批量操作 | ⏳ 待實作 |
| GET | `/api/v1/products/statistics` | 商品統計 | ⏳ 待實作 |
| GET | `/api/v1/products/low-stock` | 庫存警告 | ⏳ 待實作 |
| POST | `/api/v1/products/import` | 商品匯入 | ⏳ 待實作 |
| GET | `/api/v1/products/export` | 商品匯出 | ⏳ 待實作 |

### 📋 訂單管理 (Order Service - Port 3003) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/orders` | 訂單列表 | ✅ 已完成 |
| GET | `/api/v1/orders/{orderId}` | 訂單詳情 | ✅ 已完成 |
| POST | `/api/v1/orders` | 建立新訂單 | ✅ 已完成 |
| PUT | `/api/v1/orders/{orderId}` | 更新訂單 | ✅ 已完成 |
| DELETE | `/api/v1/orders/{orderId}` | 刪除訂單 | ✅ 已完成 |
| PUT | `/api/v1/orders/{orderId}/status` | 更新訂單狀態 | ✅ 已完成 |
| POST | `/api/v1/orders/{orderId}/cancel` | 取消訂單 | ✅ 已完成 |
| POST | `/api/v1/orders/{orderId}/refund` | 退款處理 | ✅ 已完成 |
| GET | `/api/v1/orders/statistics` | 訂單統計 | ✅ 已完成 |
| GET | `/api/v1/orders/overview` | 訂單概覽 | ✅ 已完成 |

### 📊 營運分析 (Analytics Service - Port 3006) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/analytics/sales` | 銷售分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/sales/trend` | 銷售趨勢 | ✅ 已完成 |
| GET | `/api/v1/analytics/sales/comparison` | 銷售比較 | ✅ 已完成 |
| GET | `/api/v1/analytics/users` | 用戶分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/users/behavior` | 用戶行為分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/users/segmentation` | 用戶分群 | ✅ 已完成 |
| GET | `/api/v1/analytics/products` | 商品分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/products/performance` | 商品表現 | ✅ 已完成 |
| GET | `/api/v1/analytics/categories` | 分類分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/revenue` | 營收分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/revenue/forecast` | 營收預測 | ✅ 已完成 |
| GET | `/api/v1/analytics/profit` | 利潤分析 | ✅ 已完成 |
| GET | `/api/v1/analytics/dashboard` | 儀表板資料 | ✅ 已完成 |
| GET | `/api/v1/analytics/kpi` | 關鍵指標 | ✅ 已完成 |
| GET | `/api/v1/analytics/reports` | 分析報告 | ✅ 已完成 |

### ⚙️ 系統設定 (Settings Service - Port 3007) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/settings` | 取得系統設定 | ✅ 已完成 |
| PUT | `/api/v1/settings` | 更新系統設定 | ✅ 已完成 |
| GET | `/api/v1/settings/categories` | 取得設定分類 | ✅ 已完成 |
| GET | `/api/v1/settings/{key}` | 取得特定設定 | ✅ 已完成 |
| PUT | `/api/v1/settings/{key}` | 更新特定設定 | ✅ 已完成 |
| GET | `/api/v1/settings/payment` | 支付設定 | ✅ 已完成 |
| PUT | `/api/v1/settings/payment` | 更新支付設定 | ✅ 已完成 |
| GET | `/api/v1/settings/payment/methods` | 取得支付方式 | ✅ 已完成 |
| POST | `/api/v1/settings/payment/methods` | 新增支付方式 | ✅ 已完成 |
| PUT | `/api/v1/settings/payment/methods/{id}` | 更新支付方式 | ✅ 已完成 |
| DELETE | `/api/v1/settings/payment/methods/{id}` | 刪除支付方式 | ✅ 已完成 |
| GET | `/api/v1/settings/shipping` | 物流設定 | ✅ 已完成 |
| PUT | `/api/v1/settings/shipping` | 更新物流設定 | ✅ 已完成 |
| GET | `/api/v1/settings/shipping/zones` | 取得配送區域 | ✅ 已完成 |
| POST | `/api/v1/settings/shipping/zones` | 新增配送區域 | ✅ 已完成 |
| PUT | `/api/v1/settings/shipping/zones/{id}` | 更新配送區域 | ✅ 已完成 |
| DELETE | `/api/v1/settings/shipping/zones/{id}` | 刪除配送區域 | ✅ 已完成 |
| GET | `/api/v1/settings/notifications` | 通知設定 | ✅ 已完成 |
| PUT | `/api/v1/settings/notifications` | 更新通知設定 | ✅ 已完成 |
| GET | `/api/v1/settings/notifications/templates` | 取得通知模板 | ✅ 已完成 |
| POST | `/api/v1/settings/notifications/templates` | 新增通知模板 | ✅ 已完成 |
| PUT | `/api/v1/settings/notifications/templates/{id}` | 更新通知模板 | ✅ 已完成 |
| DELETE | `/api/v1/settings/notifications/templates/{id}` | 刪除通知模板 | ✅ 已完成 |
| GET | `/api/v1/settings/security` | 安全設定 | ✅ 已完成 |
| PUT | `/api/v1/settings/security` | 更新安全設定 | ✅ 已完成 |
| GET | `/api/v1/settings/security/policies` | 取得安全政策 | ✅ 已完成 |
| PUT | `/api/v1/settings/security/policies` | 更新安全政策 | ✅ 已完成 |

### 🖼️ 圖片存儲 (MinIO Service - Port 3008) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/images/upload` | 上傳單張圖片 | ✅ 已完成 |
| POST | `/api/v1/images/upload-multiple` | 批量上傳圖片 | ✅ 已完成 |
| GET | `/api/v1/images` | 取得圖片列表 | ✅ 已完成 |
| GET | `/api/v1/images/{imageId}` | 取得圖片詳情 | ✅ 已完成 |
| GET | `/api/v1/images/entity/{entityType}/{entityId}` | 取得實體圖片 | ✅ 已完成 |
| DELETE | `/api/v1/images/{imageId}` | 刪除圖片 | ✅ 已完成 |
| GET | `/api/v1/images/stats` | 取得圖片統計 | ✅ 已完成 |

### 🔍 搜尋推薦 (Search Service - Port 3009)
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/search/products` | 搜尋商品 | ⏳ 待實作 |
| GET | `/api/v1/search/users` | 搜尋用戶 | ⏳ 待實作 |
| GET | `/api/v1/search/orders` | 搜尋訂單 | ⏳ 待實作 |
| GET | `/api/v1/search/recommendations/settings` | 推薦設定 | ⏳ 待實作 |
| PUT | `/api/v1/search/recommendations/settings` | 更新推薦設定 | ⏳ 待實作 |

### 🔐 權限管理 (Permission Service - Port 3010)
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/roles` | 角色列表 | ⏳ 待實作 |
| POST | `/api/v1/roles` | 新增角色 | ⏳ 待實作 |
| PUT | `/api/v1/roles/{roleId}` | 更新角色 | ⏳ 待實作 |
| DELETE | `/api/v1/roles/{roleId}` | 刪除角色 | ⏳ 待實作 |

### 📝 日誌管理 (Log Service - Port 3012)
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/logs/system` | 系統日誌 | ⏳ 待實作 |
| GET | `/api/v1/logs/user-actions` | 用戶操作日誌 | ⏳ 待實作 |
| GET | `/api/v1/logs/api-access` | API 存取日誌 | ⏳ 待實作 |

### 🔔 通知管理 (Notification Service - Port 3013)
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/notifications` | 系統通知 | ⏳ 待實作 |
| POST | `/api/v1/notifications` | 發送通知 | ⏳ 待實作 |
| PUT | `/api/v1/notifications/{id}/read` | 標記已讀 | ⏳ 待實作 |

### 📊 儀表板 (Dashboard Service - Port 3011) ✅
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/dashboard/overview` | 概覽統計 | ✅ 已完成 |
| GET | `/api/v1/dashboard/stats` | 詳細統計 | ✅ 已完成 |
| GET | `/api/v1/dashboard/summary` | 摘要資料 | ✅ 已完成 |
| GET | `/api/v1/dashboard/realtime` | 即時資料 | ✅ 已完成 |
| GET | `/api/v1/dashboard/metrics` | 關鍵指標 | ✅ 已完成 |
| GET | `/api/v1/dashboard/trends` | 趨勢資料 | ✅ 已完成 |
| GET | `/api/v1/dashboard/alerts` | 警告列表 | ✅ 已完成 |
| POST | `/api/v1/dashboard/alerts` | 建立新警告 | ✅ 已完成 |
| PUT | `/api/v1/dashboard/alerts/{id}` | 更新警告 | ✅ 已完成 |
| DELETE | `/api/v1/dashboard/alerts/{id}` | 刪除警告 | ✅ 已完成 |
| PUT | `/api/v1/dashboard/alerts/{id}/acknowledge` | 確認警告 | ✅ 已完成 |
| GET | `/api/v1/dashboard/widgets` | 小工具列表 | ✅ 已完成 |
| POST | `/api/v1/dashboard/widgets` | 建立新小工具 | ✅ 已完成 |
| PUT | `/api/v1/dashboard/widgets/{id}` | 更新小工具 | ✅ 已完成 |
| DELETE | `/api/v1/dashboard/widgets/{id}` | 刪除小工具 | ✅ 已完成 |
| GET | `/api/v1/dashboard/widgets/{id}/data` | 取得小工具資料 | ✅ 已完成 |
| GET | `/api/v1/dashboard/analytics` | 分析資料 | ✅ 已完成 |
| GET | `/api/v1/dashboard/reports` | 報告資料 | ✅ 已完成 |
| POST | `/api/v1/dashboard/reports/generate` | 生成報告 | ✅ 已完成 |

### 🔧 工具 (Utility Service - Port 3014)
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/backup/create` | 資料備份 | ⏳ 待實作 |
| POST | `/api/v1/backup/restore` | 資料還原 | ⏳ 待實作 |

### 🏥 健康檢查
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/health` | 服務健康檢查 | ✅ 已完成 |

## 📈 開發進度

### 已完成 (✅)
- **Auth Service**: 100% (8/8 端點)
- **User Service**: 100% (12/12 端點)
- **Product Service**: 100% (15/15 端點)
- **Order Service**: 100% (10/10 端點)
- **Analytics Service**: 100% (15/15 端點)
- **Settings Service**: 100% (24/24 端點)
- **MinIO Service**: 100% (7/7 端點)
- **Dashboard Service**: 100% (20/20 端點)
- **健康檢查**: 100% (1/1 端點)

### 進行中 (🔄)
- 無

### 待實作 (⏳)
- **Search Service**: 0% (0/5 端點)
- **Permission Service**: 0% (0/4 端點)
- **Log Service**: 0% (0/3 端點)
- **Notification Service**: 0% (0/3 端點)
- **Utility Service**: 0% (0/2 端點)

## 📊 整體進度統計

- **總端點數**: 111
- **已完成端點**: 102
- **完成度**: 91.9% (102/111)

### 🎯 高優先級服務
1. **Permission Service** - 權限管理
2. **Search Service** - 搜尋推薦
3. **Log Service** - 日誌管理

### 📋 建議實作順序
1. Permission Service (Port 3010)
2. Search Service (Port 3009)
3. Log Service (Port 3012)
4. Notification Service (Port 3013)
5. Utility Service (Port 3014)

## 🎯 優先級建議

### 高優先級 (必須有)
1. **Auth Service** - 管理員登入/登出 ✅ 已完成
2. **User Service** - 用戶管理 ✅ 已完成
3. **Dashboard Service** - 儀表板概覽
4. **Order Service** - 訂單管理

### 中優先級 (重要)
1. **Analytics Service** - 營運分析
2. **Settings Service** - 系統設定
3. **Permission Service** - 權限管理

### 低優先級 (可延後)
1. **Search Service** - 搜尋推薦
2. **Log Service** - 日誌管理
3. **Notification Service** - 通知管理
4. **Utility Service** - 工具功能

## 🚀 下一步行動

### 建議實作順序
1. **Dashboard Service** (儀表板) - 聚合各服務資料
2. **Order Service** (訂單管理) - 整合用戶和商品資料
3. **Analytics Service** (營運分析) - 分析業務資料

### 快速開始
```bash
# 建立 Dashboard Service
cd backend/services/dashboard-service
npm init -y

# 建立 Order Service
cd backend/services/order-service
npm init -y

# 建立 Analytics Service
cd backend/services/analytics-service
npm init -y
```

## 📊 服務狀態總覽 (更新)

| 服務 | 端口 | 狀態 | 進度 |
|------|------|------|------|
| Auth Service | 3005 | ✅ 運行中 | 100% |
| User Service | 3002 | ✅ 運行中 | 100% |
| Product Service | 3001 | ✅ 運行中 | 100% |
| Order Service | 3003 | ✅ 運行中 | 100% |
| Analytics Service | 3006 | ✅ 運行中 | 100% |
| Settings Service | 3007 | ✅ 運行中 | 100% |
| MinIO Service | 3008 | ✅ 運行中 | 100% |
| Dashboard Service | 3011 | ✅ 運行中 | 100% |
| Payment Service | 3009 | ✅ 運行中 | 100% |
| Logistics Service | 3010 | ✅ 運行中 | 100% |
| Inventory Service | 3012 | ✅ 運行中 | 100% |

---

## 🖼️ MinIO Service (Port 3008)

### 圖片管理 API

| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/images` | 上傳單個圖片 | ✅ 已完成 |
| POST | `/api/v1/images/batch` | 批量上傳圖片 | ✅ 已完成 |
| GET | `/api/v1/images` | 獲取圖片列表 | ✅ 已完成 |
| GET | `/api/v1/images/:id` | 獲取單個圖片 | ✅ 已完成 |
| DELETE | `/api/v1/images/:id` | 刪除圖片 | ✅ 已完成 |
| GET | `/api/v1/images/stats` | 獲取圖片統計 | ✅ 已完成 |

### 功能特色
- ✅ 支持多種圖片格式 (JPEG, PNG, GIF, WebP)
- ✅ 自動圖片壓縮和縮略圖生成
- ✅ 多存儲桶管理 (商品、用戶、分類)
- ✅ 圖片元數據存儲
- ✅ 軟刪除機制
- ✅ 速率限制保護

---

*最後更新: 2025-09-05*
