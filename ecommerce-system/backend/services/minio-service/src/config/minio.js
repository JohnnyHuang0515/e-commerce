const Minio = require('minio');
require('dotenv').config();

// MinIO 客戶端配置
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// 存儲桶配置
const BUCKETS = {
  PRODUCTS: process.env.BUCKET_PRODUCTS || 'product-images',
  AVATARS: process.env.BUCKET_AVATARS || 'user-avatars',
  CATEGORIES: process.env.BUCKET_CATEGORIES || 'category-images'
};

// 圖片處理配置
const IMAGE_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
  QUALITY: parseInt(process.env.IMAGE_QUALITY) || 80,
  THUMBNAIL_SIZE: parseInt(process.env.THUMBNAIL_SIZE) || 300
};

// 初始化存儲桶
const initializeBuckets = async () => {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`✅ 創建存儲桶: ${bucketName}`);
        
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
        
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`✅ 設置存儲桶策略: ${bucketName}`);
      } else {
        console.log(`✅ 存儲桶已存在: ${bucketName}`);
      }
    }
  } catch (error) {
    console.error('❌ 初始化存儲桶失敗:', error);
    throw error;
  }
};

// 測試 MinIO 連接
const testConnection = async () => {
  try {
    const buckets = await minioClient.listBuckets();
    console.log('✅ MinIO 連接成功');
    console.log('📦 可用存儲桶:', buckets.map(b => b.name).join(', '));
    return true;
  } catch (error) {
    console.error('❌ MinIO 連接失敗:', error);
    return false;
  }
};

module.exports = {
  minioClient,
  BUCKETS,
  IMAGE_CONFIG,
  initializeBuckets,
  testConnection
};
