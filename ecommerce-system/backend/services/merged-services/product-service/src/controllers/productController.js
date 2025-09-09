const { Product, Category } = require('../models');
const { Op } = require('sequelize');

// 獲取商品列表
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 搜尋條件
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 分類篩選
    if (category) {
      whereClause.category_id = category;
    }

    // 狀態篩選
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取商品列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取商品列表時發生錯誤'
    });
  }
};

// 獲取商品詳情
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('獲取商品詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取商品詳情時發生錯誤'
    });
  }
};

// 創建新商品
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, status = 'active', images = [] } = req.body;

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category_id,
      status,
      images
    });

    res.status(201).json({
      success: true,
      message: '商品創建成功',
      data: product
    });
  } catch (error) {
    console.error('創建商品錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建商品時發生錯誤'
    });
  }
};

// 更新商品
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = { ...req.body };

    const [updatedRowsCount] = await Product.update(updateData, {
      where: { id: productId }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: '商品更新成功',
      data: product
    });
  } catch (error) {
    console.error('更新商品錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新商品時發生錯誤'
    });
  }
};

// 刪除商品
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedRowsCount = await Product.destroy({
      where: { id: productId }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
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
      message: '刪除商品時發生錯誤'
    });
  }
};

// 獲取商品分類列表
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('獲取分類列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取分類列表時發生錯誤'
    });
  }
};

// 創建新分類
const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    const category = await Category.create({
      name,
      description,
      parent_id: parent_id || null
    });

    res.status(201).json({
      success: true,
      message: '分類創建成功',
      data: category
    });
  } catch (error) {
    console.error('創建分類錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建分類時發生錯誤'
    });
  }
};

// 獲取分類詳情
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分類不存在'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('獲取分類詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取分類詳情時發生錯誤'
    });
  }
};

// 更新分類
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const [updatedRowsCount] = await Category.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: '分類不存在'
      });
    }

    const updatedCategory = await Category.findByPk(id);

    res.json({
      success: true,
      message: '分類更新成功',
      data: updatedCategory
    });
  } catch (error) {
    console.error('更新分類錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新分類時發生錯誤'
    });
  }
};

// 刪除分類
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRowsCount = await Category.destroy({
      where: { id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: '分類不存在'
      });
    }

    res.json({
      success: true,
      message: '分類刪除成功'
    });
  } catch (error) {
    console.error('刪除分類錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除分類時發生錯誤'
    });
  }
};

// 批量操作商品
const batchOperation = async (req, res) => {
  try {
    const { operation, productIds, data } = req.body;

    if (!operation || !productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: '操作類型、商品ID列表和數據為必填項'
      });
    }

    let result;
    switch (operation) {
      case 'update':
        result = await Product.update(data, {
          where: { id: { [Op.in]: productIds } }
        });
        break;
      case 'delete':
        result = await Product.destroy({
          where: { id: { [Op.in]: productIds } }
        });
        break;
      case 'activate':
        result = await Product.update({ status: 'active' }, {
          where: { id: { [Op.in]: productIds } }
        });
        break;
      case 'deactivate':
        result = await Product.update({ status: 'inactive' }, {
          where: { id: { [Op.in]: productIds } }
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支援的操作類型'
        });
    }

    res.json({
      success: true,
      message: `批量${operation}操作完成`,
      data: {
        affectedRows: result[0] || result,
        productIds
      }
    });
  } catch (error) {
    console.error('批量操作錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批量操作時發生錯誤'
    });
  }
};

// 獲取商品統計
const getProductStatistics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // 計算日期範圍
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // 統計數據
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { status: 'active' } });
    const inactiveProducts = await Product.count({ where: { status: 'inactive' } });
    const draftProducts = await Product.count({ where: { status: 'draft' } });

    // 按分類統計
    const categoryStats = await Product.findAll({
      attributes: [
        'category_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name']
      }],
      group: ['category_id', 'category.id'],
      raw: true
    });

    // 價格統計
    const priceStats = await Product.findAll({
      attributes: [
        [sequelize.fn('MIN', sequelize.col('price')), 'minPrice'],
        [sequelize.fn('MAX', sequelize.col('price')), 'maxPrice'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice']
      ],
      where: { status: 'active' },
      raw: true
    });

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totals: {
          totalProducts,
          activeProducts,
          inactiveProducts,
          draftProducts
        },
        categoryStats,
        priceStats: priceStats[0] || {},
        trends: {
          // 這裡可以添加趨勢數據
        }
      }
    });
  } catch (error) {
    console.error('獲取商品統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取商品統計時發生錯誤'
    });
  }
};

// 商品匯入
const importProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: '商品數據格式錯誤'
      });
    }

    const results = [];
    for (const productData of products) {
      try {
        const product = await Product.create(productData);
        results.push({ success: true, product });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          data: productData 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `匯入完成：成功 ${successCount} 個，失敗 ${failCount} 個`,
      data: {
        total: products.length,
        success: successCount,
        failed: failCount,
        results
      }
    });
  } catch (error) {
    console.error('商品匯入錯誤:', error);
    res.status(500).json({
      success: false,
      message: '商品匯入時發生錯誤'
    });
  }
};

// 商品匯出
const exportProducts = async (req, res) => {
  try {
    const { format = 'json', categoryId, status } = req.query;

    let whereClause = {};
    if (categoryId) whereClause.category_id = categoryId;
    if (status) whereClause.status = status;

    const products = await Product.findAll({
      where: whereClause,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name']
      }]
    });

    if (format === 'csv') {
      // CSV 格式匯出
      const csv = products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category?.name || '',
        status: p.status,
        createdAt: p.created_at
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.json({ success: true, data: csv });
    } else {
      // JSON 格式匯出
      res.json({
        success: true,
        data: products,
        meta: {
          total: products.length,
          exportedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('商品匯出錯誤:', error);
    res.status(500).json({
      success: false,
      message: '商品匯出時發生錯誤'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  batchOperation,
  getProductStatistics,
  importProducts,
  exportProducts
};
