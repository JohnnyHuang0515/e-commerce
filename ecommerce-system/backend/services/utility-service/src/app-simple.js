const express = require('express');
const cors = require('cors');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3019;

// 中間件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 模擬數據
let files = [];
let backups = [];
let restores = [];

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'utility-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      environment: 'development',
      filesInMemory: files.length,
      backupsInMemory: backups.length,
      restoresInMemory: restores.length
    },
    message: 'Utility service is healthy'
  });
});

// 上傳檔案 (模擬)
app.post('/api/v1/utility/files/upload', (req, res) => {
  try {
    const { uploadedBy, uploadedByType = 'user', tags = [], isPublic = false } = req.body;
    
    // 模擬檔案上傳
    const mockFiles = [
      {
        id: Date.now().toString(),
        filename: `file-${Date.now()}.jpg`,
        originalName: 'sample-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        path: '/uploads/images/file-123.jpg',
        url: '/uploads/images/file-123.jpg',
        category: 'images',
        uploadedBy,
        uploadedByType,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
        isPublic: isPublic === 'true',
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    files.push(...mockFiles);

    res.status(201).json({
      success: true,
      data: mockFiles,
      message: `成功上傳 ${mockFiles.length} 個檔案`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '檔案上傳失敗',
      error: error.message
    });
  }
});

// 獲取檔案列表
app.get('/api/v1/utility/files', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      uploadedBy, 
      uploadedByType,
      isPublic
    } = req.query;

    let filteredFiles = [...files];
    
    if (category) filteredFiles = filteredFiles.filter(f => f.category === category);
    if (uploadedBy) filteredFiles = filteredFiles.filter(f => f.uploadedBy === uploadedBy);
    if (uploadedByType) filteredFiles = filteredFiles.filter(f => f.uploadedByType === uploadedByType);
    if (isPublic !== undefined) filteredFiles = filteredFiles.filter(f => f.isPublic === (isPublic === 'true'));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredFiles.length,
        pages: Math.ceil(filteredFiles.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取檔案列表失敗',
      error: error.message
    });
  }
});

// 獲取單個檔案
app.get('/api/v1/utility/files/:id', (req, res) => {
  try {
    const file = files.find(f => f.id === req.params.id);
    
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
    res.status(500).json({
      success: false,
      message: '獲取檔案失敗',
      error: error.message
    });
  }
});

// 下載檔案 (模擬)
app.get('/api/v1/utility/files/:id/download', (req, res) => {
  try {
    const file = files.find(f => f.id === req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '檔案不存在'
      });
    }

    // 模擬下載次數增加
    file.downloadCount += 1;
    file.lastAccessed = new Date();

    res.json({
      success: true,
      message: '檔案下載成功',
      data: {
        filename: file.originalName,
        url: file.url,
        downloadCount: file.downloadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '檔案下載失敗',
      error: error.message
    });
  }
});

// 刪除檔案
app.delete('/api/v1/utility/files/:id', (req, res) => {
  try {
    const fileIndex = files.findIndex(f => f.id === req.params.id);
    
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '檔案不存在'
      });
    }

    files.splice(fileIndex, 1);

    res.json({
      success: true,
      message: '檔案刪除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '檔案刪除失敗',
      error: error.message
    });
  }
});

// 創建備份
app.post('/api/v1/utility/backups', (req, res) => {
  try {
    const { name, description, type = 'manual', source, destination, createdBy, createdByType = 'user' } = req.body;

    const backup = {
      id: Date.now().toString(),
      name,
      description,
      type,
      status: 'completed',
      source: source || '/uploads',
      destination: destination || `/backups/${name}-${Date.now()}.zip`,
      size: 52428800, // 50MB
      fileCount: 150,
      compressionEnabled: true,
      encryptionEnabled: false,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 5000,
      createdBy,
      createdByType,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    backups.push(backup);

    res.status(201).json({
      success: true,
      data: backup,
      message: '備份任務已創建'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '創建備份失敗',
      error: error.message
    });
  }
});

// 獲取備份列表
app.get('/api/v1/utility/backups', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status,
      createdBy,
      createdByType
    } = req.query;

    let filteredBackups = [...backups];
    
    if (type) filteredBackups = filteredBackups.filter(b => b.type === type);
    if (status) filteredBackups = filteredBackups.filter(b => b.status === status);
    if (createdBy) filteredBackups = filteredBackups.filter(b => b.createdBy === createdBy);
    if (createdByType) filteredBackups = filteredBackups.filter(b => b.createdByType === createdByType);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBackups = filteredBackups.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedBackups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredBackups.length,
        pages: Math.ceil(filteredBackups.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取備份列表失敗',
      error: error.message
    });
  }
});

