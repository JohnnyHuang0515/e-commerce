const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Settings Service API',
      version: '1.0.0',
      description: '電商系統設定管理服務 API 文檔',
      contact: {
        name: 'Ecommerce Team',
        email: 'support@ecommerce.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3007',
        description: '開發環境'
      },
      {
        url: 'https://api.ecommerce.com/settings',
        description: '生產環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '請在 Authorization header 中提供 JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '錯誤訊息'
            },
            error: {
              type: 'string',
              example: '詳細錯誤資訊'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: '回應資料'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Settings',
        description: '設定管理相關 API'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
