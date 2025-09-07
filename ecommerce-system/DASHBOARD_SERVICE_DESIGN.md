# 📊 Dashboard Service 技術設計文檔

## 📋 概述

Dashboard Service 是電商系統管理後台的核心組件，負責聚合多個微服務的數據，提供統一的儀表板介面。

## 🏗️ 系統架構

```
Dashboard Service (Port 3011)
├── 📊 數據聚合層
│   ├── Analytics Service (Port 3006)
│   ├── Settings Service (Port 3007)
│   ├── Order Service (Port 3003)
│   ├── User Service (Port 3002)
│   └── Product Service (Port 3001)
├── 🔄 快取層 (Redis)
├── 📈 數據處理層
└── 🌐 API 層
```

## 📊 數據模型設計

### 1. Dashboard 概覽數據模型
```javascript
const DashboardOverviewSchema = {
  summary: {
    totalSales: Number,
    totalOrders: Number,
    totalUsers: Number,
    totalProducts: Number,
    averageOrderValue: Number,
    conversionRate: Number
  },
  periods: {
    today: PeriodData,
    thisWeek: PeriodData,
    thisMonth: PeriodData
  },
  alerts: [AlertSchema],
  systemStatus: SystemStatusSchema
};

const PeriodDataSchema = {
  sales: Number,
  orders: Number,
  newUsers: Number,
  visitors: Number,
  growth: {
    sales: Number,
    orders: Number,
    users: Number
  }
};

const AlertSchema = {
  id: String,
  type: String, // low_stock, high_demand, system_error
  message: String,
  severity: String, // info, warning, error, critical
  timestamp: Date,
  action: String
};

const SystemStatusSchema = {
  overall: String, // healthy, warning, error
  services: {
    product: String,
    order: String,
    user: String,
    analytics: String,
    settings: String
  },
  lastUpdated: Date
};
```

### 2. 即時數據模型
```javascript
const RealtimeDataSchema = {
  current: {
    activeUsers: Number,
    pendingOrders: Number,
    processingOrders: Number,
    lowStockProducts: Number,
    systemLoad: Number
  },
  trends: {
    userActivity: TrendData,
    orderVolume: TrendData,
    revenue: TrendData
  },
  liveEvents: [LiveEventSchema],
  lastUpdated: Date
};

const TrendDataSchema = {
  current: Number,
  trend: String, // up, down, stable
  change: Number
};

const LiveEventSchema = {
  id: String,
  type: String, // new_order, new_user, system_alert
  message: String,
  timestamp: Date,
  amount: Number
};
```

### 3. 分析數據模型
```javascript
const AnalyticsDataSchema = {
  salesAnalytics: {
    trend: [SalesTrendSchema],
    topProducts: [TopProductSchema],
    topCategories: [TopCategorySchema]
  },
  userAnalytics: {
    growth: [UserGrowthSchema],
    demographics: DemographicsSchema,
    behavior: BehaviorSchema
  },
  performanceMetrics: {
    systemPerformance: SystemPerformanceSchema,
    businessMetrics: BusinessMetricsSchema
  }
};

const SalesTrendSchema = {
  date: Date,
  sales: Number,
  orders: Number,
  averageOrderValue: Number
};

const TopProductSchema = {
  productId: String,
  name: String,
  sales: Number,
  orders: Number,
  revenue: Number
};

const DemographicsSchema = {
  ageGroups: {
    "18-25": Number,
    "26-35": Number,
    "36-45": Number,
    "46+": Number
  },
  locations: {
    "台北市": Number,
    "新北市": Number,
    "桃園市": Number,
    "其他": Number
  }
};
```

## 🔧 技術實現策略

### 1. 數據聚合策略

#### 同步聚合 (適合小數據量)
```javascript
const getDashboardData = async () => {
  try {
    const [analytics, settings, orders, users, products] = await Promise.all([
      fetchAnalyticsData(),
      fetchSettingsData(),
      fetchOrdersData(),
      fetchUsersData(),
      fetchProductsData()
    ]);
    
    return aggregateData(analytics, settings, orders, users, products);
  } catch (error) {
    console.error('數據聚合失敗:', error);
    return getCachedData();
  }
};
```

#### 異步聚合 (適合大數據量)
```javascript
const getDashboardDataAsync = async () => {
  // 先返回快取數據
  const cachedData = await redis.get('dashboard:overview');
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // 異步更新數據
  updateDashboardDataInBackground();
  
  return getDefaultData();
};
```

### 2. 錯誤處理策略

#### 容錯設計
```javascript
const getDashboardData = async () => {
  const results = await Promise.allSettled([
    fetchAnalyticsData(),
    fetchSettingsData(),
    fetchOrdersData(),
    fetchUsersData(),
    fetchProductsData()
  ]);
  
  const data = {};
  const errors = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      data[serviceNames[index]] = result.value;
    } else {
      errors.push({
        service: serviceNames[index],
        error: result.reason.message
      });
      data[serviceNames[index]] = getDefaultDataForService(serviceNames[index]);
    }
  });
  
  return {
    data,
    errors,
    timestamp: new Date()
  };
};
```

### 3. 快取策略

