const axios = require('axios');
const crypto = require('crypto');

/**
 * Stripe 支付處理
 */
class StripeProvider {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.publishableKey = config.publishableKey;
    this.webhookSecret = config.webhookSecret;
    this.baseURL = 'https://api.stripe.com/v1';
  }

  async createPaymentIntent(amount, currency, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_intents`,
        {
          amount: Math.round(amount * 100), // Stripe 使用分為單位
          currency: currency.toLowerCase(),
          metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        data: {
          clientSecret: response.data.client_secret,
          paymentIntentId: response.data.id,
          amount: response.data.amount,
          currency: response.data.currency,
          status: response.data.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payment_intents/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  async createRefund(paymentIntentId, amount, reason) {
    try {
      const response = await axios.post(
        `${this.baseURL}/refunds`,
        {
          payment_intent: paymentIntentId,
          amount: Math.round(amount * 100),
          reason: reason,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  verifyWebhook(payload, signature) {
    try {
      const elements = signature.split(',');
      const signatureHash = elements.find(el => el.startsWith('v1=')).split('=')[1];
      const timestamp = elements.find(el => el.startsWith('t=')).split('=')[1];

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(timestamp + '.' + payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }
}

/**
 * PayPal 支付處理
 */
class PayPalProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.mode = config.mode || 'sandbox';
    this.baseURL = this.mode === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
    this.accessToken = null;
  }

  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new Error(`PayPal 認證失敗: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async createOrder(amount, currency, metadata = {}) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toString(),
              },
              custom_id: metadata.orderId,
            },
          ],
          application_context: {
            return_url: metadata.returnUrl || 'https://example.com/return',
            cancel_url: metadata.cancelUrl || 'https://example.com/cancel',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async captureOrder(orderId) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async createRefund(captureId, amount, reason) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      const response = await axios.post(
        `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        {
          amount: {
            value: amount.toString(),
            currency_code: 'TWD',
          },
          note_to_payer: reason,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }
}

/**
 * Line Pay 支付處理
 */
class LinePayProvider {
  constructor(config) {
    this.channelId = config.channelId;
    this.channelSecret = config.channelSecret;
    this.sandbox = config.sandbox || true;
    this.baseURL = this.sandbox 
      ? 'https://sandbox-api-pay.line.me'
      : 'https://api-pay.line.me';
  }

  generateSignature(nonce, body, channelSecret) {
    const signature = crypto
      .createHmac('sha256', channelSecret)
      .update(channelSecret + body + nonce)
      .digest('base64');
    return signature;
  }

  async createPayment(amount, currency, metadata = {}) {
    try {
      const nonce = Date.now().toString();
      const body = JSON.stringify({
        amount: amount,
        currency: currency,
        orderId: metadata.orderId,
        packages: [
          {
            id: 'package-1',
            amount: amount,
            name: metadata.productName || '商品',
            products: [
              {
                name: metadata.productName || '商品',
                quantity: 1,
                price: amount,
              },
            ],
          },
        ],
        redirectUrls: {
          confirmUrl: metadata.confirmUrl || 'https://example.com/confirm',
          cancelUrl: metadata.cancelUrl || 'https://example.com/cancel',
        },
      });

      const signature = this.generateSignature(nonce, body, this.channelSecret);

      const response = await axios.post(
        `${this.baseURL}/v3/payments/request`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-LINE-ChannelId': this.channelId,
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async confirmPayment(transactionId, amount, currency) {
    try {
      const nonce = Date.now().toString();
      const body = JSON.stringify({
        amount: amount,
        currency: currency,
      });

      const signature = this.generateSignature(nonce, body, this.channelSecret);

      const response = await axios.post(
        `${this.baseURL}/v3/payments/${transactionId}/confirm`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-LINE-ChannelId': this.channelId,
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }
}

/**
 * 銀行轉帳處理
 */
class BankTransferProvider {
  constructor(config) {
    this.bankName = config.bankName;
    this.accountNumber = config.accountNumber;
    this.accountName = config.accountName;
  }

  generateVirtualAccount(orderId, amount) {
    // 生成虛擬帳號邏輯
    const timestamp = Date.now().toString().slice(-6);
    const virtualAccount = `${this.accountNumber}${timestamp}`;
    
    return {
      success: true,
      data: {
        virtualAccount,
        bankName: this.bankName,
        accountName: this.accountName,
        amount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小時後過期
      },
    };
  }

  async verifyPayment(virtualAccount, amount) {
    // 模擬銀行轉帳驗證
    // 實際實作需要與銀行 API 串接
    return {
      success: true,
      data: {
        verified: true,
        amount,
        paidAt: new Date(),
      },
    };
  }
}

/**
 * 現金付款處理
 */
class CashOnDeliveryProvider {
  constructor(config) {
    this.fee = config.fee || 0;
  }

  createPayment(amount) {
    return {
      success: true,
      data: {
        amount: amount + this.fee,
        fee: this.fee,
        paymentMethod: 'cash_on_delivery',
        instructions: '請準備現金，貨到付款',
      },
    };
  }
}

module.exports = {
  StripeProvider,
  PayPalProvider,
  LinePayProvider,
  BankTransferProvider,
  CashOnDeliveryProvider,
};
