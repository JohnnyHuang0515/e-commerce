const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 連接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 連接錯誤:'));
db.once('open', () => {
  console.log('✅ MongoDB 連接成功');
});

// 商品模型
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  imageUrls: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時間中間件
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);

// 分類模型
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Category = mongoose.model('Category', categorySchema);

// Swagger API 文檔
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '電商系統 Product Service API 文檔'
}));

// 路由
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
 *                   example: product-service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

// 商品 API 路由
/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: 取得商品列表
 *     description: 取得所有商品，支援分頁、搜尋和篩選
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每頁數量
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 分類 ID 篩選
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 狀態篩選
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *     responses:
 *       200:
 *         description: 成功取得商品列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
app.get('/api/v1/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (category) {
      query.categoryId = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('取得商品列表錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '取得商品列表時發生錯誤'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: 取得商品詳情
 *     description: 根據商品 ID 取得單一商品詳細資訊
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
 *     responses:
 *       200:
 *         description: 成功取得商品詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '商品不存在'
        }
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('取得商品詳情錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '取得商品詳情時發生錯誤'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: 新增商品
 *     description: 建立新的商品
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: 商品名稱
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 description: 商品描述
 *               price:
 *                 type: number
 *                 description: 商品價格
 *                 minimum: 0
 *               categoryId:
 *                 type: string
 *                 description: 分類 ID
 *               stock:
 *                 type: number
 *                 description: 庫存數量
 *                 minimum: 0
 *                 default: 0
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 商品狀態
 *                 default: inactive
 *               attributes:
 *                 type: object
 *                 description: 商品屬性
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 商品圖片 URL 列表
 *     responses:
 *       201:
 *         description: 商品建立成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: 商品建立成功
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
app.post('/api/v1/products', async (req, res) => {
  try {
    const { name, description, price, categoryId, stock, attributes, images } = req.body;
    
    // 驗證必填欄位
    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '必填欄位不能為空',
          details: [
            { field: 'name', message: '商品名稱是必填欄位' },
            { field: 'description', message: '商品描述是必填欄位' },
            { field: 'price', message: '商品價格是必填欄位' },
            { field: 'categoryId', message: '商品分類是必填欄位' }
          ]
        }
      });
    }
    
    // 檢查分類是否存在
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '指定的分類不存在'
        }
      });
    }
    
    const product = new Product({
      name,
      description,
      price,
      categoryId,
      stock: stock || 0,
      attributes: attributes || {},
      images: images || []
    });
    
    await product.save();
    
    res.status(201).json({
      success: true,
      data: product,
      message: '商品建立成功'
    });
  } catch (error) {
    console.error('建立商品錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '建立商品時發生錯誤'
      }
    });
  }
});

app.put('/api/v1/products/:id', async (req, res) => {
  try {
    const { name, description, price, categoryId, stock, status, attributes, images } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '商品不存在'
        }
      });
    }
    
    // 更新欄位
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '指定的分類不存在'
          }
        });
      }
      product.categoryId = categoryId;
    }
    if (stock !== undefined) product.stock = stock;
    if (status) product.status = status;
    if (attributes) product.attributes = attributes;
    if (images) product.images = images;
    
    await product.save();
    
    res.json({
      success: true,
      data: product,
      message: '商品更新成功'
    });
  } catch (error) {
    console.error('更新商品錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新商品時發生錯誤'
      }
    });
  }
});

app.delete('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '商品不存在'
        }
      });
    }
    
    res.json({
      success: true,
      message: '商品刪除成功'
    });
  } catch (error) {
    console.error('刪除商品錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '刪除商品時發生錯誤'
      }
    });
  }
});

// 分類 API 路由
app.get('/api/v1/categories', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parentId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('取得分類列表錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '取得分類列表時發生錯誤'
      }
    });
  }
});

app.post('/api/v1/categories', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '分類名稱是必填欄位'
        }
      });
    }
    
    const category = new Category({
      name,
      parentId: parentId || null
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category,
      message: '分類建立成功'
    });
  } catch (error) {
    console.error('建立分類錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '建立分類時發生錯誤'
      }
    });
  }
});

// 錯誤處理中間件
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

// 404 處理 - 移除有問題的路由語法
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '請求的資源不存在'
    }
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Product Service 啟動成功`);
  console.log(`📡 服務地址: http://localhost:${PORT}`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api/v1/products`);
});
