# ADR-002: 資料庫技術選型

---

**狀態 (Status):** 已接受 (Accepted)

**決策者 (Deciders):** 電商系統架構師、資料庫專家、開發團隊負責人

**日期 (Date):** 2025-01-03

---

## 1. 背景與問題陳述 (Context and Problem Statement)

在微服務架構下，我們需要為不同的服務選擇合適的資料庫技術。電商系統涉及多種類型的資料：

*   **結構化交易資料：** 訂單、支付記錄、用戶資料等，需要 ACID 特性保證資料一致性
*   **商品目錄資料：** 商品資訊、分類、屬性等，讀多寫少，需要支援複雜查詢
*   **會話和快取資料：** 用戶會話、購物車、熱門商品等，需要高性能讀寫
*   **日誌和分析資料：** 用戶行為、系統日誌等，需要支援大量寫入和分析查詢

我們需要選擇合適的資料庫技術來滿足不同的資料需求，同時考慮：
- 資料一致性要求
- 性能和擴展性需求
- 開發和維護成本
- 團隊技術能力

## 2. 考量的選項 (Considered Options)

### 選項一：單一 MySQL 資料庫
*   **描述：** 所有服務共用一個 MySQL 資料庫，不同服務使用不同的資料庫 schema
*   **優點 (Pros)：**
    *   技術棧簡單，團隊熟悉度高
    *   運維成本低，只需要維護一種資料庫
    *   事務處理簡單，支援跨表事務
    *   備份和恢復策略統一
*   **缺點 (Cons)：**
    *   違反微服務的資料獨立性原則
    *   單點故障風險
    *   不同服務的資料需求差異大，難以優化
    *   擴展性受限，無法針對不同服務進行優化
    *   服務間耦合度高

### 選項二：PostgreSQL + Redis 組合
*   **描述：** 使用 PostgreSQL 作為主要關聯式資料庫，Redis 作為快取和會話儲存
*   **優點 (Pros)：**
    *   PostgreSQL 功能強大，支援 JSON、全文搜尋等進階功能
    *   ACID 特性完整，適合交易資料
    *   Redis 高性能，適合快取和會話資料
    *   開源免費，無授權成本
    *   社群支援良好
*   **缺點 (Cons)：**
    *   需要維護兩種不同的資料庫技術
    *   PostgreSQL 在超大規模下的水平擴展較複雜
    *   需要處理 Redis 的資料持久化問題

### 選項三：多資料庫混合架構
*   **描述：** 根據不同服務的需求選擇不同的資料庫：PostgreSQL（交易資料）、MongoDB（商品目錄）、Redis（快取）、Elasticsearch（搜尋）
*   **優點 (Pros)：**
    *   每個服務可以選擇最適合的資料庫技術
    *   性能優化空間大
    *   符合微服務的資料獨立性原則
    *   支援不同的資料模型和查詢需求
*   **缺點 (Cons)：**
    *   技術複雜度高，需要維護多種資料庫
    *   運維成本高
    *   團隊學習成本高
    *   資料一致性處理複雜

## 3. 決策 (Decision Outcome)

**最終選擇的方案：** 選項三：多資料庫混合架構

**選擇理由 (Rationale):**

1. **AI/ML 驅動的資料需求多樣性：** 智能電商系統需要處理多種類型的資料：
   - 結構化交易資料：訂單、支付、用戶資料
   - 半結構化商品資料：商品屬性、分類、標籤
   - 向量資料：商品 embedding、用戶行為 embedding
   - 時序資料：用戶行為日誌、銷售趨勢
   - 分析資料：營運報表、預測結果

2. **各資料庫的專業優勢：**
   - **MongoDB/PostgreSQL**: 靈活的商品資料結構，支援 JSON 和複雜查詢
   - **PostgreSQL/MySQL**: ACID 特性保證交易資料一致性
   - **Milvus/Pinecone**: 專業向量搜尋，支援 AI 推薦和語意搜尋
   - **ClickHouse**: 高效能時序資料分析，支援即時營運分析
   - **Redis**: 高速快取和會話管理
   - **Kafka**: 即時資料流處理，支援 AI 模型即時更新

3. **AI 功能的特殊需求：**
   - 語意搜尋需要向量資料庫支援相似度計算
   - 推薦系統需要快速存取用戶行為向量
   - 營運分析需要大量歷史資料的快速聚合查詢
   - 異常偵測需要即時資料流分析

