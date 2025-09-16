# 事件驅動架構實現指南

## 1. 架構概述

使用 Kafka 作為事件總線，實現 PostgreSQL 和 MongoDB 之間的異步資料同步。

### 架構圖
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Application   │───▶│     Kafka    │───▶│   Event Worker  │
│   (API Layer)   │    │  (Event Bus) │    │  (Sync Service) │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                        ┌─────────────────┐
│    MongoDB      │                        │   PostgreSQL   │
│ (Product Detail)│                        │ (Core Trading) │
└─────────────────┘                        └─────────────────┘
```

## 2. Kafka 設定

### 2.1 Docker Compose 設定
```yaml
# docker-compose.kafka.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    volumes:
      - kafka_data:/var/lib/kafka/data

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

volumes:
  kafka_data:
```

### 2.2 Topic 定義
```bash
# 建立 Topics
kafka-topics --create --topic product.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic product.updated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic product.deleted --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic product.status.changed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

## 3. 事件定義

### 3.1 事件 Schema
```typescript
// types/events.ts
export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  source: string;
}

export interface ProductCreatedEvent extends BaseEvent {
  eventType: 'product.created';
  data: {
    mongoId: string;
    productData: {
      name: string;
      price: number;
      stock_quantity: number;
      status: 'active' | 'inactive' | 'out_of_stock';
      category_id: number;
    };
  };
}

export interface ProductUpdatedEvent extends BaseEvent {
  eventType: 'product.updated';
  data: {
    productId: number;
    changes: {
      name?: string;
      price?: number;
      stock_quantity?: number;
      status?: string;
      category_id?: number;
    };
  };
}

export interface ProductDeletedEvent extends BaseEvent {
  eventType: 'product.deleted';
  data: {
    productId: number;
    mongoId: string;
  };
}

export interface ProductStatusChangedEvent extends BaseEvent {
  eventType: 'product.status.changed';
  data: {
    productId: number;
    oldStatus: string;
    newStatus: string;
  };
}
```

## 4. 事件發布服務

### 4.1 Kafka 客戶端設定
```typescript
// services/kafka-client.ts
import { Kafka, Producer, Consumer } from 'kafkajs';

class KafkaClient {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'ecommerce-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'product-sync-group' });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async publishEvent(topic: string, event: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{
          key: event.data.productId?.toString() || event.data.mongoId,
          value: JSON.stringify(event),
          headers: {
            eventType: event.eventType,
            version: event.version,
            timestamp: event.timestamp
          }
        }]
      });
      console.log(`Event published to ${topic}:`, event.eventId);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  async subscribeToTopics(topics: string[], handler: (event: any) => Promise<void>): Promise<void> {
    await this.consumer.subscribe({ topics });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}');
          await handler(event);
          console.log(`Event processed from ${topic}:`, event.eventId);
        } catch (error) {
          console.error('Failed to process event:', error);
          // 可以實作重試機制或死信佇列
        }
      }
    });
  }
}

export const kafkaClient = new KafkaClient();
```

### 4.2 事件發布器
```typescript
// services/event-publisher.ts
import { v4 as uuidv4 } from 'uuid';
import { kafkaClient } from './kafka-client';
import { ProductCreatedEvent, ProductUpdatedEvent, ProductDeletedEvent, ProductStatusChangedEvent } from '../types/events';

export class EventPublisher {
  async publishProductCreated(mongoId: string, productData: any): Promise<void> {
    const event: ProductCreatedEvent = {
      eventId: uuidv4(),
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'product-service',
      data: {
        mongoId,
        productData
      }
    };

    await kafkaClient.publishEvent('product.created', event);
  }

  async publishProductUpdated(productId: number, changes: any): Promise<void> {
    const event: ProductUpdatedEvent = {
      eventId: uuidv4(),
      eventType: 'product.updated',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'product-service',
      data: {
        productId,
        changes
      }
    };

    await kafkaClient.publishEvent('product.updated', event);
  }

  async publishProductDeleted(productId: number, mongoId: string): Promise<void> {
    const event: ProductDeletedEvent = {
      eventId: uuidv4(),
      eventType: 'product.deleted',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'product-service',
      data: {
        productId,
        mongoId
      }
    };

    await kafkaClient.publishEvent('product.deleted', event);
  }

  async publishProductStatusChanged(productId: number, oldStatus: string, newStatus: string): Promise<void> {
    const event: ProductStatusChangedEvent = {
      eventId: uuidv4(),
      eventType: 'product.status.changed',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'product-service',
      data: {
        productId,
        oldStatus,
        newStatus
      }
    };

    await kafkaClient.publishEvent('product.status.changed', event);
  }
}

export const eventPublisher = new EventPublisher();
```