#### 多層快取設計
```javascript
const cacheStrategy = {
  overview: { ttl: 300 },      // 5分鐘
  analytics: { ttl: 1800 },    // 30分鐘  
  settings: { ttl: 3600 },    // 1小時
  realtime: { ttl: 60 }       // 1分鐘
};

const getCachedData = async (key, ttl) => {
  const cached = await redis.get(`dashboard:${key}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchData(key);
  await redis.setex(`dashboard:${key}`, ttl, JSON.stringify(data));
  return data;
};
```

### 4. 性能優化

#### 數據預處理
```javascript
const preprocessData = (rawData) => {
  return {
    ...rawData,
    summary: calculateSummary(rawData),
    trends: calculateTrends(rawData),
    alerts: generateAlerts(rawData)
  };
};

const calculateSummary = (data) => {
  return {
    totalSales: data.orders.reduce((sum, order) => sum + order.total, 0),
    totalOrders: data.orders.length,
    totalUsers: data.users.length,
    totalProducts: data.products.length,
    averageOrderValue: calculateAverageOrderValue(data.orders),
    conversionRate: calculateConversionRate(data)
  };
};
```

## 🔄 服務整合

### 1. 服務健康檢查
```javascript
const checkServiceHealth = async () => {
  const services = [
    { name: 'product', url: 'http://localhost:3001/health' },
    { name: 'order', url: 'http://localhost:3003/health' },
    { name: 'user', url: 'http://localhost:3002/health' },
    { name: 'analytics', url: 'http://localhost:3006/health' },
    { name: 'settings', url: 'http://localhost:3007/health' }
  ];
  
  const healthChecks = await Promise.allSettled(
    services.map(service => 
      fetch(service.url, { timeout: 5000 })
        .then(res => res.json())
        .then(data => ({ name: service.name, status: data.status }))
    )
  );
  
  return healthChecks.map((result, index) => ({
    name: services[index].name,
    status: result.status === 'fulfilled' ? result.value.status : 'error'
  }));
};
```

### 2. 數據同步機制
```javascript
const syncDataFromServices = async () => {
  const syncTasks = [
    syncAnalyticsData(),
    syncOrderData(),
    syncUserData(),
    syncProductData(),
    syncSettingsData()
  ];
  
  const results = await Promise.allSettled(syncTasks);
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`同步失敗 ${serviceNames[index]}:`, result.reason);
    }
  });
  
  return results;
};
```

## 📊 監控告警

### 1. 性能監控
```javascript
const performanceMetrics = {
  responseTime: {
    threshold: 200, // ms
    alert: 'API 響應時間過長'
  },
  errorRate: {
    threshold: 5, // %
    alert: '錯誤率過高'
  },
  dataFreshness: {
    threshold: 300, // seconds
    alert: '數據過期'
  }
};
```

### 2. 業務監控
```javascript
const businessMetrics = {
  salesDrop: {
    threshold: -20, // %
    alert: '銷售額急劇下降'
  },
  orderVolume: {
    threshold: 0,
    alert: '無新訂單'
  },
  systemErrors: {
    threshold: 10,
    alert: '系統錯誤過多'
  }
};
```

## 🚀 部署考量

### 1. 容器化配置
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3011

CMD ["node", "src/app.js"]
```

### 2. 環境變數
```bash
# Dashboard Service 配置
DASHBOARD_PORT=3011
DASHBOARD_NODE_ENV=production

# 服務端點配置
ANALYTICS_SERVICE_URL=http://analytics-service:3006
SETTINGS_SERVICE_URL=http://settings-service:3007
ORDER_SERVICE_URL=http://order-service:3003
USER_SERVICE_URL=http://user-service:3002
PRODUCT_SERVICE_URL=http://product-service:3001

# Redis 配置
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password

# 快取配置
CACHE_TTL_OVERVIEW=300
CACHE_TTL_ANALYTICS=1800
CACHE_TTL_SETTINGS=3600
CACHE_TTL_REALTIME=60
```

### 3. 健康檢查配置
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3011/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 📈 擴展性考量

### 1. 水平擴展
- 使用負載均衡器
- 共享 Redis 快取
- 無狀態設計

### 2. 數據分片
- 按時間分片
- 按服務分片
- 按用戶分片

### 3. 微服務解耦
- 事件驅動架構
- 消息佇列
- API 網關

## 🔒 安全性考量

### 1. 認證授權
- JWT Token 驗證
- RBAC 權限控制
- API 金鑰管理

### 2. 數據安全
- 敏感數據加密
- 傳輸加密 (HTTPS)
- 存取日誌記錄

### 3. 輸入驗證
- 參數驗證
- SQL 注入防護
- XSS 防護

## 📋 開發時程

### 第一階段 (1-2 天)
- [ ] 專案結構建立
- [ ] 基本 API 框架
- [ ] 健康檢查端點

### 第二階段 (3-4 天)
- [ ] 數據聚合邏輯
- [ ] 快取機制
- [ ] 錯誤處理

### 第三階段 (5-6 天)
- [ ] 即時數據功能
- [ ] 報表生成
- [ ] 性能優化

### 第四階段 (7-8 天)
- [ ] 監控告警
- [ ] 文檔完善
- [ ] 測試驗證
