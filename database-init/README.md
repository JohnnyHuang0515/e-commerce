# 電商系統資料庫初始化指南

本目錄包含電商系統所有資料庫的初始化腳本和配置檔案。

## 📋 資料庫架構概覽

| 資料庫 | 用途 | 檔案 | 狀態 |
|--------|------|------|------|
| **PostgreSQL** | 交易型資料 | `postgresql-init.sql` | ✅ |
| **MongoDB** | 半結構化資料 | `mongodb-init.js` | ✅ |
| **Redis** | 快取與 Session | `redis-init.sh` | ✅ |
| **MinIO** | 物件儲存 | `minio-init.sh` | ✅ |
| **Milvus** | 向量資料庫 | `milvus-init.py` | ✅ |
| **ClickHouse** | 數據倉儲 | `clickhouse-init.sql` | ✅ |
| **Docker Compose** | 整合部署 | `docker-compose.yml` | ✅ |

## 🚀 快速開始

### 方法一：使用 Docker Compose（推薦）

```bash
# 1. 啟動所有資料庫服務
docker-compose up -d

# 2. 等待所有服務啟動完成
docker-compose ps

# 3. 檢查初始化狀態
docker-compose logs db-init

# 4. 停止服務
docker-compose down
```

### 方法二：個別初始化

#### PostgreSQL
```bash
# 使用 Docker
docker run -d --name postgresql \
  -e POSTGRES_DB=ecommerce_db \
  -e POSTGRES_USER=ecommerce_user \
  -e POSTGRES_PASSWORD=ecommerce_password \
  -p 5432:5432 \
  -v $(pwd)/postgresql-init.sql:/docker-entrypoint-initdb.d/init.sql:ro \
  postgres:15-alpine

# 或直接執行 SQL
psql -h localhost -U postgres -f postgresql-init.sql
```

#### MongoDB
```bash
# 使用 Docker
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=mongodb_password \
  -p 27017:27017 \
  -v $(pwd)/mongodb-init.js:/docker-entrypoint-initdb.d/init.js:ro \
  mongo:7.0

# 或直接執行 JavaScript
mongosh --file mongodb-init.js
```

#### Redis
```bash
# 使用 Docker
docker run -d --name redis \
  -p 6379:6379 \
  redis:7.2-alpine redis-server --requirepass redis_password

# 執行初始化腳本
chmod +x redis-init.sh
./redis-init.sh
```

#### MinIO
```bash
# 使用 Docker
docker run -d --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# 執行初始化腳本
chmod +x minio-init.sh
./minio-init.sh
```

#### Milvus
```bash
# 使用 Docker Compose 啟動 Milvus
docker-compose up -d milvus-etcd milvus-minio milvus-standalone

# 執行初始化腳本
pip install pymilvus numpy
python3 milvus-init.py
```

#### ClickHouse
```bash
# 使用 Docker
docker run -d --name clickhouse \
  -e CLICKHOUSE_DB=ecommerce_analytics \
  -e CLICKHOUSE_USER=analytics_user \
  -e CLICKHOUSE_PASSWORD=analytics_password \
  -p 8123:8123 -p 9000:9000 \
  -v $(pwd)/clickhouse-init.sql:/docker-entrypoint-initdb.d/init.sql:ro \
  clickhouse/clickhouse-server:23.8

# 或直接執行 SQL
clickhouse-client --multiquery < clickhouse-init.sql
```

## 🔧 配置說明

### 環境變數

| 變數名稱 | 預設值 | 說明 |
|----------|--------|------|
| `POSTGRES_DB` | `ecommerce_db` | PostgreSQL 資料庫名稱 |
| `POSTGRES_USER` | `ecommerce_user` | PostgreSQL 使用者名稱 |
| `POSTGRES_PASSWORD` | `ecommerce_password` | PostgreSQL 密碼 |
| `MONGO_ROOT_USERNAME` | `root` | MongoDB 管理員使用者 |
| `MONGO_ROOT_PASSWORD` | `mongodb_password` | MongoDB 管理員密碼 |
| `REDIS_PASSWORD` | `redis_password` | Redis 密碼 |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO 使用者名稱 |
| `MINIO_ROOT_PASSWORD` | `minioadmin123` | MinIO 密碼 |
| `MILVUS_USER` | `root` | Milvus 使用者名稱 |
| `MILVUS_PASSWORD` | `Milvus` | Milvus 密碼 |

### 連接資訊

| 服務 | 主機 | 埠號 | 使用者 | 密碼 |
|------|------|------|--------|------|
| PostgreSQL | localhost | 5432 | ecommerce_user | ecommerce_password |
| MongoDB | localhost | 27017 | root | mongodb_password |
| Redis | localhost | 6379 | - | redis_password |
| MinIO | localhost | 9000 | minioadmin | minioadmin123 |
| Milvus | localhost | 19530 | root | Milvus |
| ClickHouse | localhost | 8123 | analytics_user | analytics_password |

