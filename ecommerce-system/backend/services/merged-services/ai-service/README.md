# AI 服務 - 向量搜尋與推薦系統

基於 Milvus 向量資料庫的 AI 搜尋和推薦服務，提供語意搜尋、個人化推薦和智能分析功能。

## 🚀 功能特色

### 🔍 智能搜尋
- **語意搜尋**: 理解用戶意圖，而非僅關鍵字匹配
- **向量搜尋**: 基於 Milvus 的高性能向量相似度搜尋
- **多維過濾**: 支援分類、品牌、價格等多重過濾條件
- **搜尋建議**: 智能搜尋建議和熱門搜尋

### 🎯 個人化推薦
- **協同過濾**: 基於相似用戶行為的推薦
- **內容推薦**: 基於商品特徵的相似性推薦
- **混合推薦**: 結合多種算法的智能推薦
- **實時更新**: 動態調整推薦策略

### 📊 智能分析
- **用戶行為分析**: 深度分析用戶偏好模式
- **推薦效果評估**: CTR、轉換率等關鍵指標
- **搜尋分析**: 搜尋熱點和趨勢分析

## 🏗️ 技術架構

### 核心技術棧
- **向量資料庫**: Milvus 2.3.0
- **AI 模型**: TensorFlow.js + 自定義嵌入模型
- **後端框架**: Express.js
- **資料庫**: MongoDB + Redis
- **容器化**: Docker + Docker Compose

### 服務架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端應用      │    │   API Gateway   │    │   AI 服務       │
│                 │───▶│                 │───▶│                 │
│  React/Vue      │    │   Express       │    │  Search + Rec   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐              │
                       │   Milvus        │◀─────────────┘
                       │   向量資料庫    │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   行為資料      │
                       └─────────────────┘
```

## 📦 快速開始

### 環境要求
- Node.js 18+
- Docker & Docker Compose
- 8GB+ RAM (推薦)

### 1. 克隆專案
```bash
git clone <repository-url>
cd ai-service
```

### 2. 環境配置
```bash
# 複製環境變數模板
cp env.example .env

# 編輯環境變數
vim .env
```

### 3. 使用 Docker Compose 啟動
```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f ai-service
```

### 4. 手動安裝 (開發環境)
```bash
# 安裝依賴
npm install

# 創建必要目錄
mkdir -p logs models

# 啟動 Milvus (需要單獨安裝)
# 參考: https://milvus.io/docs/install_standalone-docker.md

# 啟動服務
npm run dev
```

## 🔧 API 使用指南

### 搜尋 API

#### 語意搜尋商品
```http
POST /api/v1/search
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "紅色運動鞋",
  "limit": 20,
  "threshold": 0.7,
  "filters": {
    "category": "鞋類",
    "price_min": 100,
    "price_max": 500
  }
}
```

#### 索引商品
```http
POST /api/v1/search/index
Content-Type: application/json
Authorization: Bearer <token>

{
  "id": "product_123",
  "name": "Nike Air Max 270",
  "description": "舒適的運動鞋，適合日常穿著",
  "category": "運動鞋",
  "brand": "Nike",
  "price": 299.99,
  "tags": ["運動", "舒適", "時尚"],
  "image_url": "https://example.com/image.jpg"
}
```

### 推薦 API

#### 個人化推薦
```http
GET /api/v1/recommendations?type=hybrid&limit=10
Authorization: Bearer <token>
```

#### 相似商品推薦
```http
GET /api/v1/recommendations/similar?item_id=product_123&limit=5
Authorization: Bearer <token>
```

## 📈 性能優化

### 向量搜尋優化
- **索引策略**: IVF_FLAT 索引，平衡精度和速度
- **批量處理**: 支援批量索引和搜尋
- **快取機制**: Redis 快取熱門搜尋結果
- **並行處理**: 多線程向量計算

### 推薦算法優化
- **增量學習**: 實時更新用戶偏好模型
- **A/B 測試**: 支援多種推薦策略對比
- **冷啟動處理**: 新用戶和新商品推薦策略
- **多樣性控制**: 避免推薦結果過於集中

## 🔍 監控與維護

### 健康檢查
```bash
# 服務健康狀態
curl http://localhost:3004/health

# Milvus 狀態
curl http://localhost:3004/api/v1/search/stats
```

### 日誌管理
```bash
# 查看服務日誌
tail -f logs/ai-service.log

# 查看錯誤日誌
tail -f logs/error.log
```

### 性能監控
- **搜尋延遲**: 平均 < 100ms
- **推薦延遲**: 平均 < 200ms
- **向量索引**: 支援百萬級商品
- **併發處理**: 支援 1000+ QPS

## 🛠️ 開發指南

### 專案結構
```
ai-service/
├── src/
│   ├── config/          # 配置管理
│   ├── controllers/     # API 控制器
│   ├── models/          # 資料模型
│   ├── services/        # 業務邏輯
│   ├── routes/          # 路由定義
│   ├── middleware/      # 中間件
│   ├── utils/           # 工具函數
│   └── app.js           # 應用入口
├── logs/                # 日誌文件
├── models/              # AI 模型緩存
├── docker-compose.yml   # Docker 編排
├── Dockerfile           # Docker 鏡像
└── package.json         # 依賴管理
```

### 添加新功能
1. **新增搜尋類型**: 在 `VectorSearchService` 中添加
2. **新增推薦算法**: 在 `VectorRecommendationService` 中實現
3. **新增 API 端點**: 在 `routes/` 中定義路由
4. **新增資料模型**: 在 `models/` 中定義 Schema

### 測試
```bash
# 運行測試
npm test

# 測試覆蓋率
npm run test:coverage

# 端到端測試
npm run test:e2e
```

## 🚀 部署指南

### 生產環境部署
```bash
# 構建生產鏡像
docker build -t ai-service:latest .

# 使用 Docker Compose 部署
docker-compose -f docker-compose.prod.yml up -d

# 設置環境變數
export NODE_ENV=production
export MILVUS_HOST=your-milvus-host
export REDIS_HOST=your-redis-host
```

### 擴展配置
- **水平擴展**: 支援多實例負載均衡
- **垂直擴展**: 根據數據量調整 Milvus 配置
- **快取策略**: Redis 集群配置
- **監控告警**: Prometheus + Grafana

## 📚 相關文檔

- [Milvus 官方文檔](https://milvus.io/docs)
- [TensorFlow.js 指南](https://www.tensorflow.org/js)
- [Express.js 最佳實踐](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB 性能優化](https://docs.mongodb.com/manual/core/performance/)

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 📞 支援

如有問題或建議，請：
- 提交 [Issue](https://github.com/your-org/ai-service/issues)
- 發送郵件至: ai-team@yourcompany.com
- 查看 [Wiki](https://github.com/your-org/ai-service/wiki) 獲取更多資訊
