const { Logistics, Order } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// 獲取物流記錄列表
const getLogistics = async (req, res) => {
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

    const { count, rows: logistics } = await Logistics.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['order_number', 'user_id', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logistics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取物流記錄列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取物流記錄列表時發生錯誤'
    });
  }
};

// 獲取物流記錄詳情
const getLogisticsById = async (req, res) => {
  try {
    const { logisticsId } = req.params;

    const logistics = await Logistics.findByPk(logisticsId, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['order_number', 'user_id', 'status', 'shipping_address']
        }
      ]
    });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流記錄不存在'
      });
    }

    res.json({
      success: true,
      data: logistics
    });
  } catch (error) {
    console.error('獲取物流記錄詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取物流記錄詳情時發生錯誤'
    });
  }
};

// 創建物流記錄
const createLogistics = async (req, res) => {
  try {
    const { 
      order_id, 
      shipping_method, 
      carrier, 
      tracking_number, 
      shipping_address, 
      estimated_delivery, 
      shipping_cost = 0 
    } = req.body;

    // 檢查訂單是否存在
    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '訂單不存在'
      });
    }

    // 檢查訂單是否已有物流記錄
    const existingLogistics = await Logistics.findOne({ where: { order_id } });
    if (existingLogistics) {
      return res.status(400).json({
        success: false,
        message: '訂單已有物流記錄'
      });
    }

    const logistics = await Logistics.create({
      order_id,
      shipping_method,
      carrier,
      tracking_number: tracking_number || `TRK_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'pending',
      shipping_address,
      estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : null,
      shipping_cost: parseFloat(shipping_cost)
    });

    res.status(201).json({
      success: true,
      message: '物流記錄創建成功',
      data: logistics
    });
  } catch (error) {
    console.error('創建物流記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建物流記錄時發生錯誤'
    });
  }
};

// 更新物流狀態
const updateLogisticsStatus = async (req, res) => {
  try {
    const { logisticsId } = req.params;
    const { status, tracking_data, notes } = req.body;

    const logistics = await Logistics.findByPk(logisticsId);
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流記錄不存在'
      });
    }

    const updateData = { status };
    
    if (tracking_data) {
      updateData.tracking_data = tracking_data;
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    // 如果狀態為已送達，記錄實際送達時間
    if (status === 'delivered') {
      updateData.actual_delivery = new Date();
    }

    await logistics.update(updateData);

    // 如果物流狀態為已送達，更新訂單狀態
    if (status === 'delivered') {
      await Order.update(
        { status: 'delivered', delivered_at: new Date() },
        { where: { id: logistics.order_id } }
      );
    }

    res.json({
      success: true,
      message: '物流狀態更新成功',
      data: {
        logistics_id: logistics.id,
        status: logistics.status,
        tracking_number: logistics.tracking_number
      }
    });
  } catch (error) {
    console.error('更新物流狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新物流狀態時發生錯誤'
    });
  }
};

// 追蹤物流狀態
const trackLogistics = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const logistics = await Logistics.findOne({
      where: { tracking_number: trackingNumber },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['order_number', 'status']
        }
      ]
    });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '找不到此追蹤號碼的物流記錄'
      });
    }

    // 模擬追蹤數據
    const trackingEvents = [
      {
        status: 'picked_up',
        description: '包裹已取件',
        timestamp: logistics.created_at,
        location: '台北轉運中心'
      },
      {
        status: 'in_transit',
        description: '包裹運輸中',
        timestamp: moment(logistics.created_at).add(1, 'hour').toDate(),
        location: '桃園轉運中心'
      },
      {
        status: 'out_for_delivery',
        description: '包裹配送中',
        timestamp: moment(logistics.created_at).add(1, 'day').toDate(),
        location: '當地配送站'
      }
    ];

    if (logistics.status === 'delivered') {
      trackingEvents.push({
        status: 'delivered',
        description: '包裹已送達',
        timestamp: logistics.actual_delivery || new Date(),
        location: logistics.shipping_address?.address || '收件地址'
      });
    }

    res.json({
      success: true,
      data: {
        tracking_number: logistics.tracking_number,
        carrier: logistics.carrier,
        status: logistics.status,
        shipping_address: logistics.shipping_address,
        estimated_delivery: logistics.estimated_delivery,
        actual_delivery: logistics.actual_delivery,
        tracking_events: trackingEvents,
        order: logistics.order
      }
    });
  } catch (error) {
    console.error('追蹤物流狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '追蹤物流狀態時發生錯誤'
    });
  }
};

// 獲取物流統計
const getLogisticsStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const whereClause = {};

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const totalLogistics = await Logistics.count({ where: whereClause });
    const totalShippingCost = await Logistics.sum('shipping_cost', { where: whereClause });

    const statusStats = await Logistics.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      raw: true
    });

    const carrierStats = await Logistics.findAll({
      attributes: [
        'carrier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['carrier'],
      raw: true
    });

    const methodStats = await Logistics.findAll({
      attributes: [
        'shipping_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['shipping_method'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total_logistics: totalLogistics,
        total_shipping_cost: totalShippingCost || 0,
        status_stats: statusStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        carrier_stats: carrierStats.reduce((acc, item) => {
          acc[item.carrier] = parseInt(item.count);
          return acc;
        }, {}),
        method_stats: methodStats.reduce((acc, item) => {
          acc[item.shipping_method] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('獲取物流統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取物流統計時發生錯誤'
    });
  }
};

module.exports = {
  getLogistics,
  getLogisticsById,
  createLogistics,
  updateLogisticsStatus,
  trackLogistics,
  getLogisticsStatistics
};
