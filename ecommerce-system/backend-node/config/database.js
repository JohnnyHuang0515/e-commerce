const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const Redis = require('redis');
const { ClickHouse } = require('clickhouse');

const config = require('./env');

const postgresPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const mongoClient = new MongoClient(config.mongo.uri);

const redisClient = Redis.createClient({
  url: config.redis.url,
});

const clickhouseClient = new ClickHouse({
  url: config.clickhouse.url,
  username: config.clickhouse.username,
  password: config.clickhouse.password,
});

postgresPool.on('error', (error) => {
  console.error('PostgreSQL 連接錯誤:', error);
});

redisClient.on('error', (error) => {
  console.error('Redis 連接錯誤:', error);
});

redisClient.on('connect', () => {
  console.log('Redis 連接成功');
});

const initializeConnections = async () => {
  try {
    await postgresPool.query('SELECT NOW()');
    console.log('PostgreSQL 連接成功');
  } catch (error) {
    console.error('PostgreSQL 連接失敗:', error);
    throw error;
  }

  try {
    await mongoClient.connect();
    await mongoClient.db('ecommerce').admin().ping();
    console.log('MongoDB 連接成功');
  } catch (error) {
    console.warn('MongoDB 連接失敗，將跳過 MongoDB 功能:', error.message);
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
    console.log('Redis 連接成功');
  } catch (error) {
    console.warn('Redis 連接失敗，將跳過緩存功能:', error.message);
  }

  try {
    await clickhouseClient.query('SELECT 1');
    console.log('ClickHouse 連接成功');
  } catch (error) {
    console.warn('ClickHouse 連接失敗，將跳過分析功能:', error.message);
  }
};

module.exports = {
  initializeConnections,
  postgresPool,
  mongoClient,
  redisClient,
  clickhouseClient,
};
