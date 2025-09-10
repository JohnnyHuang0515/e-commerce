const { ClickHouseClient } = require('@clickhouse/client');
const logger = require('../utils/logger');

class ClickHouseManager {
  constructor(settings) {
    this.settings = settings;
    this.client = null;
    this.connected = false;
  }

  async connect() {
    try {
      console.log('🔄 連接到 ClickHouse 資料庫...');
      console.log('ClickHouse 配置:', {
        host: this.settings.clickhouse.host,
        port: this.settings.clickhouse.port,
        username: this.settings.clickhouse.username,
        database: this.settings.clickhouse.database
      });
      
      // 生產環境：使用 HTTP 請求測試 ClickHouse 連接
      const http = require('http');
      const testUrl = `http://${this.settings.clickhouse.host}:${this.settings.clickhouse.port}/ping`;
      
      console.log('🔄 測試 ClickHouse 連接...');
      await new Promise((resolve, reject) => {
        const req = http.get(testUrl, (res) => {
          if (res.statusCode === 200) {
            this.connected = true;
            console.log('✅ ClickHouse 連接成功');
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
      });
      
      return true;
    } catch (error) {
      console.error('❌ ClickHouse 連接失敗:', error.message);
      return false;
    }
  }

  async testConnection() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // 使用 HTTP ping 測試連接
      const http = require('http');
      const testUrl = `http://${this.settings.clickhouse.host}:${this.settings.clickhouse.port}/ping`;
      
      await new Promise((resolve, reject) => {
        const req = http.get(testUrl, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(3000, () => reject(new Error('Timeout')));
      });
      
      return true;
    } catch (error) {
      console.error('❌ ClickHouse 連接測試失敗:', error.message);
      return false;
    }
  }

  async createTables() {
    try {
      if (!this.connected) {
        throw new Error('ClickHouse 未連接');
      }

      logger.info('🔄 創建 ClickHouse 資料表...');

      // 用戶行為表
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS user_behaviors (
            id UUID DEFAULT generateUUIDv4(),
            user_id String,
            action LowCardinality(String),
            item_id String,
            item_type LowCardinality(String),
            metadata String,
            session_id String,
            ip_address String,
            user_agent String,
            created_at DateTime DEFAULT now()
          ) ENGINE = MergeTree()
          ORDER BY (created_at, user_id, action)
          PARTITION BY toYYYYMM(created_at)
          TTL created_at + INTERVAL 1 YEAR
        `
      });

      // 銷售分析表
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS sales_analytics (
            id UUID DEFAULT generateUUIDv4(),
            date Date,
            total_sales Decimal(15,2) DEFAULT 0,
            total_orders UInt32 DEFAULT 0,
            total_users UInt32 DEFAULT 0,
            average_order_value Decimal(15,2) DEFAULT 0,
            conversion_rate Decimal(5,4) DEFAULT 0,
            top_products String,
            top_categories String,
            created_at DateTime DEFAULT now(),
            updated_at DateTime DEFAULT now()
          ) ENGINE = SummingMergeTree()
          ORDER BY (date)
          PARTITION BY toYYYYMM(date)
          TTL date + INTERVAL 2 YEAR
        `
      });

      // 產品性能表
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS product_performance (
            id UUID DEFAULT generateUUIDv4(),
            product_id String,
            product_name String,
            views UInt32 DEFAULT 0,
            clicks UInt32 DEFAULT 0,
            purchases UInt32 DEFAULT 0,
            revenue Decimal(15,2) DEFAULT 0,
            conversion_rate Decimal(5,4) DEFAULT 0,
            click_through_rate Decimal(5,4) DEFAULT 0,
            period_start Date,
            period_end Date,
            created_at DateTime DEFAULT now(),
            updated_at DateTime DEFAULT now()
          ) ENGINE = SummingMergeTree()
          ORDER BY (product_id, period_start)
          PARTITION BY toYYYYMM(period_start)
          TTL period_start + INTERVAL 1 YEAR
        `
      });

      // 系統健康監控表
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS system_health (
            id UUID DEFAULT generateUUIDv4(),
            service_name LowCardinality(String),
            status LowCardinality(String),
            response_time UInt32 DEFAULT 0,
            cpu_usage Decimal(5,2) DEFAULT 0,
            memory_usage Decimal(5,2) DEFAULT 0,
            disk_usage Decimal(5,2) DEFAULT 0,
            error_count UInt32 DEFAULT 0,
            metrics String,
            created_at DateTime DEFAULT now()
          ) ENGINE = MergeTree()
          ORDER BY (created_at, service_name)
          PARTITION BY toYYYYMM(created_at)
          TTL created_at + INTERVAL 3 MONTH
        `
      });

      // 分析報告表
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS analytics_reports (
            id UUID DEFAULT generateUUIDv4(),
            report_type LowCardinality(String),
            period_start Date,
            period_end Date,
            metrics String,
            insights Array(String),
            recommendations Array(String),
            status LowCardinality(String) DEFAULT 'pending',
            generated_at DateTime DEFAULT now(),
            created_by String,
            created_at DateTime DEFAULT now(),
            updated_at DateTime DEFAULT now()
          ) ENGINE = MergeTree()
          ORDER BY (generated_at, report_type)
          PARTITION BY toYYYYMM(generated_at)
          TTL generated_at + INTERVAL 1 YEAR
        `
      });

      logger.info('✅ ClickHouse 資料表創建成功');
      return true;
    } catch (error) {
      logger.error('❌ 創建 ClickHouse 資料表失敗:', error);
      return false;
    }
  }

  async insert(tableName, data) {
    try {
      if (!this.connected) {
        throw new Error('ClickHouse 未連接');
      }

      const result = await this.client.insert({
        table: tableName,
        values: data,
        format: 'JSONEachRow'
      });

      return result;
    } catch (error) {
      logger.error(`❌ 插入資料到 ${tableName} 失敗:`, error);
      throw error;
    }
  }

  async query(sql, params = {}) {
    try {
      if (!this.connected) {
        throw new Error('ClickHouse 未連接');
      }

      const result = await this.client.query({
        query: sql,
        query_params: params,
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      logger.error('❌ ClickHouse 查詢失敗:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      if (!this.connected) {
        return { connected: false };
      }

      const tables = ['user_behaviors', 'sales_analytics', 'product_performance', 'system_health', 'analytics_reports'];
      const stats = {};

      for (const table of tables) {
        try {
          const result = await this.query(`SELECT count() as count FROM ${table}`);
          stats[table] = result[0]?.count || 0;
        } catch (error) {
          stats[table] = 0;
        }
      }

      return {
        connected: this.connected,
        tables: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ 獲取 ClickHouse 統計失敗:', error);
      return { connected: false, error: error.message };
    }
  }

  async disconnect() {
    try {
      if (this.connected && this.client) {
        await this.client.close();
        this.connected = false;
        logger.info('✅ ClickHouse 連接已關閉');
      }
    } catch (error) {
      logger.error('❌ 關閉 ClickHouse 連接失敗:', error);
    }
  }
}

module.exports = ClickHouseManager;
