const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Import routes
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');

// MongoDB 連接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';

// 創建 Express 應用
const app = express();
const PORT = process.env.PORT || 3002; // Corrected port for product-service

// 中間件配置
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger API 文檔
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '電商系統 Product Service API 文檔'
}));

// API Routes
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/products', productRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Product Service - 商品管理服務',
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '請求的資源不存在'
    }
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('未處理的錯誤:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '伺服器內部錯誤'
    }
  });
});

// 啟動伺服器
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ PRODUCT-SERVICE: MongoDB 連線成功');
  app.listen(PORT, () => {
    console.log(`🚀 Product Service 啟動成功 on port ${PORT}`);
  });
}).catch((error) => {
  console.error('❌ MongoDB 連接錯誤:', error);
  process.exit(1);
});