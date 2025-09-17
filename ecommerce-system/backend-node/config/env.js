const path = require('path');
const dotenv = require('dotenv');

// 允許透過 ENV_FILE 覆寫配置檔案位置，預設為專案根目錄的 .env
const envFile = process.env.ENV_FILE || '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  server: {
    port: toNumber(process.env.PORT, 8000),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: parseOrigins(
      process.env.CORS_ORIGIN,
      ['http://localhost:3000']
    ),
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: toNumber(process.env.POSTGRES_PORT, 5432),
    database: process.env.POSTGRES_DB || 'ecommerce_transactions',
    user: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'password123',
  },
  mongo: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  clickhouse: {
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
  upload: {
    maxFileSize: toNumber(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: toNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  thirdParty: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || '',
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
  },
};

module.exports = config;
