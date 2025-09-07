const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Image = require('../models/Image');
const { minioClient, BUCKETS, IMAGE_CONFIG } = require('../config/minio');
const ImageProcessor = require('../utils/imageProcessor');

// Multer 配置 - 內存存儲
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: IMAGE_CONFIG.MAX_FILE_SIZE,
    files: 10 // 最多10個文件
  },
  fileFilter: (req, file, cb) => {
    if (IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件類型: ${file.mimetype}`), false);
    }
  }
});

/**
 * 圖片控制器
 */
class ImageController {
  /**
   * 上傳單個圖片
   */
  static async uploadSingle(req, res) {
    try {
      const { entityType, entityId, description, tags } = req.body;
      const file = req.file;
      
      // 驗證參數
      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必要參數: entityType, entityId'
          }
        });
      }
      
      // 驗證文件
      const validation = ImageProcessor.validateImage(file);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: validation.errors.join(', ')
          }
        });
      }
      
      // 生成唯一文件名
      const objectName = ImageProcessor.generateUniqueFileName(
        file.originalname,
        entityType,
        entityId
      );
      
      // 處理圖片
      const processResult = await ImageProcessor.processImage(file.buffer);
      if (!processResult.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'IMAGE_PROCESSING_ERROR',
            message: processResult.error
          }
        });
      }
      
      // 生成縮略圖
      const thumbnailResult = await ImageProcessor.generateThumbnail(file.buffer);
      
      // 確定存儲桶
      let bucket;
      switch (entityType) {
        case 'product':
          bucket = BUCKETS.PRODUCTS;
          break;
        case 'user':
          bucket = BUCKETS.AVATARS;
          break;
        case 'category':
          bucket = BUCKETS.CATEGORIES;
          break;
        default:
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ENTITY_TYPE',
              message: '不支持的實體類型'
            }
          });
      }
      
      // 上傳到 MinIO
      await minioClient.putObject(
        bucket,
        objectName,
        processResult.buffer,
        processResult.buffer.length,
        {
          'Content-Type': file.mimetype,
          'X-Original-Name': file.originalname
        }
      );
      
      // 上傳縮略圖
      let thumbnailObjectName = null;
      if (thumbnailResult.success) {
        thumbnailObjectName = `thumbnails/${objectName}`;
        await minioClient.putObject(
          bucket,
          thumbnailObjectName,
          thumbnailResult.buffer,
          thumbnailResult.buffer.length,
          {
            'Content-Type': 'image/jpeg',
            'X-Thumbnail': 'true'
          }
        );
      }
      
      // 生成訪問 URL
      const baseUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
      const url = `${baseUrl}/${bucket}/${objectName}`;
      const thumbnailUrl = thumbnailObjectName ? 
        `${baseUrl}/${bucket}/${thumbnailObjectName}` : null;
      
      // 保存到數據庫
      const image = new Image({
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: processResult.buffer.length,
        bucket,
        objectName,
        url,
        width: processResult.metadata.width,
        height: processResult.metadata.height,
        thumbnailUrl,
        entityType,
        entityId,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        description: description || ''
      });
      
      await image.save();
      
      res.status(201).json({
        success: true,
        data: image,
        message: '圖片上傳成功'
      });
      
    } catch (error) {
      console.error('上傳圖片錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: '圖片上傳失敗'
        }
      });
    }
  }
  
  /**
   * 批量上傳圖片
   */
  static async uploadMultiple(req, res) {
    try {
      const { entityType, entityId, description, tags } = req.body;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES',
            message: '沒有上傳文件'
          }
        });
      }
      
      const results = [];
      const errors = [];
      
      for (const file of files) {
        try {
          // 驗證文件
          const validation = ImageProcessor.validateImage(file);
          if (!validation.isValid) {
            errors.push({
              filename: file.originalname,
              errors: validation.errors
            });
            continue;
          }
          
          // 生成唯一文件名
          const objectName = ImageProcessor.generateUniqueFileName(
            file.originalname,
            entityType,
            entityId
          );
          
          // 處理圖片
          const processResult = await ImageProcessor.processImage(file.buffer);
          if (!processResult.success) {
            errors.push({
              filename: file.originalname,
              errors: [processResult.error]
            });
            continue;
          }
          
          // 確定存儲桶
          let bucket;
          switch (entityType) {
            case 'product':
              bucket = BUCKETS.PRODUCTS;
              break;
            case 'user':
              bucket = BUCKETS.AVATARS;
              break;
            case 'category':
              bucket = BUCKETS.CATEGORIES;
              break;
            default:
              errors.push({
                filename: file.originalname,
                errors: ['不支持的實體類型']
              });
              continue;
          }
          
          // 上傳到 MinIO
          await minioClient.putObject(
            bucket,
            objectName,
            processResult.buffer,
            processResult.buffer.length,
            {
              'Content-Type': file.mimetype,
              'X-Original-Name': file.originalname
            }
          );
          
          // 生成訪問 URL
          const baseUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
          const url = `${baseUrl}/${bucket}/${objectName}`;
          
          // 保存到數據庫
          const image = new Image({
            filename: file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: processResult.buffer.length,
            bucket,
            objectName,
            url,
            width: processResult.metadata.width,
            height: processResult.metadata.height,
            entityType,
            entityId,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            description: description || ''
          });
          
          await image.save();
          results.push(image);
          
        } catch (error) {
          errors.push({
            filename: file.originalname,
            errors: [error.message]
          });
        }
      }
      
      res.status(201).json({
        success: true,
        data: {
          uploaded: results,
          errors: errors
        },
        message: `成功上傳 ${results.length} 個圖片，${errors.length} 個失敗`
      });
      
    } catch (error) {
      console.error('批量上傳圖片錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_UPLOAD_ERROR',
          message: '批量上傳失敗'
        }
      });
    }
  }
  
  /**
   * 獲取圖片列表
   */
  static async getImages(req, res) {
    try {
      const { entityType, entityId, bucket, page = 1, limit = 20 } = req.query;
      
      let query = { status: 'active' };
      
      if (entityType && entityId) {
        query.entityType = entityType;
        query.entityId = entityId;
      }
      
      if (bucket) {
        query.bucket = bucket;
      }
      
      const skip = (page - 1) * limit;
      const images = await Image.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Image.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          images,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('獲取圖片列表錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: '獲取圖片列表失敗'
        }
      });
    }
  }
  
  /**
   * 獲取單個圖片
   */
  static async getImage(req, res) {
    try {
      const { id } = req.params;
      
      const image = await Image.findById(id);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: '圖片不存在'
          }
        });
      }
      
      res.json({
        success: true,
        data: image
      });
      
    } catch (error) {
      console.error('獲取圖片錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: '獲取圖片失敗'
        }
      });
    }
  }
  
  /**
   * 刪除圖片
   */
  static async deleteImage(req, res) {
    try {
      const { id } = req.params;
      
      const image = await Image.findById(id);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: '圖片不存在'
          }
        });
      }
      
      // 從 MinIO 刪除文件
      try {
        await minioClient.removeObject(image.bucket, image.objectName);
        
        // 刪除縮略圖
        if (image.thumbnailUrl) {
          const thumbnailObjectName = image.thumbnailUrl.split('/').pop();
          await minioClient.removeObject(image.bucket, `thumbnails/${thumbnailObjectName}`);
        }
      } catch (minioError) {
        console.warn('MinIO 刪除文件失敗:', minioError);
      }
      
      // 軟刪除數據庫記錄
      await Image.softDelete(id);
      
      res.json({
        success: true,
        message: '圖片刪除成功'
      });
      
    } catch (error) {
      console.error('刪除圖片錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: '刪除圖片失敗'
        }
      });
    }
  }
  
  /**
   * 獲取圖片統計
   */
  static async getImageStats(req, res) {
    try {
      const stats = await Image.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$bucket',
            count: { $sum: 1 },
            totalSize: { $sum: '$size' }
          }
        }
      ]);
      
      const totalImages = await Image.countDocuments({ status: 'active' });
      const totalSize = await Image.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);
      
      res.json({
        success: true,
        data: {
          totalImages,
          totalSize: totalSize[0]?.totalSize || 0,
          byBucket: stats
        }
      });
      
    } catch (error) {
      console.error('獲取圖片統計錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: '獲取統計信息失敗'
        }
      });
    }
  }
}

module.exports = {
  ImageController,
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 10)
};
