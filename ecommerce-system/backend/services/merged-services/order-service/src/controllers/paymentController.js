const { Payment, Order } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// 獲取支付記錄列表
const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      order_id = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 狀態篩選
    if (status) {
      whereClause.status = status;
    }

    // 訂單篩選
    if (order_id) {
      whereClause.order_id = order_id;
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['order_number', 'total_amount', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取支付記錄列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取支付記錄列表時發生錯誤'
    });
  }
};

// 獲取支付記錄詳情
const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['order_number', 'total_amount', 'status', 'user_id']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('獲取支付記錄詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取支付記錄詳情時發生錯誤'
    });
  }
};

// 創建支付記錄
const createPayment = async (req, res) => {
  try {
    const { order_id, payment_method, payment_provider, amount, currency = 'TWD' } = req.body;

    // 檢查訂單是否存在
    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '訂單不存在'
      });
    }

    // 檢查訂單是否已支付
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: '訂單已支付'
      });
    }

    const payment = await Payment.create({
      order_id,
      payment_method,
      payment_provider,
      external_payment_id: `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      amount: parseFloat(amount),
      currency,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: '支付記錄創建成功',
      data: payment
    });
  } catch (error) {
    console.error('創建支付記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建支付記錄時發生錯誤'
    });
  }
};

// 處理支付
const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { payment_data } = req.body;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '支付記錄狀態不正確'
      });
    }

    // 模擬支付處理
    const isSuccess = Math.random() > 0.1; // 90% 成功率

    if (isSuccess) {
      await payment.update({
        status: 'completed',
        transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        payment_data: payment_data,
        processed_at: new Date()
      });

      // 更新訂單狀態
      await Order.update(
        { 
          payment_status: 'paid',
          status: 'paid'
        },
        { where: { id: payment.order_id } }
      );

      res.json({
        success: true,
        message: '支付處理成功',
        data: {
          payment_id: payment.id,
          status: payment.status,
          transaction_id: payment.transaction_id
        }
      });
    } else {
      await payment.update({
        status: 'failed',
        failed_reason: '支付處理失敗',
        payment_data: payment_data
      });

      res.status(400).json({
        success: false,
        message: '支付處理失敗',
        data: {
          payment_id: payment.id,
          status: payment.status,
          failed_reason: payment.failed_reason
        }
      });
    }
  } catch (error) {
    console.error('處理支付錯誤:', error);
    res.status(500).json({
      success: false,
      message: '處理支付時發生錯誤'
    });
  }
};

// 處理退款
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { refund_amount, reason } = req.body;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '只有已完成的支付才能退款'
      });
    }

    if (refund_amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: '退款金額不能超過支付金額'
      });
    }

    // 模擬退款處理
    const isSuccess = Math.random() > 0.05; // 95% 成功率

    if (isSuccess) {
      await payment.update({
        status: 'refunded',
        payment_data: {
          ...payment.payment_data,
          refund_amount: refund_amount,
          refund_reason: reason,
          refunded_at: new Date()
        }
      });

      // 更新訂單狀態
      await Order.update(
        { 
          payment_status: 'refunded',
          status: 'refunded'
        },
        { where: { id: payment.order_id } }
      );

      res.json({
        success: true,
        message: '退款處理成功',
        data: {
          payment_id: payment.id,
          status: payment.status,
          refund_amount: refund_amount
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: '退款處理失敗'
      });
    }
  } catch (error) {
    console.error('處理退款錯誤:', error);
    res.status(500).json({
      success: false,
      message: '處理退款時發生錯誤'
    });
  }
};

// 獲取支付統計
const getPaymentStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const whereClause = {};

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const totalPayments = await Payment.count({ where: whereClause });
    const totalAmount = await Payment.sum('amount', { 
      where: { 
        ...whereClause, 
        status: 'completed' 
      } 
    });

    const statusStats = await Payment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      raw: true
    });

    const methodStats = await Payment.findAll({
      attributes: [
        'payment_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['payment_method'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total_payments: totalPayments,
        total_amount: totalAmount || 0,
        status_stats: statusStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        method_stats: methodStats.reduce((acc, item) => {
          acc[item.payment_method] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('獲取支付統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取支付統計時發生錯誤'
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  processPayment,
  processRefund,
  getPaymentStatistics
};