## 5. 商品服務實現

### 5.1 商品建立服務
```typescript
// services/product-service.ts
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { eventPublisher } from './event-publisher';

export class ProductService {
  private mongoClient: MongoClient;
  private pgPool: Pool;

  constructor(mongoClient: MongoClient, pgPool: Pool) {
    this.mongoClient = mongoClient;
    this.pgPool = pgPool;
  }

  async createProduct(productData: any): Promise<{ productId: number; mongoId: string }> {
    const session = this.mongoClient.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. 寫入 MongoDB（商品詳細資訊）
        const mongoDb = this.mongoClient.db('ecommerce');
        const mongoResult = await mongoDb.collection('products_detail').insertOne({
          name: productData.name,
          description: productData.description,
          specs: productData.specs,
          images: productData.images,
          features: productData.features,
          care_instructions: productData.care_instructions,
          warranty_info: productData.warranty_info,
          seo: productData.seo,
          created_at: new Date(),
          updated_at: new Date()
        }, { session });

        // 2. 發布事件到 Kafka
        await eventPublisher.publishProductCreated(
          mongoResult.insertedId.toString(),
          {
            name: productData.name,
            price: productData.price,
            stock_quantity: productData.stock_quantity,
            status: productData.status,
            category_id: productData.category_id
          }
        );

        return {
          productId: 0, // 將由 Worker 設定
          mongoId: mongoResult.insertedId.toString()
        };
      });
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateProduct(productId: number, changes: any): Promise<void> {
    // 1. 更新 MongoDB
    const mongoDb = this.mongoClient.db('ecommerce');
    await mongoDb.collection('products_detail').updateOne(
      { product_pg_id: productId },
      { 
        $set: { 
          ...changes,
          updated_at: new Date()
        }
      }
    );

    // 2. 發布更新事件
    await eventPublisher.publishProductUpdated(productId, changes);
  }

  async deleteProduct(productId: number): Promise<void> {
    // 1. 取得 MongoDB ID
    const mongoDb = this.mongoClient.db('ecommerce');
    const mongoProduct = await mongoDb.collection('products_detail').findOne({
      product_pg_id: productId
    });

    if (!mongoProduct) {
      throw new Error('Product not found in MongoDB');
    }

    // 2. 刪除 MongoDB 資料
    await mongoDb.collection('products_detail').deleteOne({
      product_pg_id: productId
    });

    // 3. 發布刪除事件
    await eventPublisher.publishProductDeleted(productId, mongoProduct._id.toString());
  }

  async changeProductStatus(productId: number, newStatus: string): Promise<void> {
    // 1. 取得舊狀態
    const pgResult = await this.pgPool.query(
      'SELECT status FROM products WHERE product_id = $1',
      [productId]
    );

    if (pgResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    const oldStatus = pgResult.rows[0].status;

    // 2. 發布狀態變更事件
    await eventPublisher.publishProductStatusChanged(productId, oldStatus, newStatus);
  }
}
```

## 6. 事件處理 Worker

