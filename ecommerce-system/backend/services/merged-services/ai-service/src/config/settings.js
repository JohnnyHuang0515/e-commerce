module.exports = {
  // Milvus 向量資料庫配置
  milvus: {
    host: process.env.MILVUS_HOST || 'localhost',
    port: parseInt(process.env.MILVUS_PORT) || 19530,
    collectionName: process.env.MILVUS_COLLECTION_NAME || 'product_vectors',
    dimension: parseInt(process.env.MILVUS_DIMENSION) || 384,
    metricType: process.env.MILVUS_METRIC_TYPE || 'COSINE',
    indexType: process.env.MILVUS_INDEX_TYPE || 'IVF_FLAT',
    nlist: parseInt(process.env.MILVUS_NLIST) || 1024,
    token: process.env.MILVUS_TOKEN || '',
    database: process.env.MILVUS_DATABASE || 'default'
  },
  
  // AI 模型配置
  aiModel: {
    name: process.env.AI_MODEL_NAME || 'embedding-model',
    modelUrl: process.env.AI_MODEL_URL || '',
    cacheDir: process.env.AI_MODEL_CACHE_DIR || './models',
    device: process.env.AI_MODEL_DEVICE || 'auto',
    dimension: parseInt(process.env.AI_MODEL_DIMENSION) || 384
  },
  
  // 搜尋配置
  search: {
    defaultLimit: parseInt(process.env.SEARCH_DEFAULT_LIMIT) || 20,
    maxLimit: parseInt(process.env.SEARCH_MAX_LIMIT) || 100,
    similarityThreshold: parseFloat(process.env.SEARCH_SIMILARITY_THRESHOLD) || 0.7,
    cacheEnabled: process.env.SEARCH_CACHE_ENABLED === 'true',
    cacheTTL: parseInt(process.env.SEARCH_CACHE_TTL) || 3600
  },
  
  // 推薦配置
  recommendation: {
    defaultLimit: parseInt(process.env.RECOMMENDATION_DEFAULT_LIMIT) || 10,
    maxLimit: parseInt(process.env.RECOMMENDATION_MAX_LIMIT) || 50,
    collaborativeWeight: parseFloat(process.env.COLLABORATIVE_WEIGHT) || 0.6,
    contentWeight: parseFloat(process.env.CONTENT_WEIGHT) || 0.4,
    trendingWeight: parseFloat(process.env.TRENDING_WEIGHT) || 0.2,
    minBehaviorCount: parseInt(process.env.MIN_BEHAVIOR_COUNT) || 5,
    maxSimilarUsers: parseInt(process.env.MAX_SIMILAR_USERS) || 20
  },
  
  // Redis 快取配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    ttl: parseInt(process.env.REDIS_TTL) || 3600,
    enabled: process.env.REDIS_ENABLED === 'true'
  },
  
  // MongoDB 配置
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-ai',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT) || 5000
    }
  },
  
  // 日誌配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/ai-service.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },
  
  // 服務配置
  service: {
    port: parseInt(process.env.PORT) || 3004,
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15分鐘
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // 外部服務配置
  externalServices: {
    productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    timeout: parseInt(process.env.EXTERNAL_SERVICE_TIMEOUT) || 5000
  }
};
