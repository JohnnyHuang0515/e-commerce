const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '電商系統 Product Service API',
      version: '1.0.0',
      description: '電商系統商品服務 API 文檔',
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
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'description', 'price', 'categoryId'],
          properties: {
            _id: {
              type: 'string',
              description: '商品唯一識別碼'
            },
            name: {
              type: 'string',
              description: '商品名稱',
              maxLength: 255
            },
            description: {
              type: 'string',
              description: '商品描述'
            },
            price: {
              type: 'number',
              description: '商品價格',
              minimum: 0
            },
            categoryId: {
              type: 'string',
              description: '分類 ID'
            },
            stock: {
              type: 'number',
              description: '庫存數量',
              minimum: 0,
              default: 0
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: '商品狀態',
              default: 'inactive'
            },
            attributes: {
              type: 'object',
              description: '商品屬性'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '商品圖片 URL 列表'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '建立時間'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新時間'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            _id: {
              type: 'string',
              description: '分類唯一識別碼'
            },
            name: {
              type: 'string',
              description: '分類名稱',
              maxLength: 100
            },
            parentId: {
              type: 'string',
              description: '父分類 ID',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '建立時間'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新時間'
            }
          }
        },
        Error: {
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
                  description: '錯誤代碼'
                },
                message: {
                  type: 'string',
                  description: '錯誤訊息'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string'
                      },
                      message: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
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
            },
            message: {
              type: 'string',
              description: '成功訊息'
            },
            meta: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer'
                },
                limit: {
                  type: 'integer'
                },
                total: {
                  type: 'integer'
                },
                totalPages: {
                  type: 'integer'
                }
              }
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
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
              }
            }
          }
        },
        InternalError: {
          description: '伺服器內部錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/app.js'] // 指定 API 路由檔案
};

const specs = swaggerJsdoc(options);

module.exports = specs;