### 6.1 PostgreSQL 同步 Worker
```typescript
// workers/postgres-sync-worker.ts
import { Pool } from 'pg';
import { kafkaClient } from '../services/kafka-client';
import { ProductCreatedEvent, ProductUpdatedEvent, ProductDeletedEvent, ProductStatusChangedEvent } from '../types/events';

export class PostgresSyncWorker {
  private pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async start(): Promise<void> {
    await kafkaClient.connect();

    await kafkaClient.subscribeToTopics([
      'product.created',
      'product.updated',
      'product.deleted',
      'product.status.changed'
    ], this.handleEvent.bind(this));

    console.log('PostgreSQL Sync Worker started');
  }

  private async handleEvent(event: any): Promise<void> {
    switch (event.eventType) {
      case 'product.created':
        await this.handleProductCreated(event as ProductCreatedEvent);
        break;
      case 'product.updated':
        await this.handleProductUpdated(event as ProductUpdatedEvent);
        break;
      case 'product.deleted':
        await this.handleProductDeleted(event as ProductDeletedEvent);
        break;
      case 'product.status.changed':
        await this.handleProductStatusChanged(event as ProductStatusChangedEvent);
        break;
      default:
        console.warn('Unknown event type:', event.eventType);
    }
  }

  private async handleProductCreated(event: ProductCreatedEvent): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      // 插入到 PostgreSQL
      const result = await client.query(`
        INSERT INTO products (name, price, stock_quantity, status, category_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING product_id
      `, [
        event.data.productData.name,
        event.data.productData.price,
        event.data.productData.stock_quantity,
        event.data.productData.status,
        event.data.productData.category_id
      ]);

      const productId = result.rows[0].product_id;

      // 更新 MongoDB 關聯
      const { MongoClient } = await import('mongodb');
      const mongoClient = new MongoClient(process.env.MONGODB_URI!);
      await mongoClient.connect();
      
      const mongoDb = mongoClient.db('ecommerce');
      await mongoDb.collection('products_detail').updateOne(
        { _id: event.data.mongoId },
        { $set: { product_pg_id: productId } }
      );

      await mongoClient.close();
      await client.query('COMMIT');

      console.log(`Product created: ${productId} (MongoDB: ${event.data.mongoId})`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to handle product.created:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleProductUpdated(event: ProductUpdatedEvent): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      // 建立動態更新查詢
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(event.data.changes).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        console.log('No changes to update');
        return;
      }

      updates.push(`updated_at = NOW()`);
      values.push(event.data.productId);

      const query = `
        UPDATE products 
        SET ${updates.join(', ')}
        WHERE product_id = $${paramIndex}
      `;

      await client.query(query, values);
      await client.query('COMMIT');

      console.log(`Product updated: ${event.data.productId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to handle product.updated:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleProductDeleted(event: ProductDeletedEvent): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      // 軟刪除：將狀態設為 'deleted'
      await client.query(`
        UPDATE products 
        SET status = 'deleted', updated_at = NOW()
        WHERE product_id = $1
      `, [event.data.productId]);

      await client.query('COMMIT');

      console.log(`Product deleted: ${event.data.productId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to handle product.deleted:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleProductStatusChanged(event: ProductStatusChangedEvent): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE products 
        SET status = $1, updated_at = NOW()
        WHERE product_id = $2
      `, [event.data.newStatus, event.data.productId]);

      await client.query('COMMIT');

      console.log(`Product status changed: ${event.data.productId} (${event.data.oldStatus} → ${event.data.newStatus})`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to handle product.status.changed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## 7. 應用程式整合

### 7.1 主應用程式
```typescript
// app.ts
import express from 'express';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { ProductService } from './services/product-service';
import { PostgresSyncWorker } from './workers/postgres-sync-worker';

const app = express();
app.use(express.json());

// 資料庫連線
const mongoClient = new MongoClient(process.env.MONGODB_URI!);
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

// 服務初始化
const productService = new ProductService(mongoClient, pgPool);
const postgresSyncWorker = new PostgresSyncWorker(pgPool);

// API 路由
app.post('/api/products', async (req, res) => {
  try {
    const result = await productService.createProduct(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    await productService.updateProduct(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await productService.deleteProduct(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/products/:id/status', async (req, res) => {
  try {
    await productService.changeProductStatus(parseInt(req.params.id), req.body.status);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to change product status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 啟動應用程式
async function start() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    await pgPool.connect();
    console.log('Connected to PostgreSQL');

    await postgresSyncWorker.start();

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();
```

### 7.2 環境變數設定
```bash
# .env
MONGODB_URI=mongodb://localhost:27017/ecommerce
POSTGRES_URL=postgresql://postgres:password@localhost:5432/ecommerce
KAFKA_BROKER=localhost:9092
```

## 8. 部署與監控

### 8.1 Docker Compose 完整設定
```yaml
# docker-compose.yml
version: '3.8'
services:
  # Kafka 服務
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

  # 資料庫服務
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  # 應用程式服務
  app:
    build: .
    depends_on:
      - kafka
      - postgres
      - mongodb
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/ecommerce
      POSTGRES_URL: postgresql://postgres:password@postgres:5432/ecommerce
      KAFKA_BROKER: kafka:9092
    volumes:
      - .:/app
    working_dir: /app

volumes:
  postgres_data:
  mongodb_data:
```

### 8.2 監控設定
```typescript
// monitoring/event-monitor.ts
import { kafkaClient } from '../services/kafka-client';

export class EventMonitor {
  private metrics = {
    eventsProcessed: 0,
    eventsFailed: 0,
    lastProcessedTime: null as Date | null
  };

  async startMonitoring(): Promise<void> {
    // 監控事件處理統計
    setInterval(() => {
      console.log('Event Metrics:', {
        processed: this.metrics.eventsProcessed,
        failed: this.metrics.eventsFailed,
        successRate: this.metrics.eventsProcessed / (this.metrics.eventsProcessed + this.metrics.eventsFailed) * 100,
        lastProcessed: this.metrics.lastProcessedTime
      });
    }, 60000); // 每分鐘輸出一次
  }

  recordEventProcessed(): void {
    this.metrics.eventsProcessed++;
    this.metrics.lastProcessedTime = new Date();
  }

  recordEventFailed(): void {
    this.metrics.eventsFailed++;
  }
}

export const eventMonitor = new EventMonitor();
```

## 9. 測試

### 9.1 單元測試
```typescript
// tests/product-service.test.ts
import { ProductService } from '../services/product-service';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

describe('ProductService', () => {
  let productService: ProductService;
  let mongoClient: MongoClient;
  let pgPool: Pool;

  beforeEach(async () => {
    // 設定測試環境
    mongoClient = new MongoClient('mongodb://localhost:27017/ecommerce_test');
    pgPool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:5432/ecommerce_test'
    });
    
    productService = new ProductService(mongoClient, pgPool);
  });

  afterEach(async () => {
    // 清理測試資料
    await mongoClient.db('ecommerce_test').collection('products_detail').deleteMany({});
    await pgPool.query('DELETE FROM products');
  });

  it('should create product and publish event', async () => {
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100.00,
      stock_quantity: 10,
      status: 'active',
      category_id: 1
    };

    const result = await productService.createProduct(productData);
    
    expect(result.mongoId).toBeDefined();
    expect(result.productId).toBe(0); // 將由 Worker 設定
  });
});
```

### 9.2 整合測試
```typescript
// tests/integration.test.ts
import { kafkaClient } from '../services/kafka-client';
import { PostgresSyncWorker } from '../workers/postgres-sync-worker';

describe('Event-Driven Integration', () => {
  it('should sync product creation from MongoDB to PostgreSQL', async () => {
    // 1. 發布事件
    await kafkaClient.publishEvent('product.created', {
      eventId: 'test-event-1',
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'test',
      data: {
        mongoId: 'test-mongo-id',
        productData: {
          name: 'Test Product',
          price: 100.00,
          stock_quantity: 10,
          status: 'active',
          category_id: 1
        }
      }
    });

    // 2. 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 驗證 PostgreSQL 中的資料
    const result = await pgPool.query('SELECT * FROM products WHERE name = $1', ['Test Product']);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].price).toBe(100.00);
  });
});
```

## 10. 最佳實踐

### 10.1 錯誤處理
- 實作重試機制
- 使用死信佇列處理失敗事件
- 記錄詳細的錯誤日誌

### 10.2 效能優化
- 使用批次處理減少資料庫連線
- 實作事件去重機制
- 監控事件處理延遲

### 10.3 資料一致性
- 實作冪等性處理
- 定期檢查資料一致性
- 使用分散式事務（如需要）

這個事件驅動架構提供了高可用性、可擴展性和資料一致性的解決方案，適合大型電商系統的需求。
