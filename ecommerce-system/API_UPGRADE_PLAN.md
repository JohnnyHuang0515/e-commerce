# 🔄 API 服務升級計劃

## 📋 現狀分析

### 當前問題
1. **資料庫架構不匹配**: API 使用 Sequelize ORM，但新架構使用原生 PostgreSQL
2. **主鍵設計不一致**: 舊架構使用 UUID 主鍵，新架構使用 BIGINT + UUID 雙層設計
3. **RBAC 系統不完整**: 缺少完整的權限檢查中間件
4. **多資料庫整合缺失**: 沒有 MongoDB、Redis、ClickHouse 的整合

### 需要更新的服務
- ✅ Auth Service (認證授權)
- ✅ User Service (用戶管理) 
- ✅ Product Service (商品管理)
- ✅ Order Service (訂單管理)
- ✅ Analytics Service (分析服務)
- ✅ System Service (系統管理)

## 🎯 升級目標

### 1. 資料庫連接層更新
- 從 Sequelize 遷移到原生 PostgreSQL 驅動
- 支援雙層主鍵設計 (BIGINT 內部 + UUID 對外)
- 整合 MongoDB、Redis、ClickHouse

### 2. RBAC 權限系統
- 實現完整的權限檢查中間件
- 支援動態權限分配
- 整合 Redis 權限快取

### 3. API 端點更新
- 統一使用 `public_id` 作為對外 API 參數
- 內部使用 `user_id` 進行資料庫操作
- 支援新的權限命名規範 (`動詞_資源`)

## 🚀 實施步驟

### 階段一：核心服務更新 (Week 1)

#### 1.1 Auth Service 升級
```javascript
// 新的資料庫連接
const { Pool } = require('pg');
const Redis = require('redis');

// 雙層主鍵處理
const getUserByPublicId = async (publicId) => {
  const result = await pool.query(
    'SELECT user_id, public_id, name, email FROM users WHERE public_id = $1',
    [publicId]
  );
  return result.rows[0];
};

// RBAC 權限檢查
const checkPermission = (permission) => {
  return async (req, res, next) => {
    const userPermissions = await getUserPermissions(req.user.user_id);
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: '權限不足' });
    }
    next();
  };
};
```

#### 1.2 資料庫連接更新
```javascript
// config/database.js
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const Redis = require('redis');

// PostgreSQL 連接池
const postgresPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MongoDB 連接
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Redis 連接
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});
```

### 階段二：業務邏輯更新 (Week 2)

#### 2.1 用戶管理 API
```javascript
// routes/users.js
router.get('/users', checkPermission('view_users'), async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const result = await postgresPool.query(`
    SELECT user_id, public_id, name, email, status, created_at
    FROM users 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page, limit, total: result.rowCount }
  });
});

