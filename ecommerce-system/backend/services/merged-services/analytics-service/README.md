# Analytics Service - ClickHouse 版本

電商系統數據分析服務，使用 ClickHouse 作為時序資料庫，專為大量數據分析和聚合查詢優化。

## 🚀 技術棧

- **Node.js**: 18+
- **Express**: Web 框架
- **ClickHouse**: 時序資料庫
- **Winston**: 日誌管理
- **Docker**: 容器化部署

## 📊 功能特性

### 數據分析
- **銷售分析**: 銷售趨勢、收入統計、訂單分析
- **用戶行為分析**: 用戶操作追蹤、行為模式分析
- **產品性能分析**: 產品表現、轉換率分析
- **系統健康監控**: 服務狀態、性能指標

### ClickHouse 優化
- **時序數據**: 專為時間序列數據優化
- **高並發**: 支持大量並發查詢
- **壓縮存儲**: 高效的數據壓縮
- **TTL 管理**: 自動數據過期清理

## 🛠️ 安裝與運行

### 本地開發

1. **安裝依賴**
```bash
npm install
```

2. **配置環境變數**
```bash
cp env.example .env
# 編輯 .env 文件
```

3. **啟動 ClickHouse**
```bash
# 使用 Docker Compose
docker-compose up clickhouse -d

# 或手動安裝 ClickHouse
# 參考: https://clickhouse.com/docs/en/install
```

4. **啟動服務**
```bash
npm start
# 或開發模式
npm run dev
```

### Docker 部署

1. **構建並啟動**
```bash
docker-compose up -d
```

2. **檢查服務狀態**
```bash
docker-compose ps
```

3. **查看日誌**
```bash
docker-compose logs -f analytics-service
```

## 📡 API 端點

### 健康檢查
```
GET /api/v1/health
```

### 銷售分析
```
GET /api/v1/analytics/sales
POST /api/v1/analytics/sales
```

### 用戶行為分析
```
GET /api/v1/analytics/user-behavior
POST /api/v1/analytics/user-behavior
```

### 產品性能分析
```
GET /api/v1/analytics/product-performance
POST /api/v1/analytics/product-performance
```

### 系統健康監控
```
GET /api/v1/analytics/system-health
POST /api/v1/analytics/system-health
```

### 分析報告
```
GET /api/v1/analytics/reports
POST /api/v1/analytics/reports
```

### 統計信息
```
GET /api/v1/analytics/stats
```

## 🗄️ 資料庫結構

### ClickHouse 表結構

#### user_behaviors (用戶行為表)
```sql
CREATE TABLE user_behaviors (
    id UUID DEFAULT generateUUIDv4(),
    user_id String,
    action LowCardinality(String),
    item_id String,
    item_type LowCardinality(String),
    metadata String,
    session_id String,
    ip_address String,
    user_agent String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, user_id, action)
PARTITION BY toYYYYMM(created_at)
TTL created_at + INTERVAL 1 YEAR
```

#### sales_analytics (銷售分析表)
```sql
CREATE TABLE sales_analytics (
    id UUID DEFAULT generateUUIDv4(),
    date Date,
    total_sales Decimal(15,2) DEFAULT 0,
    total_orders UInt32 DEFAULT 0,
    total_users UInt32 DEFAULT 0,
    average_order_value Decimal(15,2) DEFAULT 0,
    conversion_rate Decimal(5,4) DEFAULT 0,
    top_products String,
    top_categories String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree()
ORDER BY (date)
PARTITION BY toYYYYMM(date)
TTL date + INTERVAL 2 YEAR
```

#### product_performance (產品性能表)
```sql
CREATE TABLE product_performance (
    id UUID DEFAULT generateUUIDv4(),
    product_id String,
    product_name String,
    views UInt32 DEFAULT 0,
    clicks UInt32 DEFAULT 0,
    purchases UInt32 DEFAULT 0,
    revenue Decimal(15,2) DEFAULT 0,
    conversion_rate Decimal(5,4) DEFAULT 0,
    click_through_rate Decimal(5,4) DEFAULT 0,
    period_start Date,
    period_end Date,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree()
ORDER BY (product_id, period_start)
PARTITION BY toYYYYMM(period_start)
TTL period_start + INTERVAL 1 YEAR
```

