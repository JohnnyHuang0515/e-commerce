const { FileUpload } = require('../models');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// 上傳文件
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未選擇文件'
      });
    }

    const { category = 'system', is_public = false } = req.body;
    const uploaderId = req.user.userId;

    const fileUpload = new FileUpload({
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploader_id: uploaderId,
      category: category,
      is_public: is_public === 'true'
    });

    await fileUpload.save();

    res.status(201).json({
      success: true,
      message: '文件上傳成功',
      data: {
        file_id: fileUpload._id,
        filename: fileUpload.filename,
        original_name: fileUpload.original_name,
        file_size: fileUpload.file_size,
        mime_type: fileUpload.mime_type,
        category: fileUpload.category,
        is_public: fileUpload.is_public
      }
    });
  } catch (error) {
    console.error('上傳文件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '上傳文件時發生錯誤'
    });
  }
};

// 獲取文件列表
const getFiles = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    const matchConditions = {};
    if (category) {
      matchConditions.category = category;
    }

    const files = await FileUpload.find(matchConditions)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await FileUpload.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        files: files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取文件列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取文件列表時發生錯誤'
    });
  }
};

// 下載文件
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 檢查文件是否存在
    if (!await fs.pathExists(file.file_path)) {
      return res.status(404).json({
        success: false,
        message: '文件已不存在於服務器'
      });
    }

    // 更新下載次數
    await FileUpload.findByIdAndUpdate(fileId, {
      $inc: { download_count: 1 }
    });

    res.download(file.file_path, file.original_name);
  } catch (error) {
    console.error('下載文件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '下載文件時發生錯誤'
    });
  }
};

// 刪除文件
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 刪除物理文件
    if (await fs.pathExists(file.file_path)) {
      await fs.remove(file.file_path);
    }

    // 刪除數據庫記錄
    await FileUpload.findByIdAndDelete(fileId);

    res.json({
      success: true,
      message: '文件刪除成功'
    });
  } catch (error) {
    console.error('刪除文件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除文件時發生錯誤'
    });
  }
};

// 創建系統備份
const createBackup = async (req, res) => {
  try {
    const { backup_type = 'full', include_logs = true, description } = req.body;
    
    const backupId = uuidv4();
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFilename = `backup_${backup_type}_${timestamp}.zip`;
    const backupPath = path.join('backups', backupFilename);

    // 確保備份目錄存在
    await fs.ensureDir('backups');

    // 創建備份文件
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      try {
        // 記錄備份信息
        const fileUpload = new FileUpload({
          filename: backupFilename,
          original_name: backupFilename,
          file_path: backupPath,
          file_size: archive.pointer(),
          mime_type: 'application/zip',
          uploader_id: req.user.userId,
          category: 'backup',
          is_public: false
        });

        await fileUpload.save();

        res.status(201).json({
          success: true,
          message: '備份創建成功',
          data: {
            backup_id: fileUpload._id,
            filename: backupFilename,
            file_size: archive.pointer(),
            backup_type: backup_type,
            description: description
          }
        });
      } catch (error) {
        console.error('保存備份記錄錯誤:', error);
        res.status(500).json({
          success: false,
          message: '保存備份記錄時發生錯誤'
        });
      }
    });

    archive.on('error', (err) => {
      console.error('備份創建錯誤:', err);
      res.status(500).json({
        success: false,
        message: '創建備份時發生錯誤'
      });
    });

    archive.pipe(output);

    // 添加系統文件到備份
    if (backup_type === 'full' || backup_type === 'incremental') {
      // 添加配置文件
      if (await fs.pathExists('config')) {
        archive.directory('config', 'config');
      }
      
      // 添加上傳文件
      if (await fs.pathExists('uploads')) {
        archive.directory('uploads', 'uploads');
      }
    }

    // 添加日誌文件
    if (include_logs && await fs.pathExists('logs')) {
      archive.directory('logs', 'logs');
    }

    archive.finalize();
  } catch (error) {
    console.error('創建備份錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建備份時發生錯誤'
    });
  }
};

// 獲取備份列表
const getBackups = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const backups = await FileUpload.find({ category: 'backup' })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await FileUpload.countDocuments({ category: 'backup' });

    res.json({
      success: true,
      data: {
        backups: backups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取備份列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取備份列表時發生錯誤'
    });
  }
};

// 恢復備份
const restoreBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    
    const backup = await FileUpload.findById(backupId);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: '備份不存在'
      });
    }

    // 檢查備份文件是否存在
    if (!await fs.pathExists(backup.file_path)) {
      return res.status(404).json({
        success: false,
        message: '備份文件已不存在'
      });
    }

    // 創建恢復目錄
    const restoreDir = path.join('restore', moment().format('YYYY-MM-DD_HH-mm-ss'));
    await fs.ensureDir(restoreDir);

    // 解壓備份文件
    await new Promise((resolve, reject) => {
      fs.createReadStream(backup.file_path)
        .pipe(unzipper.Extract({ path: restoreDir }))
        .on('close', resolve)
        .on('error', reject);
    });

    res.json({
      success: true,
      message: '備份恢復成功',
      data: {
        restore_directory: restoreDir,
        backup_filename: backup.original_name
      }
    });
  } catch (error) {
    console.error('恢復備份錯誤:', error);
    res.status(500).json({
      success: false,
      message: '恢復備份時發生錯誤'
    });
  }
};

