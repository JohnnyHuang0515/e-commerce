const { Shipment } = require('../models');
const { LogisticsProviderFactory } = require('../utils/logisticsProviders');

// 初始化物流提供者
const blackCatProvider = LogisticsProviderFactory.createProvider('black_cat', {
  apiUrl: process.env.BLACK_CAT_API_URL,
  apiKey: process.env.BLACK_CAT_API_KEY,
  apiSecret: process.env.BLACK_CAT_API_SECRET,
});

const postOfficeProvider = LogisticsProviderFactory.createProvider('post_office', {
  apiUrl: process.env.POST_OFFICE_API_URL,
  apiKey: process.env.POST_OFFICE_API_KEY,
  apiSecret: process.env.POST_OFFICE_API_SECRET,
});

const convenienceStoreProvider = LogisticsProviderFactory.createProvider('convenience_store', {
  apiUrl: process.env.CONVENIENCE_STORE_API_URL,
  apiKey: process.env.CONVENIENCE_STORE_API_KEY,
  apiSecret: process.env.CONVENIENCE_STORE_API_SECRET,
});

const expressProvider = LogisticsProviderFactory.createProvider('express', {
  apiUrl: process.env.EXPRESS_API_URL,
  apiKey: process.env.EXPRESS_API_KEY,
  apiSecret: process.env.EXPRESS_API_SECRET,
});

/**
 * 建立配送
 */