#### system_health (系統健康表)
```sql
CREATE TABLE system_health (
    id UUID DEFAULT generateUUIDv4(),
    service_name LowCardinality(String),
    status LowCardinality(String),
    response_time UInt32 DEFAULT 0,
    cpu_usage Decimal(5,2) DEFAULT 0,
    memory_usage Decimal(5,2) DEFAULT 0,
    disk_usage Decimal(5,2) DEFAULT 0,
    error_count UInt32 DEFAULT 0,
    metrics String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, service_name)
PARTITION BY toYYYYMM(created_at)
TTL created_at + INTERVAL 3 MONTH
```

#### analytics_reports (分析報告表)
```sql
CREATE TABLE analytics_reports (
    id UUID DEFAULT generateUUIDv4(),
    report_type LowCardinality(String),
    period_start Date,
    period_end Date,
    metrics String,
    insights Array(String),
    recommendations Array(String),
    status LowCardinality(String) DEFAULT 'pending',
    generated_at DateTime DEFAULT now(),
    created_by String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (generated_at, report_type)
PARTITION BY toYYYYMM(generated_at)
TTL generated_at + INTERVAL 1 YEAR
```

## 🔧 配置說明

### 環境變數

| 變數名 | 說明 | 預設值 |
|--------|------|--------|
| `PORT` | 服務端口 | `3005` |
| `NODE_ENV` | 環境模式 | `development` |
| `CLICKHOUSE_HOST` | ClickHouse 主機 | `localhost` |
| `CLICKHOUSE_PORT` | ClickHouse 端口 | `8123` |
| `CLICKHOUSE_USERNAME` | ClickHouse 用戶名 | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouse 密碼 | `` |
| `CLICKHOUSE_DATABASE` | ClickHouse 資料庫 | `analytics` |
| `CORS_ORIGIN` | CORS 來源 | `http://localhost:3000` |
| `JWT_SECRET` | JWT 密鑰 | - |
| `LOG_LEVEL` | 日誌級別 | `info` |

### ClickHouse 配置

- **異步插入**: 啟用異步插入提高性能
- **壓縮**: 自動數據壓縮節省空間
- **TTL**: 自動數據過期清理
- **分區**: 按月份分區提高查詢效率

## 📈 性能優化

### ClickHouse 優化
- **分區策略**: 按時間分區提高查詢效率
- **索引優化**: 使用適當的排序鍵
- **壓縮**: 啟用數據壓縮節省存儲空間
- **異步插入**: 提高寫入性能

### 應用優化
- **連接池**: 重用 ClickHouse 連接
- **查詢優化**: 使用適當的查詢語法
- **緩存策略**: 對頻繁查詢的結果進行緩存
- **批量插入**: 使用批量插入提高性能

## 🚨 監控與日誌

### 健康檢查
- **服務狀態**: `/api/v1/health`
- **資料庫連接**: ClickHouse 連接狀態
- **統計信息**: 各表記錄數量

### 日誌管理
- **應用日誌**: Winston 日誌框架
- **錯誤日誌**: 分離的錯誤日誌文件
- **查詢日誌**: ClickHouse 查詢日誌

## 🔄 數據遷移

### 從 MongoDB 遷移
1. **導出 MongoDB 數據**
2. **轉換數據格式**
3. **批量插入 ClickHouse**
4. **驗證數據完整性**

### 數據備份
- **定期備份**: ClickHouse 數據備份
- **增量備份**: 只備份新增數據
- **恢復測試**: 定期測試數據恢復

## 🛡️ 安全考慮

- **網絡安全**: 限制 ClickHouse 網絡訪問
- **用戶權限**: 最小權限原則
- **數據加密**: 敏感數據加密存儲
- **審計日誌**: 記錄所有數據操作

## 📚 相關文檔

- [ClickHouse 官方文檔](https://clickhouse.com/docs/)
- [Node.js ClickHouse 客戶端](https://github.com/ClickHouse/clickhouse-js)
- [Express.js 文檔](https://expressjs.com/)
- [Winston 日誌文檔](https://github.com/winstonjs/winston)

## 🤝 貢獻

1. Fork 項目
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建 Pull Request

## 📄 許可證

MIT License
