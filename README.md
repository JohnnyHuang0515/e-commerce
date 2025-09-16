# 電商系統一鍵啟動指南

本專案提供完整的電商系統資料庫架構，包含6個不同類型的資料庫和完整的測試資料。

## 🚀 一鍵啟動

### 快速開始

```bash
# 1. 克隆專案（如果還沒有的話）
git clone <your-repo-url>
cd e-commerce

# 2. 執行一鍵啟動腳本
./one-click-setup.sh
```

### 一鍵啟動腳本功能

`one-click-setup.sh` 腳本會自動完成以下步驟：

1. **環境檢查** - 檢查 Docker、Docker Compose、Python3 等必要工具
2. **安裝依賴** - 安裝 Python 套件和 MinIO 客戶端
3. **啟動資料庫服務** - 啟動所有6個資料庫服務
4. **初始化資料庫** - 執行資料庫初始化腳本
5. **生成測試資料** - 生成完整的測試資料
6. **驗證系統** - 驗證所有資料庫和測試資料

## 📋 系統架構

### 資料庫架構

| 資料庫 | 用途 | 埠號 | 說明 |
|--------|------|------|------|
| **PostgreSQL** | 交易型資料 | 5432 | 用戶、訂單、支付、商品等核心資料 |
| **MongoDB** | 半結構化資料 | 27017 | 商品詳情、前端配置、系統日誌 |
| **Redis** | 快取與Session | 6379 | Session管理、購物車、熱門商品快取 |
| **MinIO** | 物件儲存 | 9000 | 商品圖片、用戶頭像、發票、影片 |
| **Milvus** | 向量資料庫 | 19530 | AI推薦、相似商品搜尋、用戶行為分析 |
| **ClickHouse** | 數據倉儲 | 8123 | 用戶行為分析、銷售報表、商品表現分析 |

### 目錄結構

```
e-commerce/
├── one-click-setup.sh          # 一鍵啟動腳本
├── docker-compose.yml          # Docker Compose 配置
├── database-design.md          # 資料庫設計文件
├── database-init/              # 資料庫初始化腳本
│   ├── postgresql-init.sql    # PostgreSQL 初始化
│   ├── mongodb-init.js         # MongoDB 初始化
│   ├── redis-init.sh          # Redis 初始化
│   ├── minio-init.sh          # MinIO 初始化
│   ├── milvus-init.py         # Milvus 初始化
│   ├── clickhouse-init.sql    # ClickHouse 初始化
│   ├── docker-compose.yml     # 服務配置
│   ├── validate-init.sh       # 初始化驗證腳本
│   └── README.md              # 初始化說明
├── test-data/                  # 測試資料
│   ├── postgresql-test-data.sql # PostgreSQL 測試資料
│   ├── mongodb-test-data.js    # MongoDB 測試資料
│   ├── redis-test-data.sh      # Redis 測試資料
│   ├── minio-test-data.sh      # MinIO 測試資料
│   ├── milvus-test-data.py     # Milvus 測試資料
│   ├── clickhouse-test-data.sql # ClickHouse 測試資料
│   ├── generate-test-data.sh   # 測試資料生成腳本
│   ├── validate-test-data.sh   # 測試資料驗證腳本
│   └── README.md              # 測試資料說明
└── README.md                  # 本文件
```

## 🛠️ 手動操作

### 啟動資料庫服務

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看服務日誌
docker-compose logs [service_name]
```

### 初始化資料庫

```bash
# 進入初始化目錄
cd database-init

# 執行初始化驗證
./validate-init.sh

# 或個別執行初始化腳本
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -f postgresql-init.sql
docker-compose exec mongodb mongosh --file mongodb-init.js
docker-compose exec redis sh redis-init.sh
docker-compose exec minio sh minio-init.sh
docker-compose exec milvus-standalone python3 milvus-init.py
docker-compose exec clickhouse clickhouse-client --multiquery < clickhouse-init.sql
```

### 生成測試資料

```bash
# 進入測試資料目錄
cd test-data

# 執行測試資料生成
./generate-test-data.sh

# 或個別執行測試資料腳本
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -f postgresql-test-data.sql
docker-compose exec mongodb mongosh --file mongodb-test-data.js
docker-compose exec redis sh redis-test-data.sh
docker-compose exec minio sh minio-test-data.sh
docker-compose exec milvus-standalone python3 milvus-test-data.py
docker-compose exec clickhouse clickhouse-client --multiquery < clickhouse-test-data.sql
```

### 驗證系統

```bash
# 驗證測試資料
cd test-data
./validate-test-data.sh

