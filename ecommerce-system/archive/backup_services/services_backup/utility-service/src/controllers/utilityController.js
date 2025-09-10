const { File, Backup, Restore, SystemStats } = require('../models/Utility');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const unzipper = require('unzipper');
const sharp = require('sharp');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const moment = require('moment');

class UtilityController {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.backupDir = process.env.BACKUP_DIR || 'backups';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024; // 100MB
    this.allowedFileTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,csv,txt,zip,rar').split(',');
    
    // 確保目錄存在
    this.ensureDirectories();
  }

  // 確保必要目錄存在
  async ensureDirectories() {
    await fs.ensureDir(this.uploadDir);
    await fs.ensureDir(this.backupDir);
    await fs.ensureDir(path.join(this.uploadDir, 'images'));
    await fs.ensureDir(path.join(this.uploadDir, 'documents'));
    await fs.ensureDir(path.join(this.uploadDir, 'archives'));
    await fs.ensureDir(path.join(this.uploadDir, 'data'));
    await fs.ensureDir(path.join(this.uploadDir, 'other'));
  }

  // 配置multer
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const category = this.getFileCategory(file.mimetype);
        const uploadPath = path.join(this.uploadDir, category);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

    const fileFilter = (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().substring(1);
      if (this.allowedFileTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`不支援的檔案類型: ${ext}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10
      }
    });
  }

  // 根據MIME類型獲取檔案類別
  getFileCategory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('application/pdf') || 
        mimetype.includes('document') || 
        mimetype.includes('text/')) return 'documents';
    if (mimetype.includes('zip') || 
        mimetype.includes('rar') || 
        mimetype.includes('archive')) return 'archives';
    if (mimetype.includes('csv') || 
        mimetype.includes('excel') || 
        mimetype.includes('spreadsheet')) return 'data';
    return 'other';
  }

  // 上傳檔案
  async uploadFiles(req, res) {
    try {
      const multerConfig = this.getMulterConfig();
      const upload = multerConfig.array('files', parseInt(process.env.MAX_FILES_PER_REQUEST) || 10);

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: '沒有選擇檔案'
          });
        }

        const uploadedFiles = [];
        const { uploadedBy, uploadedByType = 'user', tags = [], isPublic = false } = req.body;

        for (const file of req.files) {
          // 處理圖片壓縮
          if (file.mimetype.startsWith('image/') && process.env.IMAGE_RESIZE_ENABLED === 'true') {
            await this.processImage(file.path);
          }

          const fileRecord = new File({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            url: `/uploads/${this.getFileCategory(file.mimetype)}/${file.filename}`,
            category: this.getFileCategory(file.mimetype),
            uploadedBy,
            uploadedByType,
            tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
            isPublic: isPublic === 'true'
          });

          await fileRecord.save();
          uploadedFiles.push(fileRecord);
        }

        res.status(201).json({
          success: true,
          data: uploadedFiles,
          message: `成功上傳 ${uploadedFiles.length} 個檔案`
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '檔案上傳失敗',
        error: error.message
      });
    }
  }

  // 處理圖片壓縮
  async processImage(imagePath) {
    try {
      const quality = parseInt(process.env.IMAGE_QUALITY) || 80;
      const maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH) || 1920;
      const maxHeight = parseInt(process.env.IMAGE_MAX_HEIGHT) || 1080;

      await sharp(imagePath)
        .resize(maxWidth, maxHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .png({ quality })
        .toFile(imagePath + '.processed');

      // 替換原檔案
      await fs.move(imagePath + '.processed', imagePath, { overwrite: true });
    } catch (error) {
      console.error('圖片處理失敗:', error);
    }
  }

  // 獲取檔案列表
  async getFiles(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        uploadedBy, 
        uploadedByType,
        tags,
        isPublic,
        startDate,
        endDate
      } = req.query;

      const filter = {};
      
      if (category) filter.category = category;
      if (uploadedBy) filter.uploadedBy = uploadedBy;
      if (uploadedByType) filter.uploadedByType = uploadedByType;
      if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
      if (tags) filter.tags = { $in: tags.split(',') };
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const files = await File.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await File.countDocuments(filter);

      res.json({
        success: true,
        data: files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取檔案列表失敗',
        error: error.message
      });
    }
  }

  // 獲取單個檔案
  async getFile(req, res) {
    try {
      const file = await File.findById(req.params.id);
      
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
  }

  // 下載檔案
  async downloadFile(req, res) {
    try {
      const file = await File.findById(req.params.id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: '檔案不存在'
        });
      }

      // 檢查檔案是否存在
      if (!await fs.pathExists(file.path)) {
        return res.status(404).json({
          success: false,
          message: '檔案已遺失'
        });
      }

      // 更新下載次數
      await file.incrementDownloadCount();

      res.download(file.path, file.originalName);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '檔案下載失敗',
        error: error.message
      });
    }
  }

  // 刪除檔案
  async deleteFile(req, res) {
    try {
      const file = await File.findById(req.params.id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: '檔案不存在'
        });
      }

      // 刪除實體檔案
      if (await fs.pathExists(file.path)) {
        await fs.remove(file.path);
      }

      // 刪除資料庫記錄
      await File.findByIdAndDelete(req.params.id);

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
  }

  // 創建備份
  async createBackup(req, res) {
    try {
      const { name, description, type = 'manual', source, destination } = req.body;
      const { createdBy, createdByType = 'user' } = req.body;

      const backup = new Backup({
        name,
        description,
        type,
        source: source || this.uploadDir,
        destination: destination || path.join(this.backupDir, `${name}-${Date.now()}.zip`),
        createdBy,
        createdByType
      });

      await backup.save();

      // 異步執行備份
      this.executeBackup(backup._id);

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
  }

  // 執行備份
  async executeBackup(backupId) {
    try {
      const backup = await Backup.findById(backupId);
      if (!backup) return;

      await backup.markAsStarted();

      const output = fs.createWriteStream(backup.destination);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const stats = await fs.stat(backup.destination);
        await backup.markAsCompleted(stats.size, archive.pointer());
      });

      archive.on('error', async (err) => {
        await backup.markAsFailed(err.message);
      });

      archive.pipe(output);
      archive.directory(backup.source, false);
      await archive.finalize();
    } catch (error) {
      const backup = await Backup.findById(backupId);
      if (backup) {
        await backup.markAsFailed(error.message);
      }
    }
  }

  // 獲取備份列表
  async getBackups(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type, 
        status,
        createdBy,
        createdByType,
        startDate,
        endDate
      } = req.query;

      const filter = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (createdBy) filter.createdBy = createdBy;
      if (createdByType) filter.createdByType = createdByType;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const backups = await Backup.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Backup.countDocuments(filter);

      res.json({
        success: true,
        data: backups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取備份列表失敗',
        error: error.message
      });
    }
  }

  // 創建還原
  async createRestore(req, res) {
    try {
      const { backupId, name, description, destination } = req.body;
      const { createdBy, createdByType = 'user' } = req.body;

      const backup = await Backup.findById(backupId);
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: '備份不存在'
        });
      }

      if (backup.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: '備份未完成，無法還原'
        });
      }

      const restore = new Restore({
        backupId,
        name,
        description,
        source: backup.destination,
        destination: destination || backup.source,
        createdBy,
        createdByType
      });

      await restore.save();

      // 異步執行還原
      this.executeRestore(restore._id);

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
  }

  // 執行還原
  async executeRestore(restoreId) {
    try {
      const restore = await Restore.findById(restoreId);
      if (!restore) return;

      await restore.markAsStarted();

      // 確保目標目錄存在
      await fs.ensureDir(restore.destination);

      // 解壓縮備份檔案
      const stream = fs.createReadStream(restore.source)
        .pipe(unzipper.Extract({ path: restore.destination }));

      stream.on('close', async () => {
        await restore.markAsCompleted();
      });

      stream.on('error', async (err) => {
        await restore.markAsFailed(err.message);
      });
    } catch (error) {
      const restore = await Restore.findById(restoreId);
      if (restore) {
        await restore.markAsFailed(error.message);
      }
    }
  }

  // 獲取還原列表
  async getRestores(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        backupId,
        createdBy,
        createdByType,
        startDate,
        endDate
      } = req.query;

      const filter = {};
      
      if (status) filter.status = status;
      if (backupId) filter.backupId = backupId;
      if (createdBy) filter.createdBy = createdBy;
      if (createdByType) filter.createdByType = createdByType;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const restores = await Restore.find(filter)
        .populate('backupId', 'name type status')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Restore.countDocuments(filter);

      res.json({
        success: true,
        data: restores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取還原列表失敗',
        error: error.message
      });
    }
  }

  // 獲取系統統計
  async getSystemStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
      const end = endDate ? new Date(endDate) : new Date();

      // 檔案統計
      const fileStats = await File.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$size' },
            byCategory: {
              $push: {
                category: '$category',
                size: '$size'
              }
            }
          }
        }
      ]);

      // 備份統計
      const backupStats = await Backup.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalBackups: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                size: '$size'
              }
            }
          }
        }
      ]);

      // 還原統計
      const restoreStats = await Restore.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalRestores: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status'
              }
            }
          }
        }
      ]);

      const result = {
        totalFiles: fileStats[0]?.totalFiles || 0,
        totalSize: fileStats[0]?.totalSize || 0,
        totalBackups: backupStats[0]?.totalBackups || 0,
        totalRestores: restoreStats[0]?.totalRestores || 0,
        byCategory: {},
        byStatus: {
          backups: {},
          restores: {}
        },
        dateRange: { start, end }
      };

      // 處理分類統計
      if (fileStats[0]?.byCategory) {
        fileStats[0].byCategory.forEach(item => {
          if (!result.byCategory[item.category]) {
            result.byCategory[item.category] = { count: 0, size: 0 };
          }
          result.byCategory[item.category].count++;
          result.byCategory[item.category].size += item.size;
        });
      }

      // 處理備份狀態統計
      if (backupStats[0]?.byStatus) {
        backupStats[0].byStatus.forEach(item => {
          if (!result.byStatus.backups[item.status]) {
            result.byStatus.backups[item.status] = 0;
          }
          result.byStatus.backups[item.status]++;
        });
      }

      // 處理還原狀態統計
      if (restoreStats[0]?.byStatus) {
        restoreStats[0].byStatus.forEach(item => {
          if (!result.byStatus.restores[item.status]) {
            result.byStatus.restores[item.status] = 0;
          }
          result.byStatus.restores[item.status]++;
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取系統統計失敗',
        error: error.message
      });
    }
  }

  // CSV匯出
  async exportToCSV(req, res) {
    try {
      const { type, startDate, endDate } = req.query;
      
      let data = [];
      let filename = 'export.csv';

      switch (type) {
        case 'files':
          const files = await File.find({
            createdAt: { 
              $gte: new Date(startDate || 0), 
              $lte: new Date(endDate || new Date()) 
            }
          });
          data = files.map(file => ({
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            category: file.category,
            uploadedBy: file.uploadedBy,
            uploadedByType: file.uploadedByType,
            createdAt: file.createdAt
          }));
          filename = 'files-export.csv';
          break;

        case 'backups':
          const backups = await Backup.find({
            createdAt: { 
              $gte: new Date(startDate || 0), 
              $lte: new Date(endDate || new Date()) 
            }
          });
          data = backups.map(backup => ({
            name: backup.name,
            type: backup.type,
            status: backup.status,
            size: backup.size,
            fileCount: backup.fileCount,
            createdBy: backup.createdBy,
            createdByType: backup.createdByType,
            createdAt: backup.createdAt,
            completedAt: backup.completedAt
          }));
          filename = 'backups-export.csv';
          break;

        case 'restores':
          const restores = await Restore.find({
            createdAt: { 
              $gte: new Date(startDate || 0), 
              $lte: new Date(endDate || new Date()) 
            }
          }).populate('backupId', 'name');
          data = restores.map(restore => ({
            name: restore.name,
            backupName: restore.backupId?.name,
            status: restore.status,
            createdBy: restore.createdBy,
            createdByType: restore.createdByType,
            createdAt: restore.createdAt,
            completedAt: restore.completedAt
          }));
          filename = 'restores-export.csv';
          break;

        default:
          return res.status(400).json({
            success: false,
            message: '不支援的匯出類型'
          });
      }

      const parser = new Parser();
      const csv = parser.parse(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'CSV匯出失敗',
        error: error.message
      });
    }
  }
}

module.exports = new UtilityController();