// 創建還原
app.post('/api/v1/utility/restores', (req, res) => {
  try {
    const { backupId, name, description, destination, createdBy, createdByType = 'user' } = req.body;

    const backup = backups.find(b => b.id === backupId);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: '備份不存在'
      });
    }

    const restore = {
      id: Date.now().toString(),
      backupId,
      name,
      description,
      status: 'completed',
      source: backup.destination,
      destination: destination || backup.source,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 3000,
      createdBy,
      createdByType,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    restores.push(restore);

    res.status(201).json({
      success: true,
      data: restore,
      message: '還原任務已創建'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '創建還原失敗',
      error: error.message
    });
  }
});

// 獲取還原列表
app.get('/api/v1/utility/restores', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      backupId,
      createdBy,
      createdByType
    } = req.query;

    let filteredRestores = [...restores];
    
    if (status) filteredRestores = filteredRestores.filter(r => r.status === status);
    if (backupId) filteredRestores = filteredRestores.filter(r => r.backupId === backupId);
    if (createdBy) filteredRestores = filteredRestores.filter(r => r.createdBy === createdBy);
    if (createdByType) filteredRestores = filteredRestores.filter(r => r.createdByType === createdByType);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRestores = filteredRestores.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedRestores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredRestores.length,
        pages: Math.ceil(filteredRestores.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取還原列表失敗',
      error: error.message
    });
  }
});

// 獲取系統統計
app.get('/api/v1/utility/stats', (req, res) => {
  try {
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      totalBackups: backups.length,
      totalRestores: restores.length,
      byCategory: {
        images: files.filter(f => f.category === 'images').length,
        documents: files.filter(f => f.category === 'documents').length,
        archives: files.filter(f => f.category === 'archives').length,
        data: files.filter(f => f.category === 'data').length,
        other: files.filter(f => f.category === 'other').length
      },
      byStatus: {
        backups: {
          completed: backups.filter(b => b.status === 'completed').length,
          failed: backups.filter(b => b.status === 'failed').length,
          running: backups.filter(b => b.status === 'running').length
        },
        restores: {
          completed: restores.filter(r => r.status === 'completed').length,
          failed: restores.filter(r => r.status === 'failed').length,
          running: restores.filter(r => r.status === 'running').length
        }
      },
      dateRange: { 
        start: new Date(), 
        end: new Date() 
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取系統統計失敗',
      error: error.message
    });
  }
});

// CSV匯出
app.get('/api/v1/utility/export/csv', (req, res) => {
  try {
    const { type } = req.query;
    
    let csvData = '';
    let filename = 'export.csv';

    switch (type) {
      case 'files':
        csvData = 'filename,originalName,mimeType,size,category,uploadedBy,createdAt\n';
        files.forEach(file => {
          csvData += `${file.filename},${file.originalName},${file.mimeType},${file.size},${file.category},${file.uploadedBy},${file.createdAt}\n`;
        });
        filename = 'files-export.csv';
        break;

      case 'backups':
        csvData = 'name,type,status,size,fileCount,createdBy,createdAt\n';
        backups.forEach(backup => {
          csvData += `${backup.name},${backup.type},${backup.status},${backup.size},${backup.fileCount},${backup.createdBy},${backup.createdAt}\n`;
        });
        filename = 'backups-export.csv';
        break;

      case 'restores':
        csvData = 'name,backupId,status,createdBy,createdAt\n';
        restores.forEach(restore => {
          csvData += `${restore.name},${restore.backupId},${restore.status},${restore.createdBy},${restore.createdAt}\n`;
        });
        filename = 'restores-export.csv';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '不支援的匯出類型'
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CSV匯出失敗',
      error: error.message
    });
  }
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在'
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: '內部服務器錯誤',
    error: err.message
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🔧 Utility Service started on port ${PORT}`);
  console.log(`📍 Environment: development`);
  console.log(`📍 Using in-memory storage for testing`);
});
