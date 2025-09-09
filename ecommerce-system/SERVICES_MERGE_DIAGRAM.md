# 🔄 服務合併架構圖

## 📊 當前狀態 vs 目標狀態

### 當前狀態 (16 個獨立服務)
```
services_backup/
├── ai-search-service      → 合併到 AI-SERVICE
├── analytics-service      → 合併到 AI-SERVICE  
├── auth-service          → 合併到 AUTH-SERVICE
├── dashboard-service      → 獨立為 DASHBOARD-SERVICE
├── inventory-service      → 合併到 PRODUCT-SERVICE
├── log-service           → 合併到 SYSTEM-SERVICE
├── logistics-service      → 合併到 ORDER-SERVICE
├── minio-service         → 合併到 PRODUCT-SERVICE
├── notification-service   → 合併到 SYSTEM-SERVICE
├── order-service         → 合併到 ORDER-SERVICE
├── payment-service       → 合併到 ORDER-SERVICE
├── permission-service    → 合併到 AUTH-SERVICE
├── product-service       → 合併到 PRODUCT-SERVICE
├── settings-service      → 合併到 SYSTEM-SERVICE
├── user-service          → 合併到 AUTH-SERVICE
└── utility-service       → 合併到 SYSTEM-SERVICE
```

### 目標狀態 (6 個合併服務)
```
merged-services/
├── AUTH-SERVICE (3001)     ← 認證 + 用戶 + 權限
├── PRODUCT-SERVICE (3002)  ← 商品 + 庫存 + 檔案
├── ORDER-SERVICE (3003)    ← 訂單 + 支付 + 物流
├── AI-SERVICE (3004)       ← AI + 搜尋 + 分析
├── SYSTEM-SERVICE (3005)   ← 系統 + 設定 + 日誌 + 通知 + 工具
└── DASHBOARD-SERVICE (3006) ← 儀表板
```

## 🎯 合併映射圖

### AUTH-SERVICE (Port 3001)
```
現有功能:
├── 認證授權

合併來源:
├── auth-service (增強認證功能)
├── user-service (用戶管理)
└── permission-service (權限管理)

最終功能:
├── 用戶認證 (登入/登出/註冊)
├── 用戶管理 (CRUD)
├── 角色管理
├── 權限管理
├── JWT Token 管理
└── 用戶統計分析
```

### PRODUCT-SERVICE (Port 3002)
```
現有功能:
├── 商品管理

合併來源:
├── product-service (增強商品功能)
├── inventory-service (庫存管理)
└── minio-service (檔案存儲)

最終功能:
├── 商品管理 (CRUD)
├── 分類管理
├── 庫存管理
├── 庫存調整
├── 檔案上傳/管理
└── 商品統計
```

### ORDER-SERVICE (Port 3003)
```
現有功能:
├── 訂單管理

合併來源:
├── order-service (增強訂單功能)
├── payment-service (支付管理)
└── logistics-service (物流管理)

最終功能:
├── 訂單管理 (CRUD)
├── 支付處理
├── 物流管理
├── 配送追蹤
├── 退款處理
└── 訂單統計
```

### AI-SERVICE (Port 3004)
```
現有功能:
├── AI 功能

合併來源:
├── ai-search-service (AI 搜尋)
└── analytics-service (數據分析)

最終功能:
├── AI 功能
├── 語義搜尋
├── 數據分析
├── 銷售分析
├── 用戶分析
├── 商品分析
├── 營收分析
└── 智能推薦
```

### SYSTEM-SERVICE (Port 3005)
```
現有功能:
├── 系統管理

合併來源:
├── settings-service (設定管理)
├── log-service (日誌管理)
├── notification-service (通知管理)
└── utility-service (工具功能)

最終功能:
├── 系統設定
├── 日誌管理
├── 通知管理
├── 工具功能
├── 備份還原
└── 系統監控
```

### DASHBOARD-SERVICE (Port 3006)
```
合併來源:
└── dashboard-service (儀表板)

最終功能:
├── 概覽統計
├── 即時數據
├── 分析圖表
├── 小工具管理
├── 報告生成
└── 數據可視化
```

## 🔄 合併流程圖

### 階段 1: 核心服務增強
```
1. AUTH-SERVICE 增強
   ├── 合併 user-service
   ├── 合併 permission-service
   └── 增強 auth-service

2. PRODUCT-SERVICE 增強
   ├── 合併 inventory-service
   ├── 合併 minio-service
   └── 增強 product-service

3. ORDER-SERVICE 增強
   ├── 合併 payment-service
   ├── 合併 logistics-service
   └── 增強 order-service
```

### 階段 2: 分析服務整合
```
4. AI-SERVICE 增強
   ├── 合併 ai-search-service
   └── 合併 analytics-service

5. DASHBOARD-SERVICE 創建
   └── 整合 dashboard-service
```

### 階段 3: 系統管理整合
```
6. SYSTEM-SERVICE 增強
   ├── 合併 settings-service
   ├── 合併 log-service
   ├── 合併 notification-service
   └── 合併 utility-service
```

## 📊 服務依賴關係圖

```
DASHBOARD-SERVICE (3006)
    ├── 依賴 AUTH-SERVICE (用戶認證)
    ├── 依賴 PRODUCT-SERVICE (商品數據)
    ├── 依賴 ORDER-SERVICE (訂單數據)
    ├── 依賴 AI-SERVICE (分析數據)
    └── 依賴 SYSTEM-SERVICE (系統數據)

AI-SERVICE (3004)
    ├── 依賴 AUTH-SERVICE (用戶認證)
    ├── 依賴 PRODUCT-SERVICE (商品數據)
    └── 依賴 ORDER-SERVICE (訂單數據)

ORDER-SERVICE (3003)
    ├── 依賴 AUTH-SERVICE (用戶認證)
    └── 依賴 PRODUCT-SERVICE (商品數據)

PRODUCT-SERVICE (3002)
    └── 依賴 AUTH-SERVICE (用戶認證)

AUTH-SERVICE (3001)
    └── 獨立服務 (基礎認證)

SYSTEM-SERVICE (3005)
    ├── 依賴 AUTH-SERVICE (用戶認證)
    └── 獨立服務 (系統管理)
```

## 🎯 實施優先級

### 高優先級 (立即實施)
1. **AUTH-SERVICE 增強** - 基礎認證服務
2. **PRODUCT-SERVICE 增強** - 核心商品服務
3. **ORDER-SERVICE 增強** - 核心訂單服務

### 中優先級 (第二階段)
4. **AI-SERVICE 增強** - 分析功能
5. **DASHBOARD-SERVICE 創建** - 儀表板功能

### 低優先級 (第三階段)
6. **SYSTEM-SERVICE 增強** - 系統管理功能

---

*架構設計時間: 2025-09-09 15:45*