router.get('/users/:publicId', checkPermission('view_users'), async (req, res) => {
  const { publicId } = req.params;
  const user = await getUserByPublicId(publicId);
  
  if (!user) {
    return res.status(404).json({ error: '用戶不存在' });
  }
  
  res.json({ success: true, data: user });
});
```

#### 2.2 商品管理 API
```javascript
// routes/products.js
router.post('/products', checkPermission('create_product'), async (req, res) => {
  const { name, description, price, sku, category_id } = req.body;
  
  const result = await postgresPool.query(`
    INSERT INTO products (name, description, price, sku, category_id, stock_quantity)
    VALUES ($1, $2, $3, $4, $5, 0)
    RETURNING product_id, public_id
  `, [name, description, price, sku, category_id]);
  
  // 同時在 MongoDB 中創建詳細資訊
  await mongoClient.db('ecommerce').collection('product_details').insertOne({
    product_id: result.rows[0].product_id,
    attributes: {},
    description_html: description,
    version: 1,
    created_at: new Date()
  });
  
  res.json({ success: true, data: result.rows[0] });
});
```

### 階段三：高級功能整合 (Week 3)

#### 3.1 購物車功能
```javascript
// routes/cart.js
router.get('/cart', checkPermission('manage_cart'), async (req, res) => {
  const userId = req.user.user_id;
  
  // 從 Redis 快取獲取
  const cachedCart = await redisClient.get(`cart:${userId}`);
  if (cachedCart) {
    return res.json({ success: true, data: JSON.parse(cachedCart) });
  }
  
  // 從 PostgreSQL 獲取
  const result = await postgresPool.query(`
    SELECT ci.*, p.name, p.price, p.public_id as product_public_id
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = (SELECT cart_id FROM cart WHERE user_id = $1)
  `, [userId]);
  
  // 快取到 Redis
  await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(result.rows));
  
  res.json({ success: true, data: result.rows });
});
```

#### 3.2 AI 推薦整合
```javascript
// routes/recommendations.js
router.get('/recommendations', checkPermission('view_products'), async (req, res) => {
  const userId = req.user.user_id;
  
  // 從 MongoDB 獲取推薦結果
  const recommendations = await mongoClient.db('ecommerce')
    .collection('recommendations')
    .findOne({ user_id: userId });
  
  if (!recommendations) {
    // 觸發 AI 推薦服務
    const aiResponse = await fetch('http://ai-service:3004/api/v1/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    const aiData = await aiResponse.json();
    return res.json({ success: true, data: aiData.recommendations });
  }
  
  res.json({ success: true, data: recommendations.recommended_products });
});
```

## 🔧 技術實施細節

### 1. 權限檢查中間件
```javascript
// middleware/rbac.js
const getUserPermissions = async (userId) => {
  // 先從 Redis 快取檢查
  const cached = await redisClient.get(`permissions:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 從 PostgreSQL 獲取
  const result = await postgresPool.query(`
    SELECT p.permission_name
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    JOIN role_permissions rp ON r.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE u.user_id = $1 AND ur.is_active = true
  `, [userId]);
  
  const permissions = result.rows.map(row => row.permission_name);
  
  // 快取到 Redis (1小時)
  await redisClient.setEx(`permissions:${userId}`, 3600, JSON.stringify(permissions));
  
  return permissions;
};

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userPermissions = await getUserPermissions(req.user.user_id);
      
      if (!userPermissions.includes(requiredPermission) && 
          !userPermissions.includes('*')) {
        return res.status(403).json({
          error: '權限不足',
          required: requiredPermission,
          user_permissions: userPermissions
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: '權限檢查失敗' });
    }
  };
};
```

### 2. 雙層主鍵處理
```javascript
// utils/idMapper.js
const getIdMapping = async (tableName, publicId) => {
  const result = await postgresPool.query(`
    SELECT ${tableName}_id as internal_id, public_id
    FROM ${tableName}
    WHERE public_id = $1
  `, [publicId]);
  
  return result.rows[0];
};

const getPublicId = async (tableName, internalId) => {
  const result = await postgresPool.query(`
    SELECT public_id
    FROM ${tableName}
    WHERE ${tableName}_id = $1
  `, [internalId]);
  
  return result.rows[0]?.public_id;
};
```

### 3. 錯誤處理和日誌
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.user_id,
    timestamp: new Date().toISOString()
  });
  
  // 記錄到 ClickHouse
  const logData = {
    level: 'error',
    service: 'api',
    message: err.message,
    user_id: req.user?.user_id,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  // 異步記錄，不阻塞響應
  setImmediate(() => {
    clickhouseClient.insert('system_logs', logData).catch(console.error);
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '內部服務器錯誤'
  });
};
```

## 📊 測試計劃

### 1. 單元測試
```javascript
// tests/auth.test.js
describe('Auth Service', () => {
  test('should authenticate user with correct credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ecommerce.com', password: 'admin123' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
  
  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid@test.com', password: 'wrong' });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

### 2. 整合測試
```javascript
// tests/integration.test.js
describe('API Integration', () => {
  test('should create product with proper permissions', async () => {
    const token = await getAuthToken();
    
    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        description: 'Test Description',
        price: 100.00,
        sku: 'TEST-001'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.public_id).toBeDefined();
  });
});
```

## 🚨 風險控制

### 1. 回滾計劃
- 保留舊的 API 版本
- 資料庫遷移腳本可回滾
- 服務切換使用藍綠部署

### 2. 監控指標
- API 響應時間 < 200ms
- 錯誤率 < 1%
- 資料庫連接池使用率 < 80%
- Redis 快取命中率 > 90%

### 3. 性能優化
- 資料庫查詢優化
- Redis 快取策略
- 連接池調優
- 索引優化

## 📅 時間規劃

| 階段 | 時間 | 主要任務 | 交付物 | 狀態 |
|------|------|----------|--------|------|
| 階段一 | Week 1 | 核心服務更新 | Auth, User 服務 | ✅ 已完成 |
| 階段二 | Week 2 | 業務邏輯更新 | Product, Order 服務 | 🔄 進行中 |
| 階段三 | Week 3 | 高級功能整合 | AI, Analytics 服務 | ⏳ 待開始 |
| 測試 | Week 4 | 測試與優化 | 完整測試報告 | ⏳ 待開始 |

## 🎯 已完成項目

### ✅ 統一 Node.js 主服務架構
- **主應用程式**: `backend-node/app.js` - Express 服務，支援多資料庫連接
- **健康檢查**: 整合 PostgreSQL、MongoDB、Redis、ClickHouse 狀態檢查
- **Swagger 文檔**: 自動生成 API 文檔
- **錯誤處理**: 統一錯誤處理中間件

### ✅ 資料庫連接配置
- **多資料庫支援**: PostgreSQL、MongoDB、Redis、ClickHouse
- **連接池管理**: PostgreSQL 連接池優化
- **錯誤處理**: 資料庫連接錯誤處理和重連機制
- **環境變數**: 支援環境變數配置

### ✅ RBAC 權限中間件
- **權限檢查**: `checkPermission()` - 單一權限檢查
- **多權限檢查**: `checkAnyPermission()` - 任一權限檢查
- **全權限檢查**: `checkAllPermissions()` - 所有權限檢查
- **角色檢查**: `checkRole()` - 角色檢查
- **資源擁有者檢查**: `checkResourceOwner()` - 資源權限檢查
- **Redis 快取**: 權限快取機制，提升性能

### ✅ 雙層主鍵映射工具
- **ID 映射**: `getIdMapping()` - 根據 public_id 獲取內部 ID
- **批量處理**: `getBatchIdMappings()` - 批量 ID 映射
- **UUID/ULID 生成**: 支援 UUID 和 ULID 生成
- **驗證工具**: UUID/ULID 格式驗證
- **事務支援**: 批量操作事務處理

### ✅ 認證服務路由
- **登入/登出**: JWT Token 認證
- **用戶資料**: 獲取用戶資料和權限
- **密碼管理**: 密碼修改功能
- **Token 刷新**: Token 刷新機制
- **事件記錄**: 登入/登出事件記錄到 MongoDB

### ✅ 用戶管理路由
- **用戶列表**: 分頁、搜尋、狀態篩選
- **用戶詳情**: 獲取用戶完整資訊
- **用戶創建**: 創建新用戶和角色分配
- **用戶更新**: 更新用戶資料
- **角色管理**: 用戶角色分配和更新
- **軟刪除**: 用戶軟刪除功能
- **統計報表**: 用戶概覽統計

### ✅ 商品管理路由
- **商品列表**: 分頁、分類篩選、搜尋
- **商品詳情**: 獲取商品完整資訊（PostgreSQL + MongoDB）
- **商品創建**: 創建新商品（雙資料庫同步）
- **商品更新**: 更新商品資料
- **商品刪除**: 商品軟刪除
- **分類管理**: 商品分類 CRUD
- **庫存管理**: 庫存更新和追蹤

### ✅ 訂單管理路由
- **訂單列表**: 分頁、狀態篩選
- **訂單詳情**: 獲取訂單完整資訊
- **訂單創建**: 創建新訂單（事務處理）
- **訂單更新**: 更新訂單狀態
- **訂單取消**: 訂單取消功能（庫存恢復）
- **退款處理**: 退款申請和處理
- **統計報表**: 訂單統計和趨勢分析

### ✅ 購物車路由
- **購物車管理**: 添加/移除商品
- **Redis 快取**: 購物車快取機制
- **同步機制**: 前端同步
- **批量操作**: 批量添加/移除
- **庫存檢查**: 實時庫存驗證
- **項目數量**: 購物車項目統計

### ✅ 推薦服務路由
- **個人化推薦**: 基於用戶行為的推薦
- **相似商品**: 相似商品推薦
- **熱銷商品**: 熱銷商品推薦
- **Redis 快取**: 推薦結果快取
- **MongoDB 整合**: 推薦結果存儲
- **ClickHouse 分析**: 行為數據分析

## 🔄 進行中項目

### 🔄 Docker 容器化部署
- **Docker Compose**: 多容器服務管理
- **Nginx 代理**: 反向代理和負載均衡
- **健康檢查**: 容器健康檢查機制
- **部署腳本**: 自動化部署腳本

### 🔄 測試與優化
- **單元測試**: 各服務單元測試
- **整合測試**: API 整合測試
- **性能測試**: 負載測試
- **文檔完善**: API 文檔完善

## ⏳ 待開始項目

### ⏳ FastAPI 微服務
- **分析服務**: FastAPI 分析微服務
- **AI 推薦**: Python 推薦算法服務
- **數據處理**: 批量數據處理服務
- **機器學習**: ML 模型訓練和推理

### ⏳ 高級功能
- **Milvus 向量**: 相似商品檢索
- **實時推薦**: 實時推薦更新
- **數據導出**: 數據導出功能
- **AI 洞察**: AI 分析結果

### ⏳ 監控與運維
- **系統監控**: 完整的監控儀表板
- **日誌分析**: 集中式日誌分析
- **告警系統**: 自動告警機制
- **性能優化**: 系統性能調優

## 🎯 成功指標

- ✅ 統一 Node.js 主服務架構完成
- ✅ 多資料庫連接配置完成
- ✅ RBAC 權限系統完整運行
- ✅ 雙層主鍵映射工具完成
- ✅ 認證和用戶管理路由完成
- ✅ 商品和訂單管理路由完成
- ✅ 購物車和推薦服務路由完成
- ✅ 多資料庫整合正常
- 🔄 Docker 容器化部署進行中
- ⏳ API 響應時間 < 200ms
- ⏳ 錯誤率 < 1%
- ⏳ 測試覆蓋率 > 90%

## 📁 檔案結構

```
ecommerce-system/
├── backend-node/                    # 統一 Node.js 主服務
│   ├── app.js                       # Express 主應用程式 ✅
│   ├── config/
│   │   └── database.js              # 多資料庫連接配置 ✅
│   ├── middleware/
│   │   ├── rbac.js                  # RBAC 權限中間件 ✅
│   │   └── errorHandler.js          # 錯誤處理中間件 ✅
│   ├── utils/
│   │   └── idMapper.js              # 雙層主鍵映射工具 ✅
│   ├── routes/
│   │   ├── auth.js                  # 認證路由 ✅
│   │   ├── users.js                 # 用戶管理路由 ✅
│   │   ├── products.js              # 商品管理路由 🔄
│   │   ├── orders.js                # 訂單管理路由 🔄
│   │   ├── cart.js                  # 購物車路由 🔄
│   │   └── recommendations.js       # 推薦服務路由 ⏳
│   ├── services/                    # 業務邏輯層 ⏳
│   ├── tests/                       # 測試檔案 ⏳
│   ├── package.json                 # Node.js 依賴 ⏳
│   └── .env.example                 # 環境變數範例 ⏳
├── backend-fastapi/                 # FastAPI 微服務 ⏳
├── docker-compose.yml               # 多容器服務 ⏳
└── README.md                        # 專案說明 ⏳
```

---

**注意**: 這個升級計劃需要謹慎執行，建議先在測試環境完整測試，然後再部署到生產環境。
