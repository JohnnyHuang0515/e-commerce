# 📊 電商系統 Analytics Service API 文檔

## 📋 概述

這是電商系統分析服務的 API 文檔，提供完整的營運分析功能，包括銷售分析、用戶分析、商品分析、營收分析等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3006/api-docs/
- **健康檢查**: http://localhost:3006/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 📈 銷售分析
- `GET /api/v1/analytics/sales` - 取得銷售分析
- `GET /api/v1/analytics/sales/trend` - 取得銷售趨勢
- `GET /api/v1/analytics/sales/comparison` - 取得銷售比較

### 👥 用戶分析
- `GET /api/v1/analytics/users` - 取得用戶分析
- `GET /api/v1/analytics/users/behavior` - 取得用戶行為分析
- `GET /api/v1/analytics/users/segmentation` - 取得用戶分群

### 🛒 商品分析
- `GET /api/v1/analytics/products` - 取得商品分析
- `GET /api/v1/analytics/products/performance` - 取得商品表現
- `GET /api/v1/analytics/categories` - 取得分類分析

### 💰 營收分析
- `GET /api/v1/analytics/revenue` - 取得營收分析
- `GET /api/v1/analytics/revenue/forecast` - 取得營收預測
- `GET /api/v1/analytics/profit` - 取得利潤分析

### 📊 綜合分析
- `GET /api/v1/analytics/dashboard` - 取得儀表板資料
- `GET /api/v1/analytics/kpi` - 取得關鍵指標
- `GET /api/v1/analytics/reports` - 取得分析報告

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3006/health
```

### 2. 取得銷售分析
```bash
curl "http://localhost:3006/api/v1/analytics/sales?period=month&startDate=2025-09-01&endDate=2025-09-30"
```

### 3. 取得用戶分析
```bash
curl "http://localhost:3006/api/v1/analytics/users?period=week&groupBy=role"
```

### 4. 取得商品分析
```bash
curl "http://localhost:3006/api/v1/analytics/products?period=month&sortBy=revenue&limit=10"
```

### 5. 取得營收分析
```bash
curl "http://localhost:3006/api/v1/analytics/revenue?period=quarter&compareWith=previous"
```

### 6. 取得儀表板資料
```bash
curl "http://localhost:3006/api/v1/analytics/dashboard"
```

## 📋 資料模型

### Sales Analytics (銷售分析)
```json
{
  "period": "string (day, week, month, quarter, year)",
  "startDate": "date",
  "endDate": "date",
  "metrics": {
    "totalSales": "number",
    "totalOrders": "number",
    "averageOrderValue": "number",
    "salesGrowth": "number (百分比)",
    "orderGrowth": "number (百分比)"
  },
  "trends": [
    {
      "date": "date",
      "sales": "number",
      "orders": "number",
      "customers": "number"
    }
  ],
  "topProducts": [
    {
      "productId": "string",
      "productName": "string",
      "sales": "number",
      "quantity": "number"
    }
  ],
  "topCategories": [
    {
      "categoryId": "string",
      "categoryName": "string",
      "sales": "number",
      "percentage": "number"
    }
  ]
}
```

### User Analytics (用戶分析)
```json
{
  "period": "string",
  "startDate": "date",
  "endDate": "date",
  "metrics": {
    "totalUsers": "number",
    "newUsers": "number",
    "activeUsers": "number",
    "retentionRate": "number (百分比)",
    "churnRate": "number (百分比)"
  },
  "segments": [
    {
      "segment": "string (new, active, churned, vip)",
      "count": "number",
      "percentage": "number"
    }
  ],
  "behavior": {
    "averageSessionDuration": "number (分鐘)",
    "averagePagesPerSession": "number",
    "bounceRate": "number (百分比)",
    "conversionRate": "number (百分比)"
  },
  "demographics": {
    "ageGroups": [
      {
        "ageGroup": "string",
        "count": "number",
        "percentage": "number"
      }
    ],
    "genderDistribution": [
      {
        "gender": "string",
        "count": "number",
        "percentage": "number"
      }
    ]
  }
}
```

### Product Analytics (商品分析)
```json
{
  "period": "string",
  "startDate": "date",
  "endDate": "date",
  "metrics": {
    "totalProducts": "number",
    "activeProducts": "number",
    "topSellingProducts": "number",
    "lowStockProducts": "number"
  },
  "performance": [
    {
      "productId": "string",
      "productName": "string",
      "sales": "number",
      "quantity": "number",
      "revenue": "number",
      "profit": "number",
      "margin": "number (百分比)"
    }
  ],
  "categories": [
    {
      "categoryId": "string",
      "categoryName": "string",
      "productCount": "number",
      "totalSales": "number",
      "averagePrice": "number"
    }
  ],
  "inventory": {
    "totalStock": "number",
    "lowStockCount": "number",
    "outOfStockCount": "number",
    "stockTurnover": "number"
  }
}
```

### Revenue Analytics (營收分析)
```json
{
  "period": "string",
  "startDate": "date",
  "endDate": "date",
  "metrics": {
    "totalRevenue": "number",
    "grossProfit": "number",
    "netProfit": "number",
    "revenueGrowth": "number (百分比)",
    "profitMargin": "number (百分比)"
  },
  "breakdown": {
    "byCategory": [
      {
        "category": "string",
        "revenue": "number",
        "percentage": "number"
      }
    ],
    "byPaymentMethod": [
      {
        "method": "string",
        "revenue": "number",
        "percentage": "number"
      }
    ],
    "byRegion": [
      {
        "region": "string",
        "revenue": "number",
        "percentage": "number"
      }
    ]
  },
  "forecast": {
    "nextPeriod": "number",
    "confidence": "number (百分比)",
    "factors": ["string"]
  }
}
```

### Dashboard Data (儀表板資料)
```json
{
  "overview": {
    "totalRevenue": "number",
    "totalOrders": "number",
    "totalUsers": "number",
    "totalProducts": "number"
  },
  "growth": {
    "revenueGrowth": "number (百分比)",
    "orderGrowth": "number (百分比)",
    "userGrowth": "number (百分比)",
    "productGrowth": "number (百分比)"
  },
  "charts": {
    "revenueTrend": [
      {
        "date": "date",
        "value": "number"
      }
    ],
    "orderTrend": [
      {
        "date": "date",
        "value": "number"
      }
    ],
    "userTrend": [
      {
        "date": "date",
        "value": "number"
      }
    ]
  },
  "alerts": [
    {
      "type": "string (warning, error, info)",
      "message": "string",
      "timestamp": "date-time"
    }
  ]
}
```

## 🔍 查詢參數

### 通用參數
- `period` - 時間週期 (day, week, month, quarter, year)
- `startDate` - 開始日期 (ISO 8601)
- `endDate` - 結束日期 (ISO 8601)
- `groupBy` - 分組方式 (category, product, user, region)
- `sortBy` - 排序欄位
- `sortOrder` - 排序方向 (asc, desc)
- `limit` - 限制數量 (預設: 10, 最大: 100)

### 比較參數
- `compareWith` - 比較對象 (previous, same_period_last_year)
- `comparePeriod` - 比較週期

### 範例查詢
```bash
# 本月銷售趨勢
curl "http://localhost:3006/api/v1/analytics/sales/trend?period=month&startDate=2025-09-01"

