const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '電商系統 Auth Service API',
      version: '1.0.0',
      description: '電商系統認證服務 API 文檔',
      contact: {
        name: '電商系統團隊',
        email: 'team@ecommerce.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '開發環境'
      },
      {
        url: 'https://api.ecommerce.com',
        description: '生產環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', description: '錯誤代碼' },
                message: { type: 'string', description: '錯誤訊息' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { field: { type: 'string' }, message: { type: 'string' } }
                  }
                }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object', description: '回應資料' },
            message: { type: 'string', description: '成功訊息' }
          }
        }
      },
      responses: {
        Unauthorized: { description: '未授權', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        Forbidden: { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        ValidationError: { description: '驗證錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        InternalError: { description: '伺服器內部錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
      }
    }
  },
  apis: ['./src/routes/*.js'] // 指定 API 路由檔案
};

const specs = swaggerJsdoc(options);

module.exports = specs;
