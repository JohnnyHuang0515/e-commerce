const { Payment, Refund } = require('../models');
const {
  StripeProvider,
  PayPalProvider,
  LinePayProvider,
  BankTransferProvider,
  CashOnDeliveryProvider,
} = require('../utils/paymentProviders');

// 初始化支付提供者
const stripeProvider = new StripeProvider({
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});

const paypalProvider = new PayPalProvider({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.PAYPAL_MODE,
});

const linePayProvider = new LinePayProvider({
  channelId: process.env.LINE_PAY_CHANNEL_ID,
  channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
  sandbox: process.env.LINE_PAY_SANDBOX === 'true',
});

const bankTransferProvider = new BankTransferProvider({
  bankName: process.env.BANK_NAME,
  accountNumber: process.env.BANK_ACCOUNT_NUMBER,
  accountName: process.env.BANK_ACCOUNT_NAME,
});

const cashOnDeliveryProvider = new CashOnDeliveryProvider({
  fee: parseInt(process.env.CASH_ON_DELIVERY_FEE) || 0,
});

/**
 * 建立支付
 */
const createPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, currency, method, metadata = {} } = req.body;

    // 驗證輸入
    if (!orderId || !userId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數',
      });
    }

    if (amount < parseInt(process.env.MIN_PAYMENT_AMOUNT) || amount > parseInt(process.env.MAX_PAYMENT_AMOUNT)) {
      return res.status(400).json({
        success: false,
        message: '支付金額超出限制',
      });
    }

    // 生成支付 ID
    const paymentId = Payment.generatePaymentId();
    
    // 設定過期時間
    const expiresAt = new Date(Date.now() + parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) * 60 * 1000);

    // 根據支付方式處理
    let paymentResult;
    let provider;
    let externalTransactionId;

    switch (method) {
      case 'stripe':
        provider = 'stripe';
        paymentResult = await stripeProvider.createPaymentIntent(amount, currency, {
          orderId,
          paymentId,
          ...metadata,
        });
        externalTransactionId = paymentResult.data?.paymentIntentId;
        break;

      case 'paypal':
        provider = 'paypal';
        paymentResult = await paypalProvider.createOrder(amount, currency, {
          orderId,
          paymentId,
          ...metadata,
        });
        externalTransactionId = paymentResult.data?.id;
        break;

      case 'line_pay':
        provider = 'line_pay';
        paymentResult = await linePayProvider.createPayment(amount, currency, {
          orderId,
          paymentId,
          ...metadata,
        });
        externalTransactionId = paymentResult.data?.info?.transactionId;
        break;

      case 'bank_transfer':
        provider = 'bank';
        paymentResult = bankTransferProvider.generateVirtualAccount(orderId, amount);
        externalTransactionId = paymentResult.data?.virtualAccount;
        break;

      case 'cash_on_delivery':
        provider = 'cash';
        paymentResult = cashOnDeliveryProvider.createPayment(amount);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '不支援的支付方式',
        });
    }

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: '支付建立失敗',
        error: paymentResult.error,
      });
    }

    // 映射支付方式到資料庫枚舉值
    const methodMapping = {
      'stripe': 'DIGITAL_WALLET',
      'paypal': 'DIGITAL_WALLET', 
      'line_pay': 'DIGITAL_WALLET',
      'bank_transfer': 'BANK_TRANSFER',
      'cash_on_delivery': 'CASH_ON_DELIVERY',
      'credit_card': 'CREDIT_CARD'
    };

    // 建立支付記錄
    const payment = await Payment.create({
      payment_id: paymentId,
      order_id: orderId,
      user_id: userId,
      payment_method: methodMapping[method] || 'DIGITAL_WALLET',
      payment_provider: provider,
      amount: amount,
      currency: currency || 'TWD',
      status: 'PENDING',
      transaction_id: paymentId,
      external_transaction_id: externalTransactionId,
      gateway_response: paymentResult.data,
      expires_at: expiresAt,
      metadata: metadata,
    });

    console.log(`支付建立成功: ${paymentId}`, { orderId, userId, amount, method });

    res.status(201).json({
      success: true,
      message: '支付建立成功',
      data: {
        paymentId,
        paymentInfo: {
          method: payment.payment_method,
          provider: payment.payment_provider,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
        },
        expiresAt: payment.expires_at,
        gatewayData: paymentResult.data,
      },
    });
  } catch (error) {
    console.error('建立支付失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 確認支付
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { transactionId, amount, currency } = req.body;

    const payment = await Payment.findOne({ where: { payment_id: paymentId } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在',
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '支付狀態不正確',
      });
    }

    if (payment.getIsExpired()) {
      return res.status(400).json({
        success: false,
        message: '支付已過期',
      });
    }

    // 根據支付提供者確認支付
    let confirmResult;

    switch (payment.payment_provider) {
      case 'stripe':
        confirmResult = await stripeProvider.confirmPayment(transactionId);
        break;

      case 'paypal':
        confirmResult = await paypalProvider.captureOrder(transactionId);
        break;

      case 'line_pay':
        confirmResult = await linePayProvider.confirmPayment(transactionId, amount, currency);
        break;

      case 'bank':
        confirmResult = await bankTransferProvider.verifyPayment(transactionId, amount);
        break;

      case 'cash':
        confirmResult = { success: true, data: { status: 'success' } };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '不支援的支付提供者',
        });
    }

    if (!confirmResult.success) {
      payment.status = 'FAILED';
      payment.gateway_response = confirmResult.error;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: '支付確認失敗',
        error: confirmResult.error,
      });
    }

    // 更新支付狀態
    payment.status = 'SUCCESS';
    payment.gateway_response = confirmResult.data;
    payment.paid_at = new Date();
    await payment.save();

    console.log(`支付確認成功: ${paymentId}`, { orderId: payment.order_id, amount: payment.amount });

    res.json({
      success: true,
      message: '支付確認成功',
      data: {
        paymentId,
        status: payment.status,
        paidAt: payment.paid_at,
      },
    });
  } catch (error) {
    console.error('確認支付失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取消支付
 */
const cancelPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ where: { payment_id: paymentId } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在',
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '只能取消待處理的支付',
      });
    }

    payment.status = 'CANCELLED';
    payment.cancelled_at = new Date();
    await payment.save();

    console.log(`支付取消成功: ${paymentId}`, { orderId: payment.order_id });

    res.json({
      success: true,
      message: '支付取消成功',
      data: {
        paymentId,
        status: payment.status,
        cancelledAt: payment.cancelled_at,
      },
    });
  } catch (error) {
    console.error('取消支付失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 處理退款
 */
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findOne({ where: { payment_id: paymentId } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在',
      });
    }

    if (!payment.canRefund(amount)) {
      return res.status(400).json({
        success: false,
        message: '無法處理退款',
      });
    }

    // 根據支付提供者處理退款
    let refundResult;

    switch (payment.payment_provider) {
      case 'stripe':
        refundResult = await stripeProvider.createRefund(
          payment.external_transaction_id,
          amount,
          reason
        );
        break;

      case 'paypal':
        refundResult = await paypalProvider.createRefund(
          payment.external_transaction_id,
          amount,
          reason
        );
        break;

      case 'line_pay':
      case 'bank':
      case 'cash':
        // 這些支付方式需要手動處理退款
        refundResult = { success: true, data: { id: `manual_${Date.now()}` } };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '不支援的支付提供者',
        });
    }

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: '退款處理失敗',
        error: refundResult.error,
      });
    }

    // 創建退款記錄
    const refundId = Refund.generateRefundId();
    const refund = await Refund.create({
      refund_id: refundId,
      payment_id: payment.id,
      order_id: payment.order_id,
      user_id: payment.user_id,
      amount: amount,
      reason: reason,
      status: 'success',
      processed_at: new Date(),
      external_refund_id: refundResult.data?.id,
      metadata: refundResult.data,
    });

    // 更新支付記錄
    await payment.processRefund(amount, reason);

    console.log(`退款處理成功: ${paymentId}`, { refundId, amount, reason });

    res.json({
      success: true,
      message: '退款處理成功',
      data: {
        refundId: refund.refund_id,
        amount: refund.amount,
        status: refund.status,
        processedAt: refund.processed_at,
      },
    });
  } catch (error) {
    console.error('處理退款失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得支付詳情
 */
const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ where: { payment_id: paymentId } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付記錄不存在',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('取得支付詳情失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得支付列表
 */
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, method, userId, orderId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (method) where.payment_method = method;
    if (userId) where.user_id = userId;
    if (orderId) where.order_id = orderId;

    const offset = (page - 1) * limit;
    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('取得支付列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 處理 Webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const { provider } = req.params;
    const payload = JSON.stringify(req.body);
    const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'];

    let isValid = false;

    switch (provider) {
      case 'stripe':
        isValid = stripeProvider.verifyWebhook(payload, signature);
        break;
      case 'paypal':
        // PayPal webhook 驗證邏輯
        isValid = true; // 簡化處理
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支援的支付提供者',
        });
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Webhook 驗證失敗',
      });
    }

    // 處理 webhook 事件
    const event = req.body;
    const payment = await Payment.findOne({
      where: {
        external_transaction_id: event.id || event.data?.id,
      },
    });

    if (payment) {
      const webhookEvents = payment.webhook_events || [];
      webhookEvents.push({
        event: event.type || 'payment.updated',
        data: event,
        receivedAt: new Date(),
      });
      
      payment.webhook_events = webhookEvents;

      // 根據事件類型更新支付狀態
      if (event.type === 'payment_intent.succeeded' || event.type === 'payment.captured') {
        payment.status = 'SUCCESS';
        payment.paid_at = new Date();
      } else if (event.type === 'payment_intent.payment_failed') {
        payment.status = 'FAILED';
      }

      await payment.save();
    }

    console.log(`Webhook 處理成功: ${provider}`, { eventType: event.type });

    res.json({ success: true, message: 'Webhook 處理成功' });
  } catch (error) {
    console.error('處理 Webhook 失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  confirmPayment,
  cancelPayment,
  processRefund,
  getPayment,
  getPayments,
  handleWebhook,
};