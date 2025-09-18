const express = require('express');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/stats',
  authenticateToken,
  checkPermission('system:manage'),
  asyncHandler(async (_req, res) => {
    const [backupResult, filesResult, logsResult] = await Promise.all([
      postgresPool.query(
        `SELECT 
           COUNT(*) AS backups,
           MAX(created_at) AS last_backup
         FROM files
         WHERE LOWER(category) = 'backup'`
      ),
      postgresPool.query(
        `SELECT COUNT(*) AS files FROM files`
      ),
      postgresPool.query(
        `SELECT COUNT(*) AS logs FROM system_logs`
      ),
    ]);

    const backupRow = backupResult.rows[0] || {};
    const filesRow = filesResult.rows[0] || {};
    const logsRow = logsResult.rows[0] || {};

    res.json({
      success: true,
      data: {
        backups: Number(backupRow.backups || 0),
        lastBackupAt: backupRow.last_backup || null,
        files: Number(filesRow.files || 0),
        logs: Number(logsRow.logs || 0),
      },
    });
  })
);

router.get(
  '/tasks',
  authenticateToken,
  checkPermission('system:manage'),
  asyncHandler(async (_req, res) => {
    const tasksResult = await postgresPool.query(
      `SELECT 
         COALESCE(module, 'system') AS module,
         MAX(created_at) AS last_run_at,
         COUNT(*) AS entries
       FROM system_logs
       GROUP BY module
       ORDER BY last_run_at DESC
       LIMIT 10`
    );

    const tasks = tasksResult.rows.map((row) => ({
      id: row.module,
      name: row.module,
      description: `最近紀錄 ${row.entries} 筆`,
      lastRunAt: row.last_run_at instanceof Date ? row.last_run_at.toISOString() : row.last_run_at,
      status: 'completed',
    }));

    res.json({ success: true, data: tasks });
  })
);

module.exports = router;