## 🛠️ 管理工具

### Web 介面

| 工具 | URL | 使用者 | 密碼 |
|------|-----|--------|------|
| pgAdmin | http://localhost:5050 | admin@ecommerce.com | admin123 |
| Mongo Express | http://localhost:8081 | admin | admin123 |
| Redis Commander | http://localhost:8082 | - | - |
| MinIO Console | http://localhost:9001 | minioadmin | minioadmin123 |

### 命令列工具

```bash
# PostgreSQL
psql -h localhost -U ecommerce_user -d ecommerce_db

# MongoDB
mongosh mongodb://root:mongodb_password@localhost:27017/ecommerce

# Redis
redis-cli -h localhost -a redis_password

# ClickHouse
clickhouse-client --host localhost --user analytics_user --password analytics_password
```

## 📊 資料庫結構

### PostgreSQL 主要表格
- `Users` - 用戶資料
- `Products` - 商品核心資料
- `Orders` - 訂單資料
- `Payments` - 支付資料
- `User_Events` - 用戶行為事件
- `Recommendations` - AI 推薦結果

### MongoDB 主要集合
- `products_detail` - 商品詳細描述
- `frontend_configs` - 前端配置
- `system_logs` - 系統日誌
- `customer_service_records` - 客服紀錄

### Redis 主要鍵值
- `session:*` - 用戶 Session
- `cart:*` - 購物車資料
- `popular_products:*` - 熱門商品快取
- `stock:*` - 商品庫存快取

### MinIO 目錄結構
```
ecommerce-storage/
├── products/{id}/main/, gallery/, thumbnails/, videos/
├── users/{id}/avatars/, documents/
├── orders/{id}/invoices/, receipts/
├── returns/{id}/proof_images/, damage_photos/
└── system/logos/, banners/, documents/
```

### Milvus 主要集合
- `product_vectors` - 商品特徵向量
- `user_vectors` - 用戶行為向量
- `search_history` - 搜尋歷史
- `recommendations` - 推薦結果

### ClickHouse 主要表格
- `user_behavior_events` - 用戶行為事件
- `sales_data` - 銷售數據
- `product_performance` - 商品表現數據
- `user_analytics` - 用戶分析

## 🔍 驗證初始化

### 檢查服務狀態
```bash
# 檢查所有容器狀態
docker-compose ps

# 檢查特定服務日誌
docker-compose logs postgresql
docker-compose logs mongodb
docker-compose logs redis
```

### 驗證資料
```bash
# PostgreSQL
psql -h localhost -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM users;"

# MongoDB
mongosh mongodb://root:mongodb_password@localhost:27017/ecommerce --eval "db.products_detail.countDocuments()"

# Redis
redis-cli -h localhost -a redis_password -c "DBSIZE"

# ClickHouse
clickhouse-client --host localhost --user analytics_user --password analytics_password --query "SELECT COUNT(*) FROM user_behavior_events"
```

## 🚨 故障排除

### 常見問題

1. **服務啟動失敗**
   ```bash
   # 檢查日誌
   docker-compose logs [service_name]
   
   # 重新啟動服務
   docker-compose restart [service_name]
   ```

2. **初始化腳本執行失敗**
   ```bash
   # 手動執行初始化
   docker-compose exec [service_name] [init_command]
   ```

3. **連接被拒絕**
   ```bash
   # 檢查服務是否正在運行
   docker-compose ps
   
   # 檢查埠號是否被占用
   netstat -tulpn | grep [port]
   ```

4. **資料庫權限問題**
   ```bash
   # 檢查使用者權限
   docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -c "\du"
   ```

### 重置資料庫

```bash
# 停止所有服務
docker-compose down

# 刪除所有資料卷
docker-compose down -v

# 重新啟動
docker-compose up -d
```

## 📝 開發建議

1. **開發環境**：使用 Docker Compose 快速啟動所有服務
2. **測試環境**：個別啟動需要的資料庫服務
3. **生產環境**：根據實際需求調整配置和資源限制

## 🔄 更新與維護

### 定期備份
```bash
# PostgreSQL 備份
docker-compose exec postgresql pg_dump -U ecommerce_user ecommerce_db > backup_$(date +%Y%m%d).sql

# MongoDB 備份
docker-compose exec mongodb mongodump --db ecommerce --out /backup/$(date +%Y%m%d)

# Redis 備份
docker-compose exec redis redis-cli --rdb /backup/dump_$(date +%Y%m%d).rdb
```

### 監控
- 使用各資料庫的內建監控工具
- 設定日誌輪轉和清理策略
- 監控磁碟空間和記憶體使用

## 📞 支援

如有問題，請檢查：
1. 服務日誌：`docker-compose logs [service_name]`
2. 網路連接：確保埠號未被占用
3. 資源限制：確保有足夠的記憶體和磁碟空間
4. 權限設定：檢查檔案權限和使用者權限
