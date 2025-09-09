const axios = require('axios');

/**
 * 黑貓宅急便 API 處理
 */
class BlackCatProvider {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = this.apiUrl || 'https://api.blackcat.com.tw';
  }

  async createShipment(shipmentData) {
    try {
      const payload = {
        orderNo: shipmentData.orderId,
        sender: {
          name: shipmentData.returnAddress.name,
          phone: shipmentData.returnAddress.phone,
          address: `${shipmentData.returnAddress.city}${shipmentData.returnAddress.district}${shipmentData.returnAddress.address}`,
          zipCode: shipmentData.returnAddress.zipCode
        },
        receiver: {
          name: shipmentData.shippingAddress.name,
          phone: shipmentData.shippingAddress.phone,
          address: `${shipmentData.shippingAddress.city}${shipmentData.shippingAddress.district}${shipmentData.shippingAddress.address}`,
          zipCode: shipmentData.shippingAddress.zipCode
        },
        package: {
          weight: shipmentData.packageInfo.weight,
          length: shipmentData.packageInfo.dimensions.length,
          width: shipmentData.packageInfo.dimensions.width,
          height: shipmentData.packageInfo.dimensions.height,
          value: shipmentData.packageInfo.value,
          description: shipmentData.packageInfo.description
        },
        serviceType: shipmentData.shippingInfo.method === 'express' ? 'EXPRESS' : 'STANDARD',
        specialInstructions: shipmentData.specialInstructions
      };

      const response = await axios.post(`${this.baseURL}/v1/shipments`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        data: {
          trackingNumber: response.data.trackingNumber,
          externalTrackingId: response.data.shipmentId,
          estimatedDelivery: new Date(response.data.estimatedDelivery),
          cost: response.data.cost,
          labelUrl: response.data.labelUrl
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        success: true,
        data: {
          status: this.mapStatus(response.data.status),
          events: response.data.events.map(event => ({
            status: this.mapStatus(event.status),
            description: event.description,
            location: event.location,
            timestamp: new Date(event.timestamp),
            externalData: event
          })),
          estimatedDelivery: response.data.estimatedDelivery ? new Date(response.data.estimatedDelivery) : null,
          currentLocation: response.data.currentLocation
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async cancelShipment(trackingNumber) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/shipments/${trackingNumber}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

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

  mapStatus(status) {
    const statusMap = {
      'PENDING': 'pending',
      'PICKED_UP': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'FAILED': 'failed',
      'RETURNED': 'returned',
      'CANCELLED': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }
}

/**
 * 郵局 API 處理
 */
class PostOfficeProvider {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = this.apiUrl || 'https://api.post.gov.tw';
  }

  async createShipment(shipmentData) {
    try {
      const payload = {
        orderNo: shipmentData.orderId,
        sender: {
          name: shipmentData.returnAddress.name,
          phone: shipmentData.returnAddress.phone,
          address: `${shipmentData.returnAddress.city}${shipmentData.returnAddress.district}${shipmentData.returnAddress.address}`,
          zipCode: shipmentData.returnAddress.zipCode
        },
        receiver: {
          name: shipmentData.shippingAddress.name,
          phone: shipmentData.shippingAddress.phone,
          address: `${shipmentData.shippingAddress.city}${shipmentData.shippingAddress.district}${shipmentData.shippingAddress.address}`,
          zipCode: shipmentData.shippingAddress.zipCode
        },
        package: {
          weight: shipmentData.packageInfo.weight,
          dimensions: shipmentData.packageInfo.dimensions,
          value: shipmentData.packageInfo.value,
          description: shipmentData.packageInfo.description
        },
        serviceType: 'POSTAL',
        insurance: shipmentData.insurance.enabled ? shipmentData.insurance.amount : 0
      };

      const response = await axios.post(`${this.baseURL}/v1/shipments`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        data: {
          trackingNumber: response.data.trackingNumber,
          externalTrackingId: response.data.shipmentId,
          estimatedDelivery: new Date(response.data.estimatedDelivery),
          cost: response.data.cost,
          labelUrl: response.data.labelUrl
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        success: true,
        data: {
          status: this.mapStatus(response.data.status),
          events: response.data.events.map(event => ({
            status: this.mapStatus(event.status),
            description: event.description,
            location: event.location,
            timestamp: new Date(event.timestamp),
            externalData: event
          })),
          estimatedDelivery: response.data.estimatedDelivery ? new Date(response.data.estimatedDelivery) : null,
          currentLocation: response.data.currentLocation
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  mapStatus(status) {
    const statusMap = {
      'ACCEPTED': 'pending',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'FAILED': 'failed',
      'RETURNED': 'returned'
    };
    return statusMap[status] || 'pending';
  }
}

/**
 * 超商取貨 API 處理
 */
class ConvenienceStoreProvider {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = this.apiUrl || 'https://api.cvs.com.tw';
  }

  async createShipment(shipmentData) {
    try {
      const payload = {
        orderNo: shipmentData.orderId,
        sender: {
          name: shipmentData.returnAddress.name,
          phone: shipmentData.returnAddress.phone,
          address: `${shipmentData.returnAddress.city}${shipmentData.returnAddress.district}${shipmentData.returnAddress.address}`,
          zipCode: shipmentData.returnAddress.zipCode
        },
        receiver: {
          name: shipmentData.shippingAddress.name,
          phone: shipmentData.shippingAddress.phone,
          storeCode: shipmentData.shippingAddress.storeCode,
          storeName: shipmentData.shippingAddress.storeName,
          storeAddress: shipmentData.shippingAddress.storeAddress
        },
        package: {
          weight: shipmentData.packageInfo.weight,
          dimensions: shipmentData.packageInfo.dimensions,
          value: shipmentData.packageInfo.value,
          description: shipmentData.packageInfo.description
        },
        serviceType: 'CVS_PICKUP',
        pickupCode: this.generatePickupCode()
      };

      const response = await axios.post(`${this.baseURL}/v1/shipments`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        data: {
          trackingNumber: response.data.trackingNumber,
          externalTrackingId: response.data.shipmentId,
          estimatedDelivery: new Date(response.data.estimatedDelivery),
          cost: response.data.cost,
          pickupCode: payload.pickupCode,
          storeInfo: {
            code: payload.receiver.storeCode,
            name: payload.receiver.storeName,
            address: payload.receiver.storeAddress
          }
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        success: true,
        data: {
          status: this.mapStatus(response.data.status),
          events: response.data.events.map(event => ({
            status: this.mapStatus(event.status),
            description: event.description,
            location: event.location,
            timestamp: new Date(event.timestamp),
            externalData: event
          })),
          estimatedDelivery: response.data.estimatedDelivery ? new Date(response.data.estimatedDelivery) : null,
          storeInfo: response.data.storeInfo
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  generatePickupCode() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${timestamp}${random}`;
  }

  mapStatus(status) {
    const statusMap = {
      'ACCEPTED': 'pending',
      'IN_TRANSIT': 'in_transit',
      'ARRIVED_STORE': 'out_for_delivery',
      'PICKED_UP': 'delivered',
      'EXPIRED': 'failed',
      'RETURNED': 'returned'
    };
    return statusMap[status] || 'pending';
  }
}

/**
 * 快遞 API 處理
 */
class ExpressProvider {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = this.apiUrl || 'https://api.express.com.tw';
  }

  async createShipment(shipmentData) {
    try {
      const payload = {
        orderNo: shipmentData.orderId,
        sender: {
          name: shipmentData.returnAddress.name,
          phone: shipmentData.returnAddress.phone,
          address: `${shipmentData.returnAddress.city}${shipmentData.returnAddress.district}${shipmentData.returnAddress.address}`,
          zipCode: shipmentData.returnAddress.zipCode
        },
        receiver: {
          name: shipmentData.shippingAddress.name,
          phone: shipmentData.shippingAddress.phone,
          address: `${shipmentData.shippingAddress.city}${shipmentData.shippingAddress.district}${shipmentData.shippingAddress.address}`,
          zipCode: shipmentData.shippingAddress.zipCode
        },
        package: {
          weight: shipmentData.packageInfo.weight,
          dimensions: shipmentData.packageInfo.dimensions,
          value: shipmentData.packageInfo.value,
          description: shipmentData.packageInfo.description
        },
        serviceType: 'EXPRESS',
        priority: 'HIGH',
        signatureRequired: shipmentData.signatureRequired,
        insurance: shipmentData.insurance.enabled ? shipmentData.insurance.amount : 0
      };

      const response = await axios.post(`${this.baseURL}/v1/shipments`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        data: {
          trackingNumber: response.data.trackingNumber,
          externalTrackingId: response.data.shipmentId,
          estimatedDelivery: new Date(response.data.estimatedDelivery),
          cost: response.data.cost,
          labelUrl: response.data.labelUrl
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        success: true,
        data: {
          status: this.mapStatus(response.data.status),
          events: response.data.events.map(event => ({
            status: this.mapStatus(event.status),
            description: event.description,
            location: event.location,
            timestamp: new Date(event.timestamp),
            externalData: event
          })),
          estimatedDelivery: response.data.estimatedDelivery ? new Date(response.data.estimatedDelivery) : null,
          currentLocation: response.data.currentLocation
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  mapStatus(status) {
    const statusMap = {
      'PENDING': 'pending',
      'PICKED_UP': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'FAILED': 'failed',
      'RETURNED': 'returned',
      'CANCELLED': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }
}

/**
 * 物流提供者工廠
 */
class LogisticsProviderFactory {
  static createProvider(providerType, config) {
    switch (providerType) {
      case 'black_cat':
        return new BlackCatProvider(config);
      case 'post_office':
        return new PostOfficeProvider(config);
      case 'convenience_store':
        return new ConvenienceStoreProvider(config);
      case 'express':
        return new ExpressProvider(config);
      default:
        throw new Error(`不支援的物流提供者: ${providerType}`);
    }
  }
}

module.exports = {
  BlackCatProvider,
  PostOfficeProvider,
  ConvenienceStoreProvider,
  ExpressProvider,
  LogisticsProviderFactory,
};