4. **性能最佳化：**
   - 每種資料庫都針對特定用途進行最佳化
   - 避免單一資料庫成為系統瓶頸
   - 支援不同服務的獨立擴展需求

5. **未來擴展考量：**
   - 支援新的 AI 功能快速接入
   - 資料倉儲支援複雜的商業智能分析
   - 向量資料庫支援多模態搜尋（文字、圖像）

## 4. 決策的後果與影響 (Consequences)

*   **正面影響 / 預期收益：**
    *   滿足電商系統的主要資料需求
    *   保持相對簡單的技術棧，降低學習和維護成本
    *   PostgreSQL 的 JSON 支援提供了良好的靈活性
    *   Redis 的高性能提升了系統整體響應速度
    *   開源方案降低了授權成本

*   **負面影響 / 需要注意的風險：**
    *   PostgreSQL 在超大規模下的水平擴展需要額外設計
    *   Redis 的記憶體成本較高
    *   需要處理兩種資料庫的備份和恢復策略
    *   資料一致性需要在應用層面處理

*   **對其他組件/團隊的影響：**
    *   開發團隊需要學習 PostgreSQL 的進階功能
    *   運維團隊需要建立 PostgreSQL 和 Redis 的監控和維護流程
    *   需要建立資料備份和災難恢復策略

*   **未來可能需要重新評估的觸發條件：**
    *   當資料量超過 PostgreSQL 的處理能力時
    *   當搜尋需求變得複雜，需要引入 Elasticsearch 時
    *   當需要處理大量分析查詢，需要引入資料倉庫時
    *   當 Redis 的記憶體成本變得過高時

## 5. 執行計畫概要 (Implementation Plan Outline)

1. **第一階段：** 建立 PostgreSQL 和 Redis 的基礎環境
2. **第二階段：** 設計各服務的資料庫 schema
3. **第三階段：** 實現資料存取層 (Repository Pattern)
4. **第四階段：** 建立備份和監控策略
5. **第五階段：** 性能調優和擴展性測試

## 6. 資料庫分配策略 (Database Allocation Strategy)

### ⚠️ 當前實現狀況 (Current Implementation Status)

**重要問題**: 當前所有服務都使用 MongoDB，這與設計不符！

| 服務 | 設計資料庫 | 實際資料庫 | 快取/輔助 | 資料特性 | 狀態 | 備註 |
|------|------------|------------|-----------|----------|------|------|
| 商品服務 | MongoDB | ✅ MongoDB | Redis | 半結構化，屬性多變 | ✅ 正確 | JSON 靈活儲存商品屬性 |
| 訂單服務 | PostgreSQL | ❌ MongoDB | Redis | 強一致性，交易資料 | ❌ 需修正 | 應該用 PostgreSQL |
| 會員服務 | PostgreSQL | ❌ MongoDB | Redis | 用戶資料，行為追蹤 | ❌ 需修正 | 應該用 PostgreSQL |
| 支付服務 | PostgreSQL | ❌ MongoDB | - | 金融資料，最高安全性 | ❌ 需修正 | 應該用 PostgreSQL |
| 權限服務 | PostgreSQL | ❌ MongoDB | Redis | 權限、角色資料 | ❌ 需修正 | 應該用 PostgreSQL |
| 設定服務 | PostgreSQL | ❌ MongoDB | Redis | 系統設定、配置 | ❌ 需修正 | 應該用 PostgreSQL |
| AI 搜尋服務 | Milvus/Pinecone | ❌ 未實現 | Redis | 向量資料，相似度計算 | ❌ 未實現 | 需要向量資料庫 |
| AI 推薦服務 | Milvus/Pinecone | ❌ 未實現 | Redis | 用戶行為向量 | ❌ 未實現 | 需要向量資料庫 |
| AI 分析服務 | ClickHouse | ❌ MongoDB | Redis | 時序資料，大量聚合 | ❌ 需修正 | 應該用 ClickHouse |
| 行為日誌 | Kafka → ClickHouse | ❌ 未實現 | Redis | 即時流資料 | ❌ 未實現 | 需要消息佇列 |
| 資料倉儲 | Snowflake/BigQuery | ❌ 未實現 | - | 歷史資料，複雜分析 | ❌ 未實現 | 需要資料倉儲 |

