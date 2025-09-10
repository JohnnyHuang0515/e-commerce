# 📊 電商系統 Dashboard Service API 文檔

## 📋 概述

這是電商系統儀表板服務的 API 文檔，提供完整的儀表板功能，包括概覽統計、即時資料、警告系統、小工具管理等。

## 🌐 API 文檔地址

- **互動式文檔**: http://localhost:3011/api-docs/
- **健康檢查**: http://localhost:3011/health
- **服務狀態**: 運行中 ✅

## 📊 API 端點總覽

### 🔍 健康檢查
- `GET /health` - 服務健康檢查

### 📈 概覽統計
- `GET /api/v1/dashboard/overview` - 取得概覽統計
- `GET /api/v1/dashboard/stats` - 取得詳細統計
- `GET /api/v1/dashboard/summary` - 取得摘要資料

### ⚡ 即時資料
- `GET /api/v1/dashboard/realtime` - 取得即時資料
- `GET /api/v1/dashboard/metrics` - 取得關鍵指標
- `GET /api/v1/dashboard/trends` - 取得趨勢資料

### 🚨 警告系統
- `GET /api/v1/dashboard/alerts` - 取得警告列表
- `POST /api/v1/dashboard/alerts` - 建立新警告
- `PUT /api/v1/dashboard/alerts/:id` - 更新警告
- `DELETE /api/v1/dashboard/alerts/:id` - 刪除警告
- `PUT /api/v1/dashboard/alerts/:id/acknowledge` - 確認警告

### 🧩 小工具管理
- `GET /api/v1/dashboard/widgets` - 取得小工具列表
- `POST /api/v1/dashboard/widgets` - 建立新小工具
- `PUT /api/v1/dashboard/widgets/:id` - 更新小工具
- `DELETE /api/v1/dashboard/widgets/:id` - 刪除小工具
- `GET /api/v1/dashboard/widgets/:id/data` - 取得小工具資料

### 📊 資料聚合
- `GET /api/v1/dashboard/analytics` - 取得分析資料
- `GET /api/v1/dashboard/reports` - 取得報告資料
- `POST /api/v1/dashboard/reports/generate` - 生成報告

## 🔧 快速測試

### 1. 健康檢查
```bash
curl http://localhost:3011/health
```

### 2. 取得概覽統計
```bash
curl http://localhost:3011/api/v1/dashboard/overview
```

### 3. 取得即時資料
```bash
curl http://localhost:3011/api/v1/dashboard/realtime
```

### 4. 取得警告列表
```bash
curl http://localhost:3011/api/v1/dashboard/alerts
```

### 5. 建立新小工具
```bash
curl -X POST http://localhost:3011/api/v1/dashboard/widgets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "銷售趨勢",
    "type": "line_chart",
    "config": {
      "dataSource": "sales",
      "period": "month",
      "metrics": ["revenue", "orders"]
    },
    "position": {
      "x": 0,
      "y": 0,
      "width": 6,
      "height": 4
    }
  }'
```

### 6. 取得小工具資料
```bash
curl http://localhost:3011/api/v1/dashboard/widgets/68b7d361f9f4bfdffafa3350/data
```

## 📋 資料模型

### Dashboard Overview (概覽統計)
```json
{
  "timestamp": "date-time",
  "metrics": {
    "totalRevenue": {
      "value": "number",
      "change": "number (百分比)",
      "trend": "string (up, down, stable)"
    },
    "totalOrders": {
      "value": "number",
      "change": "number (百分比)",
      "trend": "string"
    },
    "totalUsers": {
      "value": "number",
      "change": "number (百分比)",
      "trend": "string"
    },
    "totalProducts": {
      "value": "number",
      "change": "number (百分比)",
      "trend": "string"
    }
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
    "userGrowth": [
      {
        "date": "date",
        "value": "number"
      }
    ]
  },
  "topProducts": [
    {
      "productId": "string",
      "productName": "string",
      "sales": "number",
      "revenue": "number"
    }
  ],
  "recentOrders": [
    {
      "orderId": "string",
      "customerName": "string",
      "amount": "number",
      "status": "string",
      "createdAt": "date-time"
    }
  ]
}
```

### Realtime Data (即時資料)
```json
{
  "timestamp": "date-time",
  "onlineUsers": "number",
  "activeOrders": "number",
  "pendingOrders": "number",
  "systemHealth": {
    "status": "string (healthy, warning, error)",
    "uptime": "number (秒)",
    "memoryUsage": "number (百分比)",
    "cpuUsage": "number (百分比)"
  },
  "services": [
    {
      "name": "string",
      "status": "string (running, stopped, error)",
      "responseTime": "number (毫秒)",
      "lastCheck": "date-time"
    }
  ],
  "alerts": [
    {
      "id": "string",
      "type": "string (warning, error, info)",
      "message": "string",
      "timestamp": "date-time",
      "acknowledged": "boolean"
    }
  ]
}
```

