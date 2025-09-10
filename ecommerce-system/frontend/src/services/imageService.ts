import { imageApi, ApiResponse, PaginatedResponse } from './api';

// 圖片相關類型定義
export interface Image {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectName: string;
  url: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  entityType: 'product' | 'user' | 'category';
  entityId: string;
  tags: string[];
  description?: string;
  status: 'active' | 'inactive' | 'deleted';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  fileSizeFormatted?: string;
  dimensions?: string;
}

export interface ImageUploadRequest {
  entityType: 'product' | 'user' | 'category';
  entityId: string;
  description?: string;
  tags?: string;
}

export interface ImageSearchParams {
  entityType?: 'product' | 'user' | 'category';
  entityId?: string;
  bucket?: string;
  page?: number;
  limit?: number;
}

export interface ImageStats {
  totalImages: number;
  totalSize: number;
  byBucket: Array<{
    _id: string;
    count: number;
    totalSize: number;
  }>;
}

export interface BatchUploadResult {
  uploaded: Image[];
  errors: Array<{
    filename: string;
    errors: string[];
  }>;
}

// 圖片 API 服務類
export class ImageService {
  // 上傳單個圖片
  static async uploadImage(
    file: File, 
    request: ImageUploadRequest
  ): Promise<ApiResponse<Image>> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('entityType', request.entityType);
      formData.append('entityId', request.entityId);
      
      if (request.description) {
        formData.append('description', request.description);
      }
      
      if (request.tags) {
        formData.append('tags', request.tags);
      }

      const response = await imageApi.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      throw error;
    }
  }

  // 批量上傳圖片
  static async uploadImages(
    files: File[], 
    request: ImageUploadRequest
  ): Promise<ApiResponse<BatchUploadResult>> {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('images', file);
      });
      
      formData.append('entityType', request.entityType);
      formData.append('entityId', request.entityId);
      
      if (request.description) {
        formData.append('description', request.description);
      }
      
      if (request.tags) {
        formData.append('tags', request.tags);
      }

      const response = await imageApi.post('/images/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('批量上傳圖片失敗:', error);
      throw error;
    }
  }

  // 獲取圖片列表
  static async getImages(params?: ImageSearchParams): Promise<ApiResponse<PaginatedResponse<Image>>> {
    try {
      const response = await imageApi.get('/images', { params });
      return response.data;
    } catch (error) {
      console.error('獲取圖片列表失敗:', error);
      throw error;
    }
  }

  // 獲取單個圖片
  static async getImage(imageId: string): Promise<ApiResponse<Image>> {
    try {
      const response = await imageApi.get(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('獲取圖片失敗:', error);
      throw error;
    }
  }

  // 刪除圖片
  static async deleteImage(imageId: string): Promise<ApiResponse<void>> {
    try {
      const response = await imageApi.delete(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('刪除圖片失敗:', error);
      throw error;
    }
  }

  // 獲取圖片統計
  static async getImageStats(): Promise<ApiResponse<ImageStats>> {
    try {
      const response = await imageApi.get('/images/stats');
      return response.data;
    } catch (error) {
      console.error('獲取圖片統計失敗:', error);
      throw error;
    }
  }

  // 根據實體獲取圖片
  static async getImagesByEntity(
    entityType: 'product' | 'user' | 'category',
    entityId: string
  ): Promise<ApiResponse<Image[]>> {
    try {
      const response = await imageApi.get('/images', {
        params: { entityType, entityId }
      });
      return response.data;
    } catch (error) {
      console.error('獲取實體圖片失敗:', error);
      throw error;
    }
  }

  // 生成圖片 URL
  static getImageUrl(image: Image, thumbnail = false): string {
    if (thumbnail && image.thumbnailUrl) {
      return image.thumbnailUrl;
    }
    return image.url;
  }

  // 驗證圖片文件
  static validateImageFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      errors.push(`文件大小超過限制 (${maxSize / 1024 / 1024}MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`不支持的文件類型: ${file.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 預覽圖片
  static createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 壓縮圖片
  static async compressImage(
    file: File, 
    quality: number = 0.8, 
    maxWidth: number = 1920
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 計算新尺寸
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製壓縮後的圖片
        ctx?.drawImage(img, 0, 0, width, height);

        // 轉換為 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('圖片壓縮失敗'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

export default ImageService;
