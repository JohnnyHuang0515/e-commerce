const { Inventory } = require('../models');
const { Op } = require('sequelize');

// 獲取庫存列表
const getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 搜尋條件
    if (search) {
      whereClause[Op.or] = [
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 狀態篩選
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取庫存列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取庫存列表時發生錯誤'
    });
  }
};

// 獲取庫存詳情
const getInventoryById = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在'
      });
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('獲取庫存詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取庫存詳情時發生錯誤'
    });
  }
};

// 創建庫存記錄
const createInventory = async (req, res) => {
  try {
    const { product_id, sku, quantity, reserved_quantity = 0, reorder_point = 10, status = 'active' } = req.body;

    const inventory = await Inventory.create({
      product_id,
      sku,
      quantity: parseInt(quantity),
      reserved_quantity: parseInt(reserved_quantity),
      reorder_point: parseInt(reorder_point),
      status
    });

    res.status(201).json({
      success: true,
      message: '庫存記錄創建成功',
      data: inventory
    });
  } catch (error) {
    console.error('創建庫存記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建庫存記錄時發生錯誤'
    });
  }
};

// 更新庫存
const updateInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const updateData = req.body;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在'
      });
    }

    await inventory.update(updateData);

    res.json({
      success: true,
      message: '庫存更新成功',
      data: inventory
    });
  } catch (error) {
    console.error('更新庫存錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新庫存時發生錯誤'
    });
  }
};

// 調整庫存數量
const adjustInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { adjustment, reason } = req.body;

    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在'
      });
    }

    const newQuantity = inventory.quantity + parseInt(adjustment);
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: '庫存數量不能為負數'
      });
    }

    await inventory.update({ quantity: newQuantity });

    // 記錄庫存變動
    await InventoryMovement.create({
      inventory_id: inventoryId,
      adjustment: parseInt(adjustment),
      reason,
      created_by: req.user.userId
    });

    res.json({
      success: true,
      message: '庫存調整成功',
      data: {
        id: inventory.id,
        sku: inventory.sku,
        old_quantity: inventory.quantity - parseInt(adjustment),
        new_quantity: newQuantity,
        adjustment: parseInt(adjustment)
      }
    });
  } catch (error) {
    console.error('調整庫存錯誤:', error);
    res.status(500).json({
      success: false,
      message: '調整庫存時發生錯誤'
    });
  }
};

// 獲取低庫存商品
const getLowStockItems = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;

    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: {
          [Op.lte]: threshold
        },
        status: 'active'
      },
      order: [['quantity', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        items: lowStockItems,
        threshold,
        count: lowStockItems.length
      }
    });
  } catch (error) {
    console.error('獲取低庫存商品錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取低庫存商品時發生錯誤'
    });
  }
};

// 獲取庫存統計
const getInventoryStatistics = async (req, res) => {
  try {
    const totalItems = await Inventory.count();
    const activeItems = await Inventory.count({ where: { status: 'active' } });
    const lowStockItems = await Inventory.count({
      where: {
        quantity: {
          [Op.lte]: 10
        },
        status: 'active'
      }
    });

    const totalQuantity = await Inventory.sum('quantity', {
      where: { status: 'active' }
    });

    const totalReserved = await Inventory.sum('reserved_quantity', {
      where: { status: 'active' }
    });

    res.json({
      success: true,
      data: {
        total_items: totalItems,
        active_items: activeItems,
        low_stock_items: lowStockItems,
        total_quantity: totalQuantity || 0,
        total_reserved: totalReserved || 0,
        available_quantity: (totalQuantity || 0) - (totalReserved || 0)
      }
    });
  } catch (error) {
    console.error('獲取庫存統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取庫存統計時發生錯誤'
    });
  }
};

// 庫存調整
const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason, createdBy } = req.body;

    if (newQuantity === undefined || newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: '無效的庫存數量',
      });
    }

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    const oldQuantity = inventory.quantity;
    await inventory.update({ quantity: newQuantity });

    res.json({
      success: true,
      message: '庫存調整成功',
      data: {
        inventory,
        adjustment: {
          oldQuantity,
          newQuantity,
          difference: newQuantity - oldQuantity
        }
      },
    });
  } catch (error) {
    console.error('調整庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

// 預留庫存
const reserveStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, orderId, createdBy } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '無效的預留數量',
      });
    }

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    if (inventory.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: '庫存不足',
      });
    }

    const newReserved = (inventory.reserved_quantity || 0) + quantity;
    const newAvailable = inventory.quantity - newReserved;

    await inventory.update({
      reserved_quantity: newReserved,
      available_quantity: newAvailable
    });

    res.json({
      success: true,
      message: '庫存預留成功',
      data: {
        inventory,
        reserved: quantity,
        available: newAvailable
      },
    });
  } catch (error) {
    console.error('預留庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

// 獲取低庫存警告
const getLowStockAlerts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: {
          [Op.lte]: parseInt(threshold)
        }
      },
      order: [['quantity', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        alerts: lowStockItems,
        count: lowStockItems.length,
        threshold: parseInt(threshold)
      }
    });
  } catch (error) {
    console.error('獲取低庫存警告失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  adjustInventory,
  getLowStockItems,
  getInventoryStatistics,
  adjustStock,
  reserveStock,
  getLowStockAlerts
};
