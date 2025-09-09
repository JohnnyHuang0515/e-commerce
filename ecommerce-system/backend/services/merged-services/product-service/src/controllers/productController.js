const { Product, Category } = require('../models');

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
      whereClause.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 分類篩選
    if (category) {
      whereClause.category = category;
    }

    // 狀態篩選
    if (status) {
      whereClause.status = status;
    }

    const products = await Product.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Product.countDocuments(whereClause);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
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

    const product = await Product.findById(productId);
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
    const { name, description, price, category, status = 'active', images = [] } = req.body;

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      status,
      images,
      created_by: req.user.userId
    });

    await product.save();

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
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { ...updateData, updated_by: req.user.userId },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

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

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
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
    const categories = await Category.find({ status: 'active' })
      .sort({ name: 1 });

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

    const category = new Category({
      name,
      description,
      parent_id: parent_id || null,
      created_by: req.user.userId
    });

    await category.save();

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

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory
};
