const { Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

class OrderController {
  /**
   * 取得訂單列表
   */
  async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        userId,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      // 建立查詢條件
      const where = {};
      if (status) where.status = status;
      if (paymentStatus) where.payment_status = paymentStatus;
      if (userId) where.customer_id = userId;
      
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }

      // 計算分頁
      const offset = (page - 1) * limit;

      // 執行查詢
      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [{
          model: OrderItem,
          as: 'orderItems',
          required: false
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        offset: parseInt(offset),
        limit: parseInt(limit)
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
        },
        message: '訂單列表取得成功'
      });
    } catch (error) {
      console.error('取得訂單列表錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得訂單列表失敗',
          details: error.message
        }
      });
    }
  }

  /**
   * 取得單一訂單
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'orderItems',
          required: false
        }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            message: '訂單不存在'
          }
        });
      }

      res.json({
        success: true,
        data: { order },
        message: '取得訂單成功'
      });
    } catch (error) {
      console.error('取得訂單錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得訂單失敗',
          details: error.message
        }
      });
    }
  }

  /**
   * 創建訂單
   */
  async createOrder(req, res) {
    try {
      const {
        user_id,
        items,
        shipping_address,
        billing_address,
        payment_method,
        shipping_method,
        notes
      } = req.body;

      // 計算總金額
      let subtotal = 0;
      const orderItems = items.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return {
          product_id: item.productId,
          product_name: item.name,
          product_sku: item.sku,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: itemTotal,
          product_image_url: item.imageUrl,
          product_options: item.options || {}
        };
      });

      const taxAmount = subtotal * 0.05; // 5% 稅
      const shippingFee = shipping_method === 'HOME_DELIVERY' ? 100 : 60;
      const totalAmount = subtotal + taxAmount + shippingFee;

      // 生成訂單號
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 創建訂單
      const order = await Order.create({
        customer_id: user_id,
        order_number: orderNumber,
        status: 'PENDING',
        total_amount: totalAmount,
        subtotal,
        tax_amount: taxAmount,
        shipping_fee: shippingFee,
        payment_method,
        payment_status: 'PENDING',
        shipping_method,
        shipping_address,
        billing_address,
        notes
      });

      // 創建訂單項目
      const createdItems = await OrderItem.bulkCreate(
        orderItems.map(item => ({
          ...item,
          order_id: order.id
        }))
      );

      // 重新查詢包含項目的訂單
      const orderWithItems = await Order.findByPk(order.id, {
        include: [{
          model: OrderItem,
          as: 'orderItems',
          required: false
        }]
      });

      res.status(201).json({
        success: true,
        data: { order: orderWithItems },
        message: '訂單創建成功'
      });
    } catch (error) {
      console.error('創建訂單錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '創建訂單失敗',
          details: error.message
        }
      });
    }
  }

  /**
   * 更新訂單狀態
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            message: '訂單不存在'
          }
        });
      }

      // 更新訂單狀態
      await order.updateStatus(status, { reason });

      // 重新查詢訂單
      const updatedOrder = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'orderItems',
          required: false
        }]
      });

      res.json({
        success: true,
        data: { order: updatedOrder },
        message: '訂單狀態更新成功'
      });
    } catch (error) {
      console.error('更新訂單狀態錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新訂單狀態失敗',
          details: error.message
        }
      });
    }
  }

  /**
   * 更新付款狀態
   */
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { payment_status } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            message: '訂單不存在'
          }
        });
      }

      // 更新付款狀態
      await order.update({ payment_status });

      // 如果付款成功，更新訂單狀態
      if (payment_status === 'PAID') {
        await order.update({ status: 'PAID' });
      }

      // 重新查詢訂單
      const updatedOrder = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'orderItems',
          required: false
        }]
      });

      res.json({
        success: true,
        data: { order: updatedOrder },
        message: '付款狀態更新成功'
      });
    } catch (error) {
      console.error('更新付款狀態錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新付款狀態失敗',
          details: error.message
        }
      });
    }
  }

  /**
   * 取消訂單
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            message: '訂單不存在'
          }
        });
      }

      // 檢查訂單是否可以取消
      if (order.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          error: {
            message: '訂單已經取消'
          }
        });
      }

      if (order.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          error: {
            message: '已送達的訂單無法取消'
          }
        });
      }

      // 取消訂單
      await order.updateStatus('CANCELLED', { reason });

      // 重新查詢訂單
      const cancelledOrder = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'orderItems',
          required: false
        }]
      });

      res.json({
        success: true,
        data: { order: cancelledOrder },
        message: '訂單取消成功'
      });
    } catch (error) {
      console.error('取消訂單錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取消訂單失敗',
          details: error.message
        }
      });
    }
  }

  /**
   * 取得訂單統計
   */
  async getOrderStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const where = {};
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }

      const totalOrders = await Order.count({ where });
      const totalRevenue = await Order.sum('total_amount', { where });
      
      const statusStats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['status'],
        raw: true
      });

      const paymentStats = await Order.findAll({
        attributes: [
          'payment_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['payment_status'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          totalOrders,
          totalRevenue: totalRevenue || 0,
          statusStats,
          paymentStats
        },
        message: '訂單統計取得成功'
      });
    } catch (error) {
      console.error('取得訂單統計錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得訂單統計失敗',
          details: error.message
        }
      });
    }
  }
}

module.exports = new OrderController();