# 與上月比較
curl "http://localhost:3006/api/v1/analytics/sales/comparison?period=month&compareWith=previous"

# 按分類分組的銷售分析
curl "http://localhost:3006/api/v1/analytics/sales?groupBy=category&period=month"

# 熱門商品分析
curl "http://localhost:3006/api/v1/analytics/products/performance?sortBy=revenue&limit=20"
```

## 📊 分析維度

### 時間維度
- **即時** - 當前數據
- **日** - 每日統計
- **週** - 每週統計
- **月** - 每月統計
- **季** - 每季統計
- **年** - 每年統計

### 業務維度
- **商品** - 按商品分析
- **分類** - 按商品分類分析
- **用戶** - 按用戶分析
- **地區** - 按地區分析
- **渠道** - 按銷售渠道分析

### 指標類型
- **絕對指標** - 銷售額、訂單數、用戶數
- **相對指標** - 增長率、轉換率、留存率
- **效率指標** - 客單價、庫存周轉率
- **質量指標** - 滿意度、退貨率

## 🔄 業務邏輯

### 資料聚合
1. 從各服務收集原始數據
2. 按時間和業務維度聚合
3. 計算衍生指標
4. 生成分析報告
5. 更新快取

### 趨勢分析
1. 計算時間序列數據
2. 識別趨勢模式
3. 計算增長率
4. 預測未來趨勢
5. 生成趨勢報告

### 比較分析
1. 選擇比較基準
2. 計算差異指標
3. 分析變化原因
4. 生成比較報告
5. 提供改進建議

## 🧪 測試案例

### 單元測試
- 資料聚合邏輯
- 指標計算
- 趨勢分析
- 比較分析

### 整合測試
- 與各服務整合
- 資料同步
- 快取更新
- 報告生成

### 效能測試
- 大量資料處理
- 複雜查詢效能
- 快取命中率
- 回應時間

## 📈 效能考量

### 資料庫優化
- 適當的索引設計
- 分區表策略
- 查詢優化
- 資料壓縮

### 快取策略
- Redis 快取熱門查詢
- 預計算常用指標
- 分層快取架構
- 快取失效策略

### 資料處理
- 批次處理大量資料
- 異步資料更新
- 增量更新策略
- 資料壓縮存儲

## 🔐 安全性

### 資料保護
- 敏感資料加密
- 存取權限控制
- 資料匿名化
- 審計日誌

### 權限控制
- 角色基礎存取控制
- API 權限驗證
- 資料範圍限制
- 操作日誌記錄

## 📊 監控與告警

### 關鍵指標
- API 回應時間
- 資料處理延遲
- 快取命中率
- 錯誤率

### 告警規則
- 資料延遲告警
- 異常數據告警
- 系統錯誤告警
- 效能下降告警

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Dashboard Service API](../dashboard-service/API_DOCUMENTATION.md)
- [Product Service API](../product-service/API_DOCUMENTATION.md)
- [Order Service API](../order-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-04)
- 初始版本發布
- 基本分析功能
- 銷售分析
- 用戶分析
- 商品分析
- 營收分析

### v1.1.0 (2025-09-05)
- 新增趨勢分析
- 新增比較分析
- 優化查詢效能
- 增強快取策略

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.1.0  
**維護者**: 電商系統開發團隊