### Widget (小工具)
```json
{
  "_id": "string",
  "title": "string (必填)",
  "type": "string (enum: line_chart, bar_chart, pie_chart, metric_card, table)",
  "config": {
    "dataSource": "string (必填)",
    "period": "string (day, week, month, quarter, year)",
    "metrics": ["string"],
    "filters": "object",
    "options": "object"
  },
  "position": {
    "x": "number (必填)",
    "y": "number (必填)",
    "width": "number (必填)",
    "height": "number (必填)"
  },
  "style": {
    "backgroundColor": "string",
    "borderColor": "string",
    "textColor": "string"
  },
  "refreshInterval": "number (秒, 預設: 300)",
  "enabled": "boolean (預設: true)",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Alert (警告)
```json
{
  "_id": "string",
  "title": "string (必填)",
  "message": "string (必填)",
  "type": "string (enum: warning, error, info, success)",
  "severity": "string (enum: low, medium, high, critical)",
  "source": "string (警告來源)",
  "data": "object (相關資料)",
  "status": "string (enum: active, acknowledged, resolved)",
  "acknowledgedBy": "string (確認者)",
  "acknowledgedAt": "date-time",
  "resolvedAt": "date-time",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Analytics Data (分析資料)
```json
{
  "period": "string",
  "startDate": "date",
  "endDate": "date",
  "sales": {
    "totalRevenue": "number",
    "totalOrders": "number",
    "averageOrderValue": "number",
    "growthRate": "number (百分比)"
  },
  "users": {
    "totalUsers": "number",
    "newUsers": "number",
    "activeUsers": "number",
    "retentionRate": "number (百分比)"
  },
  "products": {
    "totalProducts": "number",
    "activeProducts": "number",
    "topSellingProducts": "number",
    "lowStockProducts": "number"
  },
  "performance": {
    "conversionRate": "number (百分比)",
    "bounceRate": "number (百分比)",
    "averageSessionDuration": "number (分鐘)",
    "pageViews": "number"
  }
}
```

## 🔍 查詢參數

### 概覽查詢
- `period` - 時間週期 (day, week, month, quarter, year)
- `startDate` - 開始日期 (ISO 8601)
- `endDate` - 結束日期 (ISO 8601)
- `metrics` - 指定指標 (逗號分隔)

### 小工具查詢
- `type` - 小工具類型篩選
- `enabled` - 是否啟用篩選
- `dataSource` - 資料來源篩選

### 警告查詢
- `type` - 警告類型篩選
- `severity` - 嚴重程度篩選
- `status` - 狀態篩選
- `acknowledged` - 是否已確認篩選

### 範例查詢
```bash
# 取得本月概覽
curl "http://localhost:3011/api/v1/dashboard/overview?period=month&startDate=2025-09-01"

# 取得特定指標
curl "http://localhost:3011/api/v1/dashboard/stats?metrics=revenue,orders,users"

# 取得啟用的小工具
curl "http://localhost:3011/api/v1/dashboard/widgets?enabled=true"

# 取得未確認的警告
curl "http://localhost:3011/api/v1/dashboard/alerts?acknowledged=false&severity=high"
```

## 🔄 業務邏輯

### 資料聚合
1. 從各服務收集資料
2. 按時間和維度聚合
3. 計算衍生指標
4. 生成圖表資料
5. 更新快取

### 即時監控
1. 定期檢查服務狀態
2. 監控關鍵指標
3. 檢測異常情況
4. 生成警告
5. 更新即時資料

### 小工具管理
1. 驗證小工具配置
2. 獲取資料來源
3. 處理資料格式
4. 生成視覺化資料
5. 快取結果

### 警告處理
1. 檢測觸發條件
2. 生成警告
3. 發送通知
4. 記錄警告歷史
5. 更新狀態

## 🧪 測試案例

### 單元測試
- 資料聚合邏輯
- 指標計算
- 小工具配置
- 警告生成

### 整合測試
- 與各服務整合
- 資料同步
- 快取更新
- 通知機制

### 效能測試
- 大量資料處理
- 即時資料更新
- 小工具渲染
- 快取效能

## 📈 效能考量

### 資料庫優化
- 適當的索引設計
- 分區表策略
- 查詢優化
- 資料壓縮

### 快取策略
- Redis 快取熱門資料
- 分層快取架構
- 快取失效策略
- 預計算常用指標

### 即時更新
- WebSocket 連接
- Server-Sent Events
- 增量更新策略
- 資料壓縮傳輸

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

### 即時安全
- 連接驗證
- 資料完整性檢查
- 異常檢測
- 自動斷線機制

## 📊 監控與告警

### 關鍵指標
- API 回應時間
- 資料更新延遲
- 快取命中率
- 錯誤率

### 告警規則
- 服務離線告警
- 資料延遲告警
- 異常數據告警
- 效能下降告警

## 📚 相關文檔

- [系統架構文檔](../../../docs/02_system_architecture_document.md)
- [API 設計規範](../../../docs/04_api_design_specification.md)
- [資料庫設計](../../../docs/03_system_design_document.md)
- [Analytics Service API](../analytics-service/API_DOCUMENTATION.md)
- [Product Service API](../product-service/API_DOCUMENTATION.md)
- [Order Service API](../order-service/API_DOCUMENTATION.md)

## 🆕 更新日誌

### v1.0.0 (2025-09-05)
- 初始版本發布
- 基本儀表板功能
- 概覽統計
- 即時資料
- 警告系統
- 小工具管理

### v1.1.0 (2025-09-05)
- 新增資料聚合
- 新增報告生成
- 優化即時更新
- 增強小工具功能

---

**最後更新**: 2025-09-05  
**文檔版本**: v1.1.0  
**維護者**: 電商系統開發團隊
