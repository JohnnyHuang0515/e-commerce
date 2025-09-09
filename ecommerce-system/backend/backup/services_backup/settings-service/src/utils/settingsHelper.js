const _ = require('lodash');

/**
 * 驗證設定值
 */
const validateSetting = (category, key, value) => {
  const validations = {
    system: {
      siteInfo: {
        siteName: (val) => typeof val === 'string' && val.length > 0,
        contactEmail: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        timezone: (val) => ['Asia/Taipei', 'UTC', 'America/New_York'].includes(val),
        currency: (val) => ['TWD', 'USD', 'EUR', 'JPY', 'CNY'].includes(val),
        language: (val) => ['zh-TW', 'en-US', 'ja-JP', 'ko-KR'].includes(val)
      },
      maintenance: {
        maintenanceMode: (val) => typeof val === 'boolean',
        maintenanceMessage: (val) => typeof val === 'string' && val.length <= 500
      }
    },
    payment: {
      paymentMethods: {
        stripeEnabled: (val) => typeof val === 'boolean',
        paypalEnabled: (val) => typeof val === 'boolean',
        bankTransferEnabled: (val) => typeof val === 'boolean',
        cashOnDeliveryEnabled: (val) => typeof val === 'boolean',
        cashOnDeliveryFee: (val) => typeof val === 'number' && val >= 0
      }
    },
    shipping: {
      shippingConfig: {
        freeShippingThreshold: (val) => typeof val === 'number' && val >= 0,
        defaultShippingFee: (val) => typeof val === 'number' && val >= 0,
        returnPolicy: {
          enabled: (val) => typeof val === 'boolean',
          days: (val) => typeof val === 'number' && val >= 0 && val <= 365,
          conditions: (val) => Array.isArray(val) && val.every(condition => typeof condition === 'string')
        }
      }
    },
    notification: {
      emailConfig: {
        emailNotifications: {
          orderConfirmation: (val) => typeof val === 'boolean',
          orderStatusUpdate: (val) => typeof val === 'boolean',
          shippingConfirmation: (val) => typeof val === 'boolean',
          deliveryConfirmation: (val) => typeof val === 'boolean'
        }
      }
    },
    security: {
      securityConfig: {
        passwordPolicy: {
          minLength: (val) => typeof val === 'number' && val >= 6 && val <= 20,
          requireUppercase: (val) => typeof val === 'boolean',
          requireLowercase: (val) => typeof val === 'boolean',
          requireNumbers: (val) => typeof val === 'boolean',
          requireSpecialChars: (val) => typeof val === 'boolean'
        },
        sessionSettings: {
          sessionTimeout: (val) => typeof val === 'number' && val >= 5 && val <= 480,
          maxSessions: (val) => typeof val === 'number' && val >= 1 && val <= 10,
          rememberMeEnabled: (val) => typeof val === 'boolean'
        }
      }
    }
  };

  const categoryValidations = validations[category];
  if (!categoryValidations) {
    return { isValid: false, error: '無效的設定分類' };
  }

  const keyValidations = categoryValidations[key];
  if (!keyValidations) {
    return { isValid: false, error: '無效的設定鍵值' };
  }

  // 遞迴驗證物件
  const validateObject = (obj, validations) => {
    for (const [field, validator] of Object.entries(validations)) {
      if (typeof validator === 'function') {
        if (!validator(obj[field])) {
          return { isValid: false, error: `欄位 ${field} 驗證失敗` };
        }
      } else if (typeof validator === 'object' && obj[field]) {
        const result = validateObject(obj[field], validator);
        if (!result.isValid) {
          return result;
        }
      }
    }
    return { isValid: true };
  };

  return validateObject(value, keyValidations);
};

/**
 * 格式化設定值
 */
const formatSetting = (category, key, value) => {
  const formatters = {
    system: {
      siteInfo: (val) => ({
        ...val,
        siteName: val.siteName?.trim(),
        contactEmail: val.contactEmail?.toLowerCase().trim(),
        siteDescription: val.siteDescription?.trim()
      }),
      maintenance: (val) => ({
        ...val,
        maintenanceMessage: val.maintenanceMessage?.trim()
      })
    },
    payment: {
      paymentMethods: (val) => ({
        ...val,
        cashOnDeliveryFee: Math.max(0, val.cashOnDeliveryFee || 0)
      })
    },
    shipping: {
      shippingConfig: (val) => ({
        ...val,
        freeShippingThreshold: Math.max(0, val.freeShippingThreshold || 0),
        defaultShippingFee: Math.max(0, val.defaultShippingFee || 0),
        returnPolicy: {
          ...val.returnPolicy,
          days: Math.min(365, Math.max(0, val.returnPolicy?.days || 7))
        }
      })
    },
    security: {
      securityConfig: (val) => ({
        ...val,
        passwordPolicy: {
          ...val.passwordPolicy,
          minLength: Math.min(20, Math.max(6, val.passwordPolicy?.minLength || 8))
        },
        sessionSettings: {
          ...val.sessionSettings,
          sessionTimeout: Math.min(480, Math.max(5, val.sessionSettings?.sessionTimeout || 30)),
          maxSessions: Math.min(10, Math.max(1, val.sessionSettings?.maxSessions || 5))
        }
      })
    }
  };

  const categoryFormatters = formatters[category];
  if (!categoryFormatters) {
    return value;
  }

  const keyFormatter = categoryFormatters[key];
  if (!keyFormatter) {
    return value;
  }

  return keyFormatter(value);
};

