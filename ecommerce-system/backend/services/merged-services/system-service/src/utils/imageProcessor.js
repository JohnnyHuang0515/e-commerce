const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const logger = require('./logger');

/**
 * 圖片處理工具類
 */
class ImageProcessor {
  constructor() {
    this.allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.thumbnailSize = 300;
    this.quality = 80;
  }

  /**
   * 驗證圖片文件
   */
  validateImage(file) {
    const errors = [];
    
    // 檢查文件是否存在
    if (!file) {
      errors.push('沒有上傳文件');
      return { isValid: false, errors };
    }
    
    // 檢查文件類型
    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push(`不支持的文件類型: ${file.mimetype}`);
    }
    
    // 檢查文件大小
    if (file.size > this.maxFileSize) {
      errors.push(`文件大小超過限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // 檢查文件緩衝區
    if (!file.buffer || file.buffer.length === 0) {
      errors.push('文件內容為空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成唯一文件名
   */
  generateUniqueFileName(originalName, entityType, entityId) {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    
    return `${entityType}/${entityId}/${timestamp}_${uuid}${ext}`;
  }

  /**
   * 處理圖片（壓縮、格式轉換）
   */
  async processImage(buffer) {
    try {
      logger.info('🔄 開始處理圖片...');
      
      // 獲取圖片元數據
      const metadata = await sharp(buffer).metadata();
      logger.info(`📏 原始圖片尺寸: ${metadata.width}x${metadata.height}`);
      
      // 處理圖片
      let processedBuffer;
      
      if (metadata.format === 'gif') {
        // GIF 保持原樣，不進行壓縮
        processedBuffer = buffer;
      } else {
        // 其他格式進行壓縮和優化
        processedBuffer = await sharp(buffer)
          .jpeg({ 
            quality: this.quality,
            progressive: true,
            mozjpeg: true
          })
          .png({ 
            quality: this.quality,
            progressive: true,
            compressionLevel: 9
          })
          .webp({ 
            quality: this.quality,
            lossless: false
          })
          .toBuffer();
      }
      
      // 獲取處理後的元數據
      const processedMetadata = await sharp(processedBuffer).metadata();
      
      logger.info(`✅ 圖片處理完成`);
      logger.info(`📊 原始大小: ${(buffer.length / 1024).toFixed(2)}KB`);
      logger.info(`📊 處理後大小: ${(processedBuffer.length / 1024).toFixed(2)}KB`);
      logger.info(`📏 處理後尺寸: ${processedMetadata.width}x${processedMetadata.height}`);
      
      return {
        success: true,
        buffer: processedBuffer,
        metadata: processedMetadata,
        originalSize: buffer.length,
        processedSize: processedBuffer.length,
        compressionRatio: ((buffer.length - processedBuffer.length) / buffer.length * 100).toFixed(2)
      };
      
    } catch (error) {
      logger.error('❌ 圖片處理失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成縮略圖
   */
  async generateThumbnail(buffer) {
    try {
      logger.info('🔄 生成縮略圖...');
      
      const thumbnailBuffer = await sharp(buffer)
        .resize(this.thumbnailSize, this.thumbnailSize, {
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ 
          quality: this.quality,
          progressive: true
        })
        .toBuffer();
      
      const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
      
      logger.info(`✅ 縮略圖生成完成: ${thumbnailMetadata.width}x${thumbnailMetadata.height}`);
      
      return {
        success: true,
        buffer: thumbnailBuffer,
        metadata: thumbnailMetadata
      };
      
    } catch (error) {
      logger.error('❌ 縮略圖生成失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量處理圖片
   */
  async processImages(buffers) {
    try {
      logger.info(`🔄 開始批量處理 ${buffers.length} 張圖片...`);
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < buffers.length; i++) {
        try {
          const result = await this.processImage(buffers[i]);
          if (result.success) {
            results.push(result);
          } else {
            errors.push({
              index: i,
              error: result.error
            });
          }
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }
      
      logger.info(`✅ 批量處理完成: ${results.length} 成功, ${errors.length} 失敗`);
      
      return {
        success: true,
        results,
        errors,
        summary: {
          total: buffers.length,
          success: results.length,
          failed: errors.length
        }
      };
      
    } catch (error) {
      logger.error('❌ 批量處理失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 獲取圖片信息
   */
  async getImageInfo(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      return {
        success: true,
        info: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: buffer.length,
          channels: metadata.channels,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          colorSpace: metadata.space
        }
      };
      
    } catch (error) {
      logger.error('❌ 獲取圖片信息失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 調整圖片尺寸
   */
  async resizeImage(buffer, width, height, options = {}) {
    try {
      const {
        fit = 'inside',
        withoutEnlargement = true,
        background = { r: 255, g: 255, b: 255, alpha: 1 }
      } = options;
      
      const resizedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit,
          withoutEnlargement,
          background
        })
        .jpeg({ quality: this.quality })
        .png({ quality: this.quality })
        .webp({ quality: this.quality })
        .toBuffer();
      
      const metadata = await sharp(resizedBuffer).metadata();
      
      return {
        success: true,
        buffer: resizedBuffer,
        metadata
      };
      
    } catch (error) {
      logger.error('❌ 調整圖片尺寸失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 轉換圖片格式
   */
  async convertFormat(buffer, targetFormat) {
    try {
      let convertedBuffer;
      
      switch (targetFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          convertedBuffer = await sharp(buffer).jpeg({ quality: this.quality }).toBuffer();
          break;
        case 'png':
          convertedBuffer = await sharp(buffer).png({ quality: this.quality }).toBuffer();
          break;
        case 'webp':
          convertedBuffer = await sharp(buffer).webp({ quality: this.quality }).toBuffer();
          break;
        default:
          throw new Error(`不支持的目標格式: ${targetFormat}`);
      }
      
      const metadata = await sharp(convertedBuffer).metadata();
      
      return {
        success: true,
        buffer: convertedBuffer,
        metadata,
        format: targetFormat
      };
      
    } catch (error) {
      logger.error('❌ 轉換圖片格式失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ImageProcessor;
