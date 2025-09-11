const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// 中間件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試'
  }
});
app.use('/api/', limiter);

// 簡化的認證中間件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供認證令牌'
    });
  }

  try {
    // 嘗試解析 base64 編碼的模擬 token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // 檢查 token 是否過期
    if (decoded.exp && decoded.exp < Date.now()) {
      return res.status(401).json({
        success: false,
        message: '認證令牌已過期'
      });
    }

    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: ['read', 'write', 'admin']
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '無效的認證令牌'
    });
  }
};

// 簡化的登入端點
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  // 開發模式：使用硬編碼的管理員帳號
  if (email === 'admin@example.com' && password === 'Admin123') {
    const token = Buffer.from(JSON.stringify({
      userId: '1',
      email: 'admin@example.com',
      role: 'ADMIN',
      exp: Date.now() + 86400000 // 24小時後過期
    })).toString('base64');

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin',
          role: 'ADMIN',
          permissions: ['read', 'write', 'admin']
        },
        expiresIn: 86400 // 24 hours
      },
      message: '登入成功'
    });
  }

  // 其他用戶登入失敗
  return res.status(401).json({
    success: false,
    message: '郵箱或密碼錯誤'
  });
});

// 簡化的用戶端點
app.get('/api/v1/users/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      users: [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin',
          role: 'ADMIN',
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

// 簡化的商品端點
app.get('/api/v1/products/products', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      products: [
        {
          id: '1',
          name: '示例商品',
          price: 99.99,
          stock: 100,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

// 簡化的訂單端點
app.get('/api/v1/orders/orders', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      orders: [
        {
          id: '1',
          userId: '1',
          total: 99.99,
          status: 'completed',
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AUTH Service (Simple)',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databases: {
      postgresql: 'skipped (development mode)'
    }
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AUTH Service (Simple) - 簡化認證服務',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      health: '/health'
    }
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在',
    path: req.originalUrl
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('AUTH Service Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '內部服務器錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 AUTH Service (Simple) 啟動成功!');
  console.log('================================');
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`🔍 健康檢查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('🔗 API 端點:');
  console.log('   - 認證: /api/v1/auth');
  console.log('   - 用戶: /api/v1/users');
  console.log('   - 商品: /api/v1/products');
  console.log('   - 訂單: /api/v1/orders');
  console.log('================================');
});

module.exports = app;