### 🎯 目標架構 (Target Architecture)

**正確的資料庫分配策略**:

| 服務類型 | 資料庫選擇 | 理由 |
|----------|------------|------|
| **結構化交易資料** | PostgreSQL | ACID 特性、關係型查詢、數據完整性 |
| **非結構化商品資料** | MongoDB | 靈活的 JSON 結構、商品屬性多變 |
| **向量搜尋資料** | Milvus/Pinecone | 專業向量搜尋、AI 推薦 |
| **時序分析資料** | ClickHouse | 高效能分析、大量聚合查詢 |
| **快取和會話** | Redis | 高性能、即時存取 |
| **消息流** | Kafka | 即時數據流、事件驅動 |

## 7. 架構修正計劃 (Architecture Refactoring Plan)

### 階段 1: 添加 PostgreSQL 服務
- [ ] 在 docker-compose.yml 中添加 PostgreSQL 服務
- [ ] 配置 PostgreSQL 環境變數和連接字串
- [ ] 創建數據庫初始化腳本和 schema
- [ ] 設置 PostgreSQL 備份和監控

### 階段 2: 遷移服務到 PostgreSQL
- [ ] **User Service**: Mongoose → Sequelize/TypeORM
- [ ] **Order Service**: Mongoose → Sequelize/TypeORM  
- [ ] **Permission Service**: Mongoose → Sequelize/TypeORM
- [ ] **Auth Service**: Mongoose → Sequelize/TypeORM
- [ ] **Settings Service**: Mongoose → Sequelize/TypeORM
- [ ] **Payment Service**: Mongoose → Sequelize/TypeORM
- [ ] **Logistics Service**: Mongoose → Sequelize/TypeORM
- [ ] **Inventory Service**: Mongoose → Sequelize/TypeORM

### 階段 3: 保留 MongoDB 服務
- [ ] **Product Service**: 繼續使用 MongoDB (適合商品數據)
- [ ] **Analytics Service**: 繼續使用 MongoDB (適合分析數據)
- [ ] **MinIO Service**: 繼續使用 MongoDB (適合文件元數據)

### 階段 4: 實現 AI 服務資料庫
- [ ] 添加 Milvus/Pinecone 向量資料庫
- [ ] 添加 ClickHouse 時序資料庫
- [ ] 添加 Kafka 消息佇列
- [ ] 實現 AI 搜尋和推薦服務

### 階段 5: 數據遷移和測試
- [ ] 創建數據遷移腳本
- [ ] 備份現有數據
- [ ] 執行數據遷移
- [ ] 驗證數據完整性
- [ ] 更新 API 測試
- [ ] 更新前端集成測試

### 📝 修正理由
1. **數據一致性**: PostgreSQL 的 ACID 特性更適合交易數據
2. **查詢性能**: 關係型查詢在用戶、訂單、權限方面更高效
3. **數據完整性**: 外鍵約束確保數據關係正確
4. **擴展性**: PostgreSQL 在複雜查詢和報表方面更強
5. **標準化**: 符合企業級應用的數據庫選擇標準

### ⚠️ 注意事項
- 數據遷移期間需要停機維護
- 需要更新所有相關的 API 文檔
- 前端可能需要調整數據格式
- 需要重新設計數據備份策略
- 團隊需要學習 PostgreSQL 和相關 ORM

## 8. 相關參考 (References)

*   PostgreSQL 官方文檔
*   Redis 官方文檔
*   Microservices Data Management Patterns
*   Database per Service Pattern

---
---
**ADR 審核與簽署 (Sign-off):**

| 角色 | 姓名/團隊 | 簽署日期 | 備註 |
| :--------------- | :-------- | :--------- | :------- |
| 主要架構師 | 電商系統架構師 | 2025-01-03 | 同意採用多資料庫混合架構 |
| 資料庫專家 | 資料庫團隊 | 2025-01-03 | 同意，此方案能應對多樣的資料需求 |
| 開發團隊負責人 | 開發團隊 | 2025-01-03 | 同意，需要為團隊安排多種資料庫技術的培訓 |
| 架構師 | 電商系統架構師 | 2025-09-06 | 更新：發現當前實現與設計不符，需要修正 |