const createShipment = async (req, res) => {
  try {
    const {
      orderId,
      userId,
      shippingAddress,
      returnAddress,
      packageInfo,
      shippingMethod,
      specialInstructions,
      insurance,
      signatureRequired,
      fragile
    } = req.body;

    // 驗證輸入
    if (!orderId || !userId || !shippingAddress || !returnAddress || !packageInfo) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數',
      });
    }

    // 驗證包裹重量和尺寸
    if (packageInfo.weight > parseInt(process.env.MAX_SHIPPING_WEIGHT) || 
        packageInfo.dimensions.length > parseInt(process.env.MAX_SHIPPING_DIMENSIONS) ||
        packageInfo.dimensions.width > parseInt(process.env.MAX_SHIPPING_DIMENSIONS) ||
        packageInfo.dimensions.height > parseInt(process.env.MAX_SHIPPING_DIMENSIONS)) {
      return res.status(400).json({
        success: false,
        message: '包裹重量或尺寸超出限制',
      });
    }

    // 生成配送 ID
    const shipmentId = Shipment.generateShipmentId();

    // 根據配送方式選擇物流提供者
    let provider;
    let providerInstance;
    
    switch (shippingMethod) {
      case 'express':
        provider = 'EXPRESS';
        providerInstance = expressProvider;
        break;
      case 'home_delivery':
        provider = 'BLACK_CAT';
        providerInstance = blackCatProvider;
        break;
      case 'convenience_store':
        provider = 'CONVENIENCE_STORE';
        providerInstance = convenienceStoreProvider;
        break;
      case 'post_office':
        provider = 'POST_OFFICE';
        providerInstance = postOfficeProvider;
        break;
      default:
        provider = 'BLACK_CAT';
        providerInstance = blackCatProvider;
    }

    // 建立配送記錄
    const shipment = await Shipment.create({
      shipment_id: shipmentId,
      order_id: orderId,
      user_id: userId,
      status: 'PENDING',
      shipping_address: shippingAddress,
      return_address: returnAddress,
      package_info: packageInfo,
      shipping_info: {
        method: shippingMethod?.toUpperCase() || 'HOME_DELIVERY',
        provider: provider,
        trackingNumber: null,
        externalTrackingId: null,
        estimatedDelivery: null,
        actualDelivery: null,
        deliveryAttempts: 0,
        deliveryNotes: null,
        signature: null,
        photo: null
      },
      cost_info: {
        baseFee: 0,
        weightFee: 0,
        distanceFee: 0,
        specialFee: 0,
        totalFee: 0,
        currency: 'TWD'
      },
      tracking_events: [],
      special_instructions: specialInstructions,
      insurance: insurance || { enabled: false, amount: 0 },
      signature_required: signatureRequired !== false,
      fragile: fragile || false
    });

    // 計算配送費用
    shipment.calculateShippingCost();
    await shipment.save();

    // 向物流提供者提交配送請求
    const providerResult = await providerInstance.createShipment({
      shipmentId,
      orderId,
      shippingAddress,
      returnAddress,
      packageInfo,
      costInfo: shipment.cost_info
    });

    if (providerResult.success) {
      // 更新配送資訊
      shipment.shipping_info = {
        ...shipment.shipping_info,
        trackingNumber: providerResult.data?.trackingNumber,
        externalTrackingId: providerResult.data?.externalTrackingId,
        estimatedDelivery: providerResult.data?.estimatedDelivery
      };
      
      // 添加初始追蹤事件
      shipment.addTrackingEvent('PENDING', '配送已建立', null, provider);
      await shipment.save();
    }

    console.log(`配送建立成功: ${shipmentId}`, { orderId, userId, shippingMethod });

    res.status(201).json({
      success: true,
      message: '配送建立成功',
      data: {
        shipmentId,
        trackingNumber: shipment.shipping_info?.trackingNumber,
        estimatedDelivery: shipment.shipping_info?.estimatedDelivery,
        costInfo: shipment.cost_info,
        status: shipment.status
      },
    });
  } catch (error) {
    console.error('建立配送失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 更新配送狀態
 */
const updateShipmentStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, description, location } = req.body;

    const shipment = await Shipment.findOne({ where: { shipment_id: shipmentId } });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: '配送記錄不存在',
      });
    }

    await shipment.updateStatus(status, description, location);

    console.log(`配送狀態更新成功: ${shipmentId}`, { status, description });

    res.json({
      success: true,
      message: '配送狀態更新成功',
      data: {
        shipmentId,
        status: shipment.status,
        updatedAt: shipment.updated_at
      },
    });
  } catch (error) {
    console.error('更新配送狀態失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得配送詳情
 */
const getShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ where: { shipment_id: shipmentId } });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: '配送記錄不存在',
      });
    }

    res.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('取得配送詳情失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得配送列表
 */
const getShipments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, orderId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (userId) where.user_id = userId;
    if (orderId) where.order_id = orderId;

    const offset = (page - 1) * limit;
    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('取得配送列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 追蹤配送
 */
const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await Shipment.findOne({
      where: {
        shipping_info: {
          trackingNumber: trackingNumber
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: '找不到配送記錄',
      });
    }

    // 從物流提供者獲取最新追蹤資訊
    const provider = shipment.shipping_info?.provider;
    let providerInstance;
    
    switch (provider) {
      case 'BLACK_CAT':
        providerInstance = blackCatProvider;
        break;
      case 'POST_OFFICE':
        providerInstance = postOfficeProvider;
        break;
      case 'CONVENIENCE_STORE':
        providerInstance = convenienceStoreProvider;
        break;
      case 'EXPRESS':
        providerInstance = expressProvider;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支援的物流提供者',
        });
    }

    const trackingResult = await providerInstance.trackShipment(trackingNumber);
    
    if (trackingResult.success) {
      // 更新追蹤事件
      const latestEvent = trackingResult.data?.events?.[0];
      if (latestEvent) {
        shipment.addTrackingEvent(
          latestEvent.status,
          latestEvent.description,
          latestEvent.location,
          provider,
          latestEvent.externalData
        );
        await shipment.save();
      }
    }

    res.json({
      success: true,
      data: {
        shipmentId: shipment.shipment_id,
        status: shipment.status,
        trackingEvents: shipment.tracking_events,
        estimatedDelivery: shipment.shipping_info?.estimatedDelivery,
        actualDelivery: shipment.shipping_info?.actualDelivery
      },
    });
  } catch (error) {
    console.error('追蹤配送失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取消配送
 */
const cancelShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { reason } = req.body;

    const shipment = await Shipment.findOne({ where: { shipment_id: shipmentId } });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: '配送記錄不存在',
      });
    }

    if (shipment.status === 'DELIVERED' || shipment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: '無法取消已配送或已取消的配送',
      });
    }

    // 向物流提供者發送取消請求
    const provider = shipment.shipping_info?.provider;
    let providerInstance;
    
    switch (provider) {
      case 'BLACK_CAT':
        providerInstance = blackCatProvider;
        break;
      case 'POST_OFFICE':
        providerInstance = postOfficeProvider;
        break;
      case 'CONVENIENCE_STORE':
        providerInstance = convenienceStoreProvider;
        break;
      case 'EXPRESS':
        providerInstance = expressProvider;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支援的物流提供者',
        });
    }

    const cancelResult = await providerInstance.cancelShipment(
      shipment.shipping_info?.trackingNumber,
      reason
    );

    if (cancelResult.success) {
      await shipment.updateStatus('CANCELLED', `配送已取消: ${reason}`, null);
    }

    console.log(`配送取消成功: ${shipmentId}`, { reason });

    res.json({
      success: true,
      message: '配送取消成功',
      data: {
        shipmentId,
        status: shipment.status,
        cancelledAt: shipment.updated_at
      },
    });
  } catch (error) {
    console.error('取消配送失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 計算配送費用
 */
const calculateShippingCost = async (req, res) => {
  try {
    const { packageInfo, shippingMethod, distance } = req.body;

    if (!packageInfo || !shippingMethod) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數',
      });
    }

    // 創建臨時配送記錄來計算費用
    const tempShipment = await Shipment.build({
      package_info: packageInfo,
      shipping_info: {
        method: shippingMethod.toUpperCase(),
        provider: 'BLACK_CAT'
      }
    });

    const totalCost = tempShipment.calculateShippingCost();

    res.json({
      success: true,
      data: {
        costInfo: tempShipment.cost_info,
        totalCost
      }
    });
  } catch (error) {
    console.error('計算配送費用失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得配送統計
 */
const getShipmentStats = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.created_at = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // 根據週期設定日期範圍
      const now = new Date();
      let start;
      
      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      whereClause.created_at = {
        [require('sequelize').Op.gte]: start
      };
    }

    // 統計各狀態的配送數量
    const statusStats = await Shipment.findAll({
      where: whereClause,
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 統計總配送數量
    const totalCount = await Shipment.count({ where: whereClause });

    // 統計配送方式
    const methodStats = await Shipment.findAll({
      where: whereClause,
      attributes: [
        [require('sequelize').fn('jsonb_extract_path_text', require('sequelize').col('shipping_info'), require('sequelize').literal("'method'")), 'method'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('jsonb_extract_path_text', require('sequelize').col('shipping_info'), require('sequelize').literal("'method'"))],
      raw: true
    });

    res.json({
      success: true,
      data: {
        period,
        totalCount,
        statusStats: statusStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        methodStats: methodStats.reduce((acc, item) => {
          acc[item.method] = parseInt(item.count);
          return acc;
        }, {}),
        dateRange: {
          start: startDate || (whereClause.created_at && whereClause.created_at[require('sequelize').Op.gte]),
          end: endDate || new Date()
        }
      }
    });
  } catch (error) {
    console.error('取得配送統計失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

module.exports = {
  createShipment,
  updateShipmentStatus,
  getShipment,
  getShipments,
  trackShipment,
  cancelShipment,
  calculateShippingCost,
  getShipmentStats,
};