const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const { initializeBuckets, testConnection } = require('./config/minio');
const imageRoutes = require('./routes/image');

const app = express();
const PORT = process.env.PORT || 3008;

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MinIO 圖片存儲服務 API',
      version: '1.0.0',
      description: '電商系統圖片存儲微服務 API 文檔',
      contact: {
        name: 'Ecommerce Team',
        email: 'team@ecommerce.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '開發環境'
      }
    ],
    tags: [
      {
        name: 'Images',
        description: '圖片管理相關 API'
      },
      {
        name: 'Health',
        description: '健康檢查相關 API'
      }
    ],
    components: {
      responses: {
        ValidationError: {
          description: '驗證錯誤',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'VALIDATION_ERROR'
                      },
                      message: {
                        type: 'string',
                        example: '請求參數錯誤'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        NotFound: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'NOT_FOUND'
                      },
                      message: {
                        type: 'string',
                        example: '請求的資源不存在'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        InternalError: {
          description: '服務器內部錯誤',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'INTERNAL_ERROR'
                      },
                      message: {
                        type: 'string',
                        example: '服務器內部錯誤'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);

// 中間件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB 連接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 連接錯誤:'));
db.once('open', async () => {
  console.log('✅ MongoDB 連接成功');
  
  // 測試 MinIO 連接
  const minioConnected = await testConnection();
  if (minioConnected) {
    // 初始化存儲桶
    await initializeBuckets();
  }
});

// Swagger API 文檔
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MinIO 圖片存儲服務 API 文檔'
}));

// 健康檢查
/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康檢查
 *     description: 檢查服務是否正常運行
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服務正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: minio-service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 minio:
 *                   type: boolean
 *                   description: MinIO 連接狀態
 *                 mongodb:
 *                   type: boolean
 *                   description: MongoDB 連接狀態
 */
app.get('/api/v1/health', async (req, res) => {
  const minioStatus = await testConnection();
  const mongodbStatus = mongoose.connection.readyState === 1;
  
  res.json({
    status: 'healthy',
    service: 'minio-service',
    timestamp: new Date().toISOString(),
    minio: minioStatus,
    mongodb: mongodbStatus
  });
});

// API 路由
app.use('/api/v1/images', imageRoutes);

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('未處理的錯誤:', err);
  
  // Multer 錯誤處理
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: '文件大小超過限制'
      }
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOO_MANY_FILES',
        message: '文件數量超過限制'
      }
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UNEXPECTED_FILE',
        message: '意外的文件字段'
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服務器內部錯誤'
    }
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '請求的資源不存在'
    }
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🚀 MinIO Service 啟動成功`);
  console.log(`📡 服務地址: http://localhost:${PORT}`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
});
