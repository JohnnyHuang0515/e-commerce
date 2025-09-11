import React, { useState } from 'react';
import { Upload, Button, Image, Modal, message, Progress } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { ImageService, Image as ImageType } from '../../services/imageService';
import './ImageUpload.less';

interface ImageUploadProps {
  entityType: 'product' | 'user' | 'category';
  entityId: string;
  images?: ImageType[];
  maxCount?: number;
  onChange?: (images: ImageType[]) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  entityType,
  entityId,
  images = [],
  maxCount = 5,
  onChange,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // 上傳圖片
  const handleUpload = async (file: File) => {
    // 驗證文件
    const validation = ImageService.validateImageFile(file);
    if (!validation.isValid) {
      message.error(validation.errors.join(', '));
      return false;
    }

    // 檢查數量限制
    if (images.length >= maxCount) {
      message.error(`最多只能上傳 ${maxCount} 張圖片`);
      return false;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 壓縮圖片
      const compressedFile = await ImageService.compressImage(file, 0.8, 1920);
      
      // 模擬上傳進度 - 改進進度邏輯
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 15;
        });
      }, 150);

      // 上傳到服務器
      const response = await ImageService.uploadImage(compressedFile, {
        entityType,
        entityId,
        description: `上傳的圖片`,
        tags: entityType
      });

      // 確保進度條完成
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        const newImages = [...images, response.data];
        onChange?.(newImages);
        message.success('圖片上傳成功');
        
        // 延遲重置狀態，讓用戶看到100%完成
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        message.error('圖片上傳失敗');
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('上傳圖片錯誤:', error);
      message.error('圖片上傳失敗');
      setUploading(false);
      setUploadProgress(0);
    }

    return false; // 阻止默認上傳行為
  };

  // 刪除圖片
  const handleDelete = async (imageId: string) => {
    try {
      await ImageService.deleteImage(imageId);
      const newImages = images.filter(img => img._id !== imageId);
      onChange?.(newImages);
      message.success('圖片刪除成功');
    } catch (error) {
      console.error('刪除圖片錯誤:', error);
      message.error('圖片刪除失敗');
    }
  };

  // 預覽圖片
  const handlePreview = (image: ImageType) => {
    setPreviewImage(image.url);
    setPreviewVisible(true);
  };

  // 自定義上傳按鈕
  const uploadButton = (
    <div className="upload-button">
      <PlusOutlined />
      <div className="upload-text">上傳圖片</div>
    </div>
  );

  return (
    <div className="image-upload">
      <div className="image-list">
        {images.map((image) => (
          <div key={image._id} className="image-item">
            <Image
              src={image.thumbnailUrl || image.url}
              alt={image.filename}
              className="uploaded-image"
              preview={false}
            />
            <div className="image-actions">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(image)}
                size="small"
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(image._id)}
                size="small"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
        
        {images.length < maxCount && (
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={disabled || uploading}
            accept="image/*"
          >
            {uploadButton}
          </Upload>
        )}
      </div>

      {/* 上傳進度 */}
      {uploading && (
        <div className="upload-progress">
          <Progress percent={uploadProgress} size="small" />
        </div>
      )}

      {/* 圖片預覽 */}
      <Modal
        open={previewVisible}
        title="圖片預覽"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <Image
          src={previewImage}
          alt="預覽圖片"
          style={{ width: '100%' }}
        />
      </Modal>

      {/* 上傳提示 */}
      <div className="upload-tips">
        <p>支持格式：JPEG、PNG、GIF、WebP</p>
        <p>最大文件大小：10MB</p>
        <p>建議尺寸：1920x1080 或以上</p>
      </div>
    </div>
  );
};

export default ImageUpload;
