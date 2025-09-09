const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// 簡化的商品創建路由，跳過驗證來測試
router.post('/test-create', authenticateToken, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    console.log('收到創建商品請求:', req.body);
    
    const { name, description, price, category_id, status = 'active', images = [] } = req.body;
    
    // 簡單的手動驗證
    if (!name || typeof name !== 'string' || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: '商品名稱必須至少2個字符'
      });
    }
    
    if (!price || isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: '價格必須是大於等於0的數字'
      });
    }
    
    if (!category_id || typeof category_id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '必須提供有效的分類ID'
      });
    }
    
    // 調用控制器
    await productController.createProduct(req, res);
    
  } catch (error) {
    console.error('測試創建商品錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建商品時發生錯誤'
    });
  }
});

module.exports = router;
