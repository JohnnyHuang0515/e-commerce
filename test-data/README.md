# 電商系統測試資料指南

本目錄包含電商系統所有資料庫的擴展測試資料和生成腳本。

## 📋 測試資料概覽

| 資料庫 | 測試資料檔案 | 狀態 | 說明 |
|--------|-------------|------|------|
| **PostgreSQL** | `postgresql-test-data.sql` | ✅ | 擴展用戶、商品、訂單、支付等資料 |
| **MongoDB** | `mongodb-test-data.js` | ✅ | 擴展商品詳情、前端配置、日誌、客服紀錄 |
| **Redis** | `redis-test-data.sh` | ✅ | 擴展Session、購物車、快取、推薦資料 |
| **MinIO** | `minio-test-data.sh` | ✅ | 擴展商品圖片、用戶頭像、發票、退貨證明 |
| **Milvus** | `milvus-test-data.py` | ✅ | 擴展商品向量、用戶向量、搜尋歷史 |
| **ClickHouse** | `clickhouse-test-data.sql` | ✅ | 擴展用戶行為、銷售數據、商品表現分析 |
| **生成腳本** | `generate-test-data.sh` | ✅ | 自動化生成所有測試資料 |

## 🚀 快速開始

### 方法一：使用自動化腳本（推薦）

```bash
# 1. 確保資料庫服務正在運行
docker-compose up -d

# 2. 等待服務完全啟動
sleep 30

# 3. 執行自動化生成腳本
./generate-test-data.sh
```

### 方法二：個別生成測試資料

#### PostgreSQL
```bash
# 連接到 PostgreSQL 並執行測試資料
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -f postgresql-test-data.sql
```

#### MongoDB
```bash
# 連接到 MongoDB 並執行測試資料
docker-compose exec mongodb mongosh --file mongodb-test-data.js
```

#### Redis
```bash
# 執行 Redis 測試資料腳本
docker-compose exec redis sh redis-test-data.sh
```

#### MinIO
```bash
# 執行 MinIO 測試資料腳本
docker-compose exec minio sh minio-test-data.sh
```

#### Milvus
```bash
# 執行 Milvus 測試資料腳本
docker-compose exec milvus-standalone python3 milvus-test-data.py
```

#### ClickHouse
```bash
# 執行 ClickHouse 測試資料腳本
docker-compose exec clickhouse clickhouse-client --multiquery < clickhouse-test-data.sql
```

## 📊 測試資料詳細說明

### PostgreSQL 測試資料

**擴展內容：**
- **用戶資料**: 新增10個用戶（總計13個）
- **商品資料**: 新增20個商品（總計25個）
- **分類資料**: 新增5個主分類和13個子分類
- **訂單資料**: 新增10個訂單和對應的訂單項目
- **支付資料**: 新增10個支付記錄
- **物流資料**: 新增10個物流記錄
- **優惠券**: 新增6個優惠券
- **評論資料**: 新增10個商品評論
- **願望清單**: 新增10個用戶的願望清單
- **退貨資料**: 新增3個退貨申請
- **用戶行為**: 新增10個用戶行為事件
- **AI資料**: 新增用戶特徵、商品特徵、推薦、預測資料

**資料統計：**
- 用戶: 13個
- 商品: 25個
- 分類: 18個
- 訂單: 10個
- 支付: 10個
- 評論: 10個

### MongoDB 測試資料

**擴展內容：**
- **商品詳情**: 新增5個商品詳細描述
- **前端配置**: 新增2個頁面配置
- **系統日誌**: 新增5個系統日誌記錄
- **客服紀錄**: 新增3個客服對話記錄

**資料統計：**
- 商品詳情: 8個
- 前端配置: 3個
- 系統日誌: 8個
- 客服紀錄: 5個

### Redis 測試資料

**擴展內容：**
- **Session管理**: 新增3個用戶Session
- **JWT Token**: 新增3個JWT Token
- **購物車**: 新增3個購物車
- **熱門商品**: 新增3個分類的熱門商品
- **庫存快取**: 新增5個商品庫存
- **用戶行為**: 新增3個用戶瀏覽歷史
- **系統配置**: 新增行銷配置
- **限流安全**: 新增API限流和登入失敗計數
- **推薦系統**: 新增用戶推薦和商品相似度

**資料統計：**
- Session: 6個
- 購物車: 6個
- 熱門商品: 6個分類
- 庫存快取: 10個商品
- 推薦資料: 6個用戶

### MinIO 測試資料

**擴展內容：**
- **商品圖片**: 新增5個商品的圖片（主圖、圖庫、縮圖）
- **用戶頭像**: 新增5個用戶頭像
- **訂單發票**: 新增5個發票PDF
- **退貨證明**: 新增4個退貨證明圖片
- **系統資源**: 新增橫幅、分類、促銷圖片
- **商品影片**: 新增5個商品演示影片

**資料統計：**
- 商品圖片: 25個檔案
- 用戶頭像: 5個檔案
- 發票: 5個檔案
- 退貨證明: 4個檔案
- 系統資源: 10個檔案
- 商品影片: 5個檔案

### Milvus 測試資料

**擴展內容：**
- **商品向量**: 新增20個商品向量
- **用戶向量**: 新增10個用戶向量
- **搜尋歷史**: 新增20個搜尋記錄
- **推薦結果**: 新增30個推薦記錄
- **用戶行為**: 新增用戶行為集合和30個行為記錄
- **商品相似度**: 新增商品相似度集合和30個相似度記錄

