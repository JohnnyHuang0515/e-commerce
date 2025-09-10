const Minio = require('minio');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * MinIO 配置管理
 */
class MinioManager {
  constructor() {
    this.client = null;
    this.settings = {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    };
    
    // 存儲桶配置
    this.buckets = {
      PRODUCTS: process.env.BUCKET_PRODUCTS || 'product-images',
      AVATARS: process.env.BUCKET_AVATARS || 'user-avatars',
      CATEGORIES: process.env.BUCKET_CATEGORIES || 'category-images',
      SYSTEM: process.env.BUCKET_SYSTEM || 'system-files'
    };
    
    // 圖片處理配置
    this.imageConfig = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
      quality: parseInt(process.env.IMAGE_QUALITY) || 80,
      thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE) || 300
    };
  }

  /**
   * 初始化 MinIO 客戶端
   */
  async initialize() {
    try {
      logger.info('🔄 初始化 MinIO 客戶端...');
      
      this.client = new Minio.Client({
        endPoint: this.settings.endpoint,
        port: this.settings.port,
        useSSL: this.settings.useSSL,
        accessKey: this.settings.accessKey,
        secretKey: this.settings.secretKey
      });

      // 測試連接
      const connected = await this.testConnection();
      if (connected) {
        // 初始化存儲桶
        await this.initializeBuckets();
        logger.info('✅ MinIO 初始化完成');
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('❌ MinIO 初始化失敗:', error);
      return false;
    }
  }

  /**
   * 測試 MinIO 連接
   */
  async testConnection() {
    try {
      const buckets = await this.client.listBuckets();
      logger.info('✅ MinIO 連接成功');
      logger.info('📦 可用存儲桶:', buckets.map(b => b.name).join(', '));
      return true;
    } catch (error) {
      logger.error('❌ MinIO 連接失敗:', error);
      return false;
    }
  }

  /**
   * 初始化存儲桶
   */
  async initializeBuckets() {
    try {
      for (const [bucketType, bucketName] of Object.entries(this.buckets)) {
        const exists = await this.client.bucketExists(bucketName);
        if (!exists) {
          await this.client.makeBucket(bucketName, 'us-east-1');
          logger.info(`✅ 創建存儲桶: ${bucketName}`);
          
          // 設置存儲桶策略為公開讀取
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucketName}/*`]
              }
            ]
          };
          
          await this.client.setBucketPolicy(bucketName, JSON.stringify(policy));
          logger.info(`✅ 設置存儲桶策略: ${bucketName}`);
        } else {
          logger.info(`✅ 存儲桶已存在: ${bucketName}`);
        }
      }
    } catch (error) {
      logger.error('❌ 初始化存儲桶失敗:', error);
      throw error;
    }
  }

  /**
   * 上傳文件到 MinIO
   */
  async uploadFile(bucketName, objectName, buffer, metadata = {}) {
    try {
      await this.client.putObject(
        bucketName,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': metadata.contentType || 'application/octet-stream',
          'X-Original-Name': metadata.originalName || objectName,
          ...metadata
        }
      );
      
      // 生成訪問 URL
      const baseUrl = `http://${this.settings.endpoint}:${this.settings.port}`;
      const url = `${baseUrl}/${bucketName}/${objectName}`;
      
      return {
        success: true,
        url,
        bucketName,
        objectName,
        size: buffer.length
      };
    } catch (error) {
      logger.error('❌ 文件上傳失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 從 MinIO 刪除文件
   */
  async deleteFile(bucketName, objectName) {
    try {
      await this.client.removeObject(bucketName, objectName);
      logger.info(`✅ 刪除文件成功: ${bucketName}/${objectName}`);
      return { success: true };
    } catch (error) {
      logger.error('❌ 刪除文件失敗:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取文件信息
   */
  async getFileInfo(bucketName, objectName) {
    try {
      const stat = await this.client.statObject(bucketName, objectName);
      return {
        success: true,
        info: stat
      };
    } catch (error) {
      logger.error('❌ 獲取文件信息失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 列出存儲桶中的文件
   */
  async listFiles(bucketName, prefix = '') {
    try {
      const objectsList = [];
      const stream = this.client.listObjects(bucketName, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          objectsList.push(obj);
        });
        
        stream.on('error', (err) => {
          logger.error('❌ 列出文件失敗:', err);
          reject(err);
        });
        
        stream.on('end', () => {
          resolve({
            success: true,
            files: objectsList
          });
        });
      });
    } catch (error) {
      logger.error('❌ 列出文件失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 獲取存儲桶統計信息
   */
  async getBucketStats(bucketName) {
    try {
      const files = await this.listFiles(bucketName);
      if (!files.success) {
        return files;
      }

      const totalFiles = files.files.length;
      const totalSize = files.files.reduce((sum, file) => sum + file.size, 0);

      return {
        success: true,
        stats: {
          bucketName,
          totalFiles,
          totalSize,
          files: files.files
        }
      };
    } catch (error) {
      logger.error('❌ 獲取存儲桶統計失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 斷開連接
   */
  async disconnect() {
    try {
      this.client = null;
      logger.info('✅ MinIO 連接已斷開');
    } catch (error) {
      logger.error('❌ 斷開 MinIO 連接失敗:', error);
    }
  }

  /**
   * 獲取配置信息
   */
  getConfig() {
    return {
      settings: this.settings,
      buckets: this.buckets,
      imageConfig: this.imageConfig
    };
  }
}

// 創建單例實例
const minioManager = new MinioManager();

module.exports = {
  MinioManager,
  minioManager,
  // 導出配置常量
  BUCKETS: minioManager.buckets,
  IMAGE_CONFIG: minioManager.imageConfig
};