# 手動驗證特定資料庫
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM users;"
docker-compose exec mongodb mongosh --quiet --eval "db.products_detail.countDocuments()"
docker-compose exec redis redis-cli DBSIZE
```

## 📊 測試資料概覽

### PostgreSQL 測試資料
- **用戶**: 13個（包含不同年齡層和性別）
- **商品**: 25個（涵蓋5個主要分類）
- **分類**: 18個（5個主分類，13個子分類）
- **訂單**: 10個（包含不同狀態和支付方式）
- **支付**: 10個（多種支付方式）
- **評論**: 10個（真實的用戶評論）
- **優惠券**: 6個（不同折扣和有效期）
- **退貨**: 3個（不同退貨原因）
- **用戶行為**: 10個（瀏覽、點擊、購買等）
- **推薦**: 10個（AI推薦結果）

### MongoDB 測試資料
- **商品詳情**: 8個（詳細的商品描述和規格）
- **前端配置**: 3個（分類頁面、結帳頁面配置）
- **系統日誌**: 8個（不同級別的系統日誌）
- **客服紀錄**: 5個（真實的客服對話）

### Redis 測試資料
- **Session**: 6個（用戶登入狀態）
- **購物車**: 6個（不同用戶的購物車）
- **熱門商品**: 6個分類（每日熱門商品）
- **庫存快取**: 10個商品（即時庫存狀態）
- **推薦資料**: 6個用戶（個人化推薦）
- **系統配置**: 4個（網站、支付、物流、行銷設定）

### MinIO 測試資料
- **商品圖片**: 25個檔案（主圖、圖庫、縮圖）
- **用戶頭像**: 5個檔案（用戶個人頭像）
- **發票**: 5個檔案（PDF格式發票）
- **退貨證明**: 4個檔案（退貨證明圖片）
- **系統資源**: 10個檔案（橫幅、分類、促銷圖片）
- **商品影片**: 5個檔案（商品演示影片）

### Milvus 測試資料
- **商品向量**: 25個（512維商品特徵向量）
- **用戶向量**: 13個（256維用戶行為向量）
- **搜尋歷史**: 25個（用戶搜尋記錄）
- **推薦結果**: 40個（AI推薦結果）
- **用戶行為**: 30個（用戶行為特徵向量）
- **商品相似度**: 30個（商品相似度關係）

### ClickHouse 測試資料
- **用戶行為事件**: 25個（詳細的用戶行為記錄）
- **銷售數據**: 16個（銷售交易記錄）
- **商品表現**: 15個（商品表現指標）
- **用戶分析**: 9個（用戶分析數據）
- **行銷活動**: 8個（行銷活動記錄）
- **庫存分析**: 15個（庫存狀況分析）
- **支付分析**: 12個（支付方式分析）
- **物流分析**: 14個（物流狀況分析）

## 🔧 故障排除

### 常見問題

1. **服務啟動失敗**
   ```bash
   # 檢查 Docker 狀態
   docker --version
   docker-compose --version
   
   # 檢查埠號占用
   netstat -tulpn | grep :5432
   
   # 重新啟動服務
   docker-compose down
   docker-compose up -d
   ```

2. **初始化失敗**
   ```bash
   # 檢查服務日誌
   docker-compose logs postgresql
   docker-compose logs mongodb
   
   # 手動執行初始化
   cd database-init
   ./validate-init.sh
   ```

3. **測試資料生成失敗**
   ```bash
   # 檢查腳本權限
   chmod +x test-data/*.sh
   chmod +x test-data/*.py
   
   # 手動執行測試資料生成
   cd test-data
   ./generate-test-data.sh
   ```

4. **驗證失敗**
   ```bash
   # 檢查資料庫連線
   docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT 1;"
   
   # 手動驗證
   cd test-data
   ./validate-test-data.sh
   ```

### 重置系統

```bash
# 停止所有服務
docker-compose down

# 刪除所有資料卷
docker-compose down -v

# 重新啟動
./one-click-setup.sh
```

## 📚 開發指南

### 連接到資料庫

#### PostgreSQL
```bash
# 命令行連接
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db

# 應用程式連接
Host: localhost
Port: 5432
Database: ecommerce_db
Username: ecommerce_user
Password: ecommerce_password
```

#### MongoDB
```bash
# 命令行連接
docker-compose exec mongodb mongosh

# 應用程式連接
Host: localhost
Port: 27017
Database: ecommerce
Username: ecommerce_user
Password: ecommerce_password
```

#### Redis
```bash
# 命令行連接
docker-compose exec redis redis-cli

# 應用程式連接
Host: localhost
Port: 6379
Password: redis_password
```

#### MinIO
```bash
# 命令行連接
docker-compose exec minio mc alias set ecommerce http://localhost:9000 minioadmin minioadmin123

# 應用程式連接
Host: localhost
Port: 9000
Access Key: minioadmin
Secret Key: minioadmin123
```

#### Milvus
```bash
# Python 連接
from pymilvus import connections
connections.connect("default", host="localhost", port="19530")

# 應用程式連接
Host: localhost
Port: 19530
Username: root
Password: Milvus
```

#### ClickHouse
```bash
# 命令行連接
docker-compose exec clickhouse clickhouse-client

# 應用程式連接
Host: localhost
Port: 8123
Database: ecommerce_analytics
Username: default
Password: clickhouse_password
```

### 開發建議

1. **開發環境**: 使用一鍵啟動腳本快速建立開發環境
2. **測試環境**: 根據需要選擇性啟動特定服務
3. **生產環境**: 不要使用測試資料，應使用真實資料
4. **備份策略**: 定期備份重要資料
5. **監控**: 監控服務狀態和效能指標

## 📞 支援

如有問題，請檢查：

1. **服務日誌**: `docker-compose logs [service_name]`
2. **網路連接**: 確保埠號未被占用
3. **資源限制**: 確保有足夠的記憶體和磁碟空間
4. **權限設定**: 檢查檔案權限和使用者權限
5. **Docker 版本**: 確保 Docker 和 Docker Compose 版本相容

## 📄 授權

本專案採用 MIT 授權條款。