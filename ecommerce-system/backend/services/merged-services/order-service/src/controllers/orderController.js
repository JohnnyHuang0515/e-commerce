const { Order, OrderItem, Payment, Logistics } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// 生成訂單號
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${timestamp}${random}`;
};

// 獲取訂單列表
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      user_id = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 狀態篩選
    if (status) {
      whereClause.status = status;
    }

    // 用戶篩選
    if (user_id) {
      whereClause.user_id = user_id;
    }

    // 非管理員只能查看自己的訂單
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      whereClause.user_id = req.user.userId;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: Logistics,
          as: 'logistics'
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取訂單列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單列表時發生錯誤'
    });
  }
};

// 獲取訂單詳情
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: Logistics,
          as: 'logistics'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '訂單不存在'
      });
    }

    // 非管理員只能查看自己的訂單
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && order.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '無權限查看此訂單'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('獲取訂單詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單詳情時發生錯誤'
    });
  }
};

// 創建新訂單
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { items, shipping_address, billing_address, notes } = req.body;
    const userId = req.user.userId;

    // 計算訂單金額
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // 這裡應該從商品服務獲取商品價格
      // 暫時使用模擬價格
      const unitPrice = 100; // 實際應該從商品服務獲取
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: item.product_id,
        product_name: `商品 ${item.product_id}`, // 實際應該從商品服務獲取
        product_sku: `SKU-${item.product_id}`,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        product_attributes: item.attributes || {}
      });
    }

    const taxAmount = subtotal * 0.05; // 5% 稅率
    const shippingAmount = 100; // 固定運費
    const discountAmount = 0; // 暫無折扣
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // 創建訂單
    const order = await Order.create({
      order_number: generateOrderNumber(),
      user_id: userId,
      status: 'pending',
      total_amount: totalAmount,
      subtotal: subtotal,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      discount_amount: discountAmount,
      currency: 'TWD',
      shipping_address: shipping_address,
      billing_address: billing_address,
      notes: notes
    }, { transaction });

    // 創建訂單項目
    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        ...item
      }, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: '訂單創建成功',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('創建訂單錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建訂單時發生錯誤'
    });
  }
};

// 更新訂單狀態
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '訂單不存在'
      });
    }

    // 檢查狀態轉換是否有效
    const validTransitions = {
      'pending': ['paid', 'cancelled'],
      'paid': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': ['refunded'],
      'cancelled': [],
      'refunded': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `無法從 ${order.status} 狀態轉換到 ${status} 狀態`
      });
    }

    const updateData = { status };
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_reason = notes;
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    await order.update(updateData);

    res.json({
      success: true,
      message: '訂單狀態更新成功',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        status: order.status
      }
    });
  } catch (error) {
    console.error('更新訂單狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新訂單狀態時發生錯誤'
    });
  }
};

// 取消訂單
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '訂單不存在'
      });
    }

    // 檢查是否可以取消
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '此訂單無法取消'
      });
    }

    // 非管理員只能取消自己的訂單
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && order.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '無權限取消此訂單'
      });
    }

    await order.update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancelled_reason: reason
    });

    res.json({
      success: true,
      message: '訂單取消成功',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        status: order.status
      }
    });
  } catch (error) {
    console.error('取消訂單錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取消訂單時發生錯誤'
    });
  }
};

// 處理退款
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '訂單不存在'
      });
    }

    // 檢查是否可以退款
    if (!['delivered', 'paid'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '此訂單無法退款'
      });
    }

    if (amount > order.total_amount) {
      return res.status(400).json({
        success: false,
        message: '退款金額不能超過訂單總額'
      });
    }

    await order.update({
      status: 'refunded'
    });

    res.json({
      success: true,
      message: '退款處理成功',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        refund_amount: amount,
        status: order.status
      }
    });
  } catch (error) {
    console.error('處理退款錯誤:', error);
    res.status(500).json({
      success: false,
      message: '處理退款時發生錯誤'
    });
  }
};

// 獲取訂單統計
const getOrderStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const whereClause = {};

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const totalOrders = await Order.count({ where: whereClause });
    const totalRevenue = await Order.sum('total_amount', { 
      where: { 
        ...whereClause, 
        status: ['paid', 'processing', 'shipped', 'delivered'] 
      } 
    });

    const statusStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue || 0,
        status_stats: statusStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('獲取訂單統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單統計時發生錯誤'
    });
  }
};

// 獲取訂單概覽
const getOrderOverview = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    const thisWeek = moment().startOf('week');
    const thisMonth = moment().startOf('month');

    const [
      todayOrders,
      yesterdayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      processingOrders
    ] = await Promise.all([
      Order.count({ where: { created_at: { [Op.gte]: today.toDate() } } }),
      Order.count({ where: { created_at: { [Op.gte]: yesterday.toDate(), [Op.lt]: today.toDate() } } }),
      Order.count({ where: { created_at: { [Op.gte]: thisWeek.toDate() } } }),
      Order.count({ where: { created_at: { [Op.gte]: thisMonth.toDate() } } }),
      Order.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: 'processing' } })
    ]);

    res.json({
      success: true,
      data: {
        today_orders: todayOrders,
        yesterday_orders: yesterdayOrders,
        week_orders: weekOrders,
        month_orders: monthOrders,
        pending_orders: pendingOrders,
        processing_orders: processingOrders
      }
    });
  } catch (error) {
    console.error('獲取訂單概覽錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單概覽時發生錯誤'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  processRefund,
  getOrderStatistics,
  getOrderOverview
};
