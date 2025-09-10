const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '電商系統 User Service API',
      version: '1.0.0',
      description: '電商系統用戶管理服務 API 文檔',
      contact: {
        name: '電商系統團隊',
        email: 'team@ecommerce.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: '開發環境'
      },
      {
        url: 'https://api.ecommerce.com/user',
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
            message: {
              type: 'string',
              example: '操作成功'
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: '未授權',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '未授權存取',
                error: 'Token 無效或已過期'
              }
            }
          }
        },
        Forbidden: {
          description: '禁止存取',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '禁止存取',
                error: '權限不足'
              }
            }
          }
        },
        NotFound: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '資源不存在',
                error: '找不到指定的用戶'
              }
            }
          }
        },
        ValidationError: {
          description: '驗證錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '驗證錯誤',
                error: '請檢查輸入資料'
              }
            }
          }
        },
        InternalError: {
          description: '內部伺服器錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '內部伺服器錯誤',
                error: '請稍後再試'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
