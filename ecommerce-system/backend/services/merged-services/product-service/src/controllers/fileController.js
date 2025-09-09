const { File } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Minio = require('minio');

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
  PRODUCTS: 'product-images',
  AVATARS: 'user-avatars',
  CATEGORIES: 'category-images'
};

// 圖片配置
const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  THUMBNAIL_SIZE: 300
};

// 獲取檔案列表
const getFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 分類篩選
    if (category) {
      whereClause.category = category;
    }

    const { count, rows: files } = await File.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const total = count;

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取檔案列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取檔案列表時發生錯誤'
    });
  }
};

// 上傳檔案
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '沒有上傳檔案'
      });
    }

    const { category = 'general' } = req.body;
    const file = req.file;

    const fileRecord = new File({
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${category}/${file.filename}`,
      category,
      uploaded_by: req.user.userId
    });

    await fileRecord.save();

    res.json({
      success: true,
      message: '檔案上傳成功',
      data: fileRecord
    });
  } catch (error) {
    console.error('上傳檔案錯誤:', error);
    res.status(500).json({
      success: false,
      message: '上傳檔案時發生錯誤'
    });
  }
};

// 獲取檔案詳情
const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '檔案不存在'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('獲取檔案詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取檔案詳情時發生錯誤'
    });
  }
};

// 刪除檔案
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '檔案不存在'
      });
    }

    // 刪除實體檔案
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // 刪除資料庫記錄
    await File.findByIdAndDelete(fileId);

    res.json({
      success: true,
      message: '檔案刪除成功'
    });
  } catch (error) {
    console.error('刪除檔案錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除檔案時發生錯誤'
    });
  }
};

// 下載檔案
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '檔案不存在'
      });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: '檔案已遺失'
      });
    }

    res.download(file.path, file.original_name);
  } catch (error) {
    console.error('下載檔案錯誤:', error);
    res.status(500).json({
      success: false,
      message: '下載檔案時發生錯誤'
    });
  }
};

// 獲取檔案統計
const getFileStatistics = async (req, res) => {
  try {
    const totalFiles = await File.countDocuments();
    const totalSize = await File.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);

    const categoryStats = await File.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$size' } } }
    ]);

    res.json({
      success: true,
      data: {
        total_files: totalFiles,
        total_size: totalSize[0]?.totalSize || 0,
        category_stats: categoryStats
      }
    });
  } catch (error) {
    console.error('獲取檔案統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取檔案統計時發生錯誤'
    });
  }
};

// 批量上傳圖片
const uploadMultiple = async (req, res) => {
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
        // 驗證文件類型
        if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
          errors.push({
            filename: file.originalname,
            errors: [`不支持的文件類型: ${file.mimetype}`]
          });
          continue;
        }
        
        // 驗證文件大小
        if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
          errors.push({
            filename: file.originalname,
            errors: [`文件大小超過限制: ${file.size} > ${IMAGE_CONFIG.MAX_FILE_SIZE}`]
          });
          continue;
        }
        
        // 生成唯一文件名
        const objectName = `${entityType}/${entityId}/${uuidv4()}-${file.originalname}`;
        
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
          file.buffer,
          file.buffer.length,
          {
            'Content-Type': file.mimetype,
            'X-Original-Name': file.originalname
          }
        );
        
        // 生成訪問 URL
        const baseUrl = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`;
        const url = `${baseUrl}/${bucket}/${objectName}`;
        
        // 保存到數據庫
        const fileRecord = new File({
          filename: file.originalname,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size: file.buffer.length,
          path: objectName,
          url: url,
          category: entityType,
          entity_id: entityId,
          description: description || '',
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });
        
        await fileRecord.save();
        results.push(fileRecord);
        
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
};

module.exports = {
  getFiles,
  uploadFile,
  uploadMultiple,
  getFileById,
  deleteFile,
  downloadFile,
  getFileStatistics
};