/**
 * 取得設定預設值
 */
const getDefaultValue = (category, key) => {
  const defaults = {
    system: {
      siteInfo: {
        siteName: '電商系統',
        siteDescription: '專業的電商平台',
        contactEmail: 'support@ecommerce.com',
        timezone: 'Asia/Taipei',
        currency: 'TWD',
        language: 'zh-TW'
      },
      maintenance: {
        maintenanceMode: false,
        maintenanceMessage: '系統維護中，請稍後再試'
      }
    },
    payment: {
      paymentMethods: {
        stripeEnabled: false,
        paypalEnabled: false,
        bankTransferEnabled: true,
        cashOnDeliveryEnabled: true,
        cashOnDeliveryFee: 0
      }
    },
    shipping: {
      shippingConfig: {
        freeShippingThreshold: 1000,
        defaultShippingFee: 100,
        returnPolicy: {
          enabled: true,
          days: 7,
          conditions: ['商品必須完整未使用', '包裝必須完整']
        }
      }
    },
    notification: {
      emailConfig: {
        emailNotifications: {
          orderConfirmation: true,
          orderStatusUpdate: true,
          shippingConfirmation: true,
          deliveryConfirmation: true
        }
      }
    },
    security: {
      securityConfig: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        sessionSettings: {
          sessionTimeout: 30,
          maxSessions: 5,
          rememberMeEnabled: true
        }
      }
    }
  };

  return _.get(defaults, `${category}.${key}`, null);
};

/**
 * 合併設定值
 */
const mergeSettings = (existingValue, newValue) => {
  return _.merge({}, existingValue, newValue);
};

/**
 * 檢查設定是否為敏感資訊
 */
const isSensitiveSetting = (category, key) => {
  const sensitiveSettings = [
    'payment.stripeSecretKey',
    'payment.paypalSecret',
    'notification.emailSettings.smtpPassword',
    'notification.smsSettings.apiSecret',
    'security.jwtSecret'
  ];

  return sensitiveSettings.includes(`${category}.${key}`);
};

/**
 * 遮蔽敏感資訊
 */
const maskSensitiveValue = (value) => {
  if (typeof value === 'string' && value.length > 8) {
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }
  return '****';
};

/**
 * 驗證密碼政策
 */
const validatePassword = (password, policy) => {
  const errors = [];

  if (password.length < policy.minLength) {
    errors.push(`密碼長度至少需要 ${policy.minLength} 個字元`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密碼必須包含大寫字母');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密碼必須包含小寫字母');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('密碼必須包含數字');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密碼必須包含特殊字元');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 取得設定分類說明
 */
const getCategoryDescription = (category) => {
  const descriptions = {
    system: '系統基本設定，包含網站資訊、維護模式等',
    payment: '支付方式設定，包含各種支付選項的啟用狀態',
    shipping: '物流設定，包含運費、退貨政策等',
    notification: '通知設定，包含電子郵件、簡訊、推播通知',
    security: '安全設定，包含密碼政策、會話管理、API 安全',
    general: '一般設定，包含其他雜項設定'
  };

  return descriptions[category] || '未知分類';
};

/**
 * 取得設定鍵值說明
 */
const getKeyDescription = (category, key) => {
  const descriptions = {
    system: {
      siteInfo: '網站基本資訊設定',
      maintenance: '維護模式設定'
    },
    payment: {
      paymentMethods: '支付方式設定'
    },
    shipping: {
      shippingConfig: '物流配置設定'
    },
    notification: {
      emailConfig: '電子郵件通知設定'
    },
    security: {
      securityConfig: '安全配置設定'
    }
  };

  return _.get(descriptions, `${category}.${key}`, '無說明');
};

module.exports = {
  validateSetting,
  formatSetting,
  getDefaultValue,
  mergeSettings,
  isSensitiveSetting,
  maskSensitiveValue,
  validatePassword,
  getCategoryDescription,
  getKeyDescription
};