**資料統計：**
- 商品向量: 25個
- 用戶向量: 13個
- 搜尋歷史: 25個
- 推薦結果: 40個
- 用戶行為: 30個
- 商品相似度: 30個

### ClickHouse 測試資料

**擴展內容：**
- **用戶行為事件**: 新增20個行為事件
- **銷售數據**: 新增16個銷售記錄
- **商品表現**: 新增15個商品表現記錄
- **用戶分析**: 新增9個用戶分析記錄
- **行銷活動**: 新增5個行銷活動
- **行銷效果**: 新增10個行銷效果記錄
- **庫存分析**: 新增15個庫存分析記錄
- **支付分析**: 新增12個支付分析記錄
- **物流分析**: 新增14個物流分析記錄
- **分析視圖**: 新增3個物化視圖
- **分析函數**: 新增3個分析函數

**資料統計：**
- 用戶行為事件: 25個
- 銷售數據: 16個
- 商品表現: 15個
- 用戶分析: 9個
- 行銷活動: 8個

## 🔍 驗證測試資料

### 自動驗證
```bash
# 執行自動化驗證
./generate-test-data.sh
```

### 手動驗證

#### PostgreSQL
```bash
# 檢查用戶數量
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM users;"

# 檢查商品數量
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM products;"

# 檢查訂單數量
docker-compose exec postgresql psql -U ecommerce_user -d ecommerce_db -c "SELECT COUNT(*) FROM orders;"
```

#### MongoDB
```bash
# 檢查商品詳情數量
docker-compose exec mongodb mongosh --quiet --eval "db.products_detail.countDocuments()"

# 檢查系統日誌數量
docker-compose exec mongodb mongosh --quiet --eval "db.system_logs.countDocuments()"

# 檢查客服紀錄數量
docker-compose exec mongodb mongosh --quiet --eval "db.customer_service_records.countDocuments()"
```

#### Redis
```bash
# 檢查鍵值數量
docker-compose exec redis redis-cli DBSIZE

# 檢查Session數量
docker-compose exec redis redis-cli KEYS "session:*" | wc -l

# 檢查購物車數量
docker-compose exec redis redis-cli KEYS "cart:*" | wc -l
```

#### MinIO
```bash
# 檢查商品圖片
docker-compose exec minio mc ls ecommerce/ecommerce-storage/products/6/

# 檢查用戶頭像
docker-compose exec minio mc ls ecommerce/ecommerce-storage/users/4/avatars/

# 檢查發票
docker-compose exec minio mc ls ecommerce/ecommerce-storage/orders/1004/invoices/
```

#### Milvus
```bash
# 檢查集合數量
docker-compose exec milvus-standalone python3 -c "
from pymilvus import connections, utility
connections.connect('default', host='localhost', port='19530')
print('集合數量:', len(utility.list_collections()))
"
```

#### ClickHouse
```bash
# 檢查用戶行為事件數量
docker-compose exec clickhouse clickhouse-client --query "SELECT COUNT(*) FROM user_behavior_events"

# 檢查銷售數據數量
docker-compose exec clickhouse clickhouse-client --query "SELECT COUNT(*) FROM sales_data"

# 檢查商品表現數量
docker-compose exec clickhouse clickhouse-client --query "SELECT COUNT(*) FROM product_performance"
```

## 🛠️ 故障排除

### 常見問題

1. **服務未啟動**
   ```bash
   # 檢查服務狀態
   docker-compose ps
   
   # 啟動服務
   docker-compose up -d
   ```

2. **連線失敗**
   ```bash
   # 檢查服務日誌
   docker-compose logs [service_name]
   
   # 重新啟動服務
   docker-compose restart [service_name]
   ```

3. **測試資料生成失敗**
   ```bash
   # 檢查腳本權限
   chmod +x *.sh *.py
   
   # 手動執行腳本
   ./[script_name]
   ```

4. **資料驗證失敗**
   ```bash
   # 檢查資料庫連線
   docker-compose exec [service] [connection_command]
   
   # 檢查資料是否存在
   docker-compose exec [service] [query_command]
   ```

### 重置測試資料

```bash
# 停止所有服務
docker-compose down

# 刪除所有資料卷
docker-compose down -v

# 重新啟動服務
docker-compose up -d

# 重新生成測試資料
./generate-test-data.sh
```

## 📝 開發建議

1. **開發環境**: 使用自動化腳本快速生成測試資料
2. **測試環境**: 根據需要選擇性生成特定資料庫的測試資料
3. **生產環境**: 不要使用測試資料，應使用真實資料

## 🔄 更新與維護

### 添加新測試資料
1. 編輯對應的測試資料檔案
2. 更新生成腳本
3. 執行驗證測試

### 定期清理
```bash
# 清理過期測試資料
docker-compose exec redis redis-cli FLUSHDB
docker-compose exec mongodb mongosh --eval "db.dropDatabase()"
```

## 📞 支援

如有問題，請檢查：
1. 服務日誌：`docker-compose logs [service_name]`
2. 網路連接：確保埠號未被占用
3. 資源限制：確保有足夠的記憶體和磁碟空間
4. 權限設定：檢查檔案權限和使用者權限
