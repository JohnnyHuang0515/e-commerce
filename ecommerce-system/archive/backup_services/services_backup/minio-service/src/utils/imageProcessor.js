const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { IMAGE_CONFIG } = require('../config/minio');

/**
 * 圖片處理工具類
 */
class ImageProcessor {
  /**
   * 驗證圖片文件
   * @param {Object} file - Multer 文件對象
   * @returns {Object} 驗證結果
   */
  static validateImage(file) {
    const errors = [];
    
    // 檢查文件是否存在
    if (!file) {
      errors.push('沒有上傳文件');
      return { isValid: false, errors };
    }
    
    // 檢查文件大小
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      errors.push(`文件大小超過限制 (${IMAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }
    
    // 檢查文件類型
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      errors.push(`不支持的文件類型: ${file.mimetype}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 生成唯一文件名
   * @param {string} originalName - 原始文件名
   * @param {string} entityType - 實體類型
   * @param {string} entityId - 實體ID
   * @returns {string} 唯一文件名
   */
  static generateUniqueFileName(originalName, entityType, entityId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    return `${entityType}/${entityId}/${timestamp}-${random}-${baseName}${ext}`;
  }
  
  /**
   * 處理圖片（壓縮、調整大小等）
   * @param {Buffer} buffer - 圖片緩衝區
   * @param {Object} options - 處理選項
   * @returns {Object} 處理結果
   */
  static async processImage(buffer, options = {}) {
    try {
      const {
        width = null,
        height = null,
        quality = IMAGE_CONFIG.QUALITY,
        format = 'jpeg'
      } = options;
      
      let processor = sharp(buffer);
      
      // 獲取原始圖片信息
      const metadata = await processor.metadata();
      
      // 調整大小
      if (width || height) {
        processor = processor.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // 設置格式和質量
      if (format === 'jpeg') {
        processor = processor.jpeg({ quality });
      } else if (format === 'png') {
        processor = processor.png({ quality });
      } else if (format === 'webp') {
        processor = processor.webp({ quality });
      }
      
      // 處理圖片
      const processedBuffer = await processor.toBuffer();
      
      return {
        success: true,
        buffer: processedBuffer,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: processedBuffer.length,
          originalSize: buffer.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 生成縮略圖
   * @param {Buffer} buffer - 原始圖片緩衝區
   * @param {number} size - 縮略圖大小
   * @returns {Object} 縮略圖結果
   */
  static async generateThumbnail(buffer, size = IMAGE_CONFIG.THUMBNAIL_SIZE) {
    try {
      const result = await this.processImage(buffer, {
        width: size,
        height: size,
        quality: 70,
        format: 'jpeg'
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 批量處理圖片
   * @param {Array} images - 圖片數組
   * @param {Object} options - 處理選項
   * @returns {Array} 處理結果數組
   */
  static async processImages(images, options = {}) {
    const results = [];
    
    for (const image of images) {
      const result = await this.processImage(image.buffer, options);
      results.push({
        ...image,
        processed: result
      });
    }
    
    return results;
  }
  
  /**
   * 清理臨時文件
   * @param {Array} filePaths - 文件路徑數組
   */
  static async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`清理臨時文件失敗: ${filePath}`, error.message);
      }
    }
  }
  
  /**
   * 獲取圖片格式信息
   * @param {Buffer} buffer - 圖片緩衝區
   * @returns {Object} 格式信息
   */
  static async getImageInfo(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        success: true,
        info: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length,
          hasAlpha: metadata.hasAlpha,
          density: metadata.density,
          space: metadata.space
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ImageProcessor;