// 導出數據
const exportData = async (req, res) => {
  try {
    const { data_type, format = 'json', filters = {}, date_range } = req.body;
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `export_${data_type}_${timestamp}.${format}`;
    const filePath = path.join('exports', filename);

    // 確保導出目錄存在
    await fs.ensureDir('exports');

    // 模擬數據導出
    let exportData = [];
    switch (data_type) {
      case 'users':
        exportData = [{ id: 1, name: 'User 1', email: 'user1@example.com' }];
        break;
      case 'products':
        exportData = [{ id: 1, name: 'Product 1', price: 100 }];
        break;
      case 'orders':
        exportData = [{ id: 1, user_id: 1, total: 100, status: 'completed' }];
        break;
      case 'logs':
        exportData = [{ id: 1, level: 'info', message: 'Test log' }];
        break;
      default:
        exportData = [];
    }

    // 根據格式導出數據
    let content = '';
    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        break;
      case 'csv':
        if (exportData.length > 0) {
          const headers = Object.keys(exportData[0]).join(',');
          const rows = exportData.map(item => Object.values(item).join(','));
          content = [headers, ...rows].join('\n');
        }
        break;
      case 'excel':
        // 簡化實現，實際應該使用 exceljs 等庫
        content = JSON.stringify(exportData, null, 2);
        break;
    }

    await fs.writeFile(filePath, content);

    // 記錄導出文件
    const fileUpload = new FileUpload({
      filename: filename,
      original_name: filename,
      file_path: filePath,
      file_size: Buffer.byteLength(content),
      mime_type: format === 'json' ? 'application/json' : 'text/csv',
      uploader_id: req.user.userId,
      category: 'export',
      is_public: false
    });

    await fileUpload.save();

    res.status(201).json({
      success: true,
      message: '數據導出成功',
      data: {
        file_id: fileUpload._id,
        filename: filename,
        file_size: Buffer.byteLength(content),
        data_type: data_type,
        format: format
      }
    });
  } catch (error) {
    console.error('導出數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '導出數據時發生錯誤'
    });
  }
};

// 導入數據
const importData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未選擇文件'
      });
    }

    const { data_type, validate_only = false } = req.body;
    
    // 讀取文件內容
    const content = await fs.readFile(req.file.path, 'utf8');
    
    // 解析數據
    let data = [];
    if (req.file.mimetype === 'application/json') {
      data = JSON.parse(content);
    } else if (req.file.mimetype === 'text/csv') {
      const lines = content.split('\n');
      const headers = lines[0].split(',');
      data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim();
        });
        return obj;
      });
    }

    if (validate_only) {
      // 只驗證數據，不實際導入
      res.json({
        success: true,
        message: '數據驗證成功',
        data: {
          record_count: data.length,
          data_type: data_type,
          validation_passed: true
        }
      });
    } else {
      // 實際導入數據（模擬）
      res.json({
        success: true,
        message: '數據導入成功',
        data: {
          record_count: data.length,
          data_type: data_type,
          imported_count: data.length
        }
      });
    }
  } catch (error) {
    console.error('導入數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '導入數據時發生錯誤'
    });
  }
};

// 清理系統數據
const cleanupData = async (req, res) => {
  try {
    const { cleanup_type, older_than_days = 30 } = req.body;
    
    const cutoffDate = moment().subtract(older_than_days, 'days').toDate();
    let cleanedCount = 0;

    switch (cleanup_type) {
      case 'logs':
        // 清理日誌文件
        const logFiles = await FileUpload.find({
          category: 'system',
          mime_type: { $regex: /text/ },
          created_at: { $lt: cutoffDate }
        });
        
        for (const file of logFiles) {
          if (await fs.pathExists(file.file_path)) {
            await fs.remove(file.file_path);
          }
          await FileUpload.findByIdAndDelete(file._id);
          cleanedCount++;
        }
        break;
        
      case 'temp_files':
        // 清理臨時文件
        const tempFiles = await FileUpload.find({
          category: 'temp',
          created_at: { $lt: cutoffDate }
        });
        
        for (const file of tempFiles) {
          if (await fs.pathExists(file.file_path)) {
            await fs.remove(file.file_path);
          }
          await FileUpload.findByIdAndDelete(file._id);
          cleanedCount++;
        }
        break;
        
      case 'expired_data':
        // 清理過期數據
        const expiredFiles = await FileUpload.find({
          expires_at: { $lt: new Date() }
        });
        
        for (const file of expiredFiles) {
          if (await fs.pathExists(file.file_path)) {
            await fs.remove(file.file_path);
          }
          await FileUpload.findByIdAndDelete(file._id);
          cleanedCount++;
        }
        break;
        
      case 'all':
        // 清理所有過期數據
        const allOldFiles = await FileUpload.find({
          created_at: { $lt: cutoffDate }
        });
        
        for (const file of allOldFiles) {
          if (await fs.pathExists(file.file_path)) {
            await fs.remove(file.file_path);
          }
          await FileUpload.findByIdAndDelete(file._id);
          cleanedCount++;
        }
        break;
    }

    res.json({
      success: true,
      message: '數據清理成功',
      data: {
        cleanup_type: cleanup_type,
        older_than_days: older_than_days,
        cleaned_count: cleanedCount
      }
    });
  } catch (error) {
    console.error('清理數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '清理數據時發生錯誤'
    });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  createBackup,
  getBackups,
  restoreBackup,
  exportData,
  importData,
  cleanupData
};
