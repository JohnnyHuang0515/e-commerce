const Product = require('../models/productModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Minio = require('minio');

// MinIO 配置
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'ecommerce-minio-files',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

// 確保 bucket 存在並設置公開讀取權限
const ensureBucketExists = async (bucketName) => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ MinIO bucket '${bucketName}' 創建成功`);
    }
    
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
    
    try {
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✅ 設置存儲桶策略: ${bucketName}`);
    } catch (policyError) {
      console.warn(`⚠️ 設置存儲桶策略失敗: ${policyError.message}`);
    }
  } catch (error) {
    console.error('❌ MinIO bucket 創建失敗:', error);
  }
};

// 初始化 bucket
ensureBucketExists('images');

// 配置 multer 用於內存存儲
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片文件'), false);
    }
  }
});

// 創建圖片模型
const ImageSchema = new (require('mongoose').Schema)({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  bucket: { type: String, default: 'images' },
  objectName: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  description: String,
  tags: [String],
  status: { type: String, default: 'active' },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const Image = require('mongoose').model('Image', ImageSchema);

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: { items: products, total: products.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductStatistics = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const productsByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const statistics = {
      totalProducts,
      productsByCategory: productsByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averagePrice: 0, // 可以後續實作
      topSellingProducts: [] // 可以後續實作
    };

    res.json({
      success: true,
      message: '商品統計數據獲取成功',
      data: statistics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 圖片上傳相關方法
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '沒有上傳文件' });
    }

    const { entityType, entityId, description, tags } = req.body;
    
    // 生成唯一文件名
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const objectName = `images/${entityType || 'product'}/${entityId || 'unknown'}/${fileName}`;
    
    // 上傳到 MinIO
    await minioClient.putObject('images', objectName, req.file.buffer, {
      'Content-Type': req.file.mimetype,
      'Content-Length': req.file.size
    });
    
    // 生成公開訪問 URL
    const imageUrl = `http://localhost:9010/${objectName}`;
    
    const imageData = {
      filename: fileName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: imageUrl,
      bucket: 'images',
      objectName: objectName,
      entityType: entityType || 'product',
      entityId: entityId || 'unknown',
      description: description || '',
      tags: tags ? tags.split(',') : []
    };

    const image = new Image(imageData);
    await image.save();

    res.json({
      success: true,
      data: image,
      message: '圖片上傳成功'
    });
  } catch (error) {
    console.error('圖片上傳錯誤:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '沒有上傳文件' });
    }

    const { entityType, entityId, description, tags } = req.body;
    const uploadedImages = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // 生成唯一文件名
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const objectName = `images/${entityType || 'product'}/${entityId || 'unknown'}/${fileName}`;
        
        // 上傳到 MinIO
        await minioClient.putObject('images', objectName, file.buffer, {
          'Content-Type': file.mimetype,
          'Content-Length': file.size
        });
        
        // 生成公開訪問 URL
        const imageUrl = `http://localhost:9010/${objectName}`;
        
        const imageData = {
          filename: fileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: imageUrl,
          bucket: 'images',
          objectName: objectName,
          entityType: entityType || 'product',
          entityId: entityId || 'unknown',
          description: description || '',
          tags: tags ? tags.split(',') : []
        };

        const image = new Image(imageData);
        await image.save();
        uploadedImages.push(image);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          errors: [error.message]
        });
      }
    }

    res.json({
      success: true,
      data: {
        uploaded: uploadedImages,
        errors: errors
      },
      message: `成功上傳 ${uploadedImages.length} 張圖片`
    });
  } catch (error) {
    console.error('批量上傳圖片錯誤:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getImages = async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;

    const skip = (page - 1) * limit;
    const images = await Image.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Image.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items: images,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('獲取圖片列表錯誤:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: '圖片不存在' });
    }

    res.json({ success: true, data: image });
  } catch (error) {
    console.error('獲取圖片錯誤:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: '圖片不存在' });
    }

    // 從 MinIO 刪除文件
    try {
      await minioClient.removeObject(image.bucket || 'images', image.objectName);
    } catch (minioError) {
      console.warn('MinIO 刪除文件失敗:', minioError.message);
      // 繼續執行，不因為 MinIO 錯誤而中斷
    }

    await Image.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: '圖片刪除成功' });
  } catch (error) {
    console.error('刪除圖片錯誤:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getImageStats = async (req, res) => {
  try {
    const totalImages = await Image.countDocuments();
    const totalSize = await Image.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);

    const byBucket = await Image.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 }, totalSize: { $sum: '$size' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalImages,
        totalSize: totalSize[0]?.totalSize || 0,
        byBucket
      }
    });
  } catch (error) {
    console.error('獲取圖片統計錯誤:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 導出 multer 中間件
exports.upload = upload;