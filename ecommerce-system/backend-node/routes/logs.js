const express = require('express');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const mapTypeFromRow = (row) => {
  if (row.derived_type) {
    return row.derived_type;
  }

  if (row.data && row.data.type) {
    return row.data.type;
  }

  if (row.module && row.module.toLowerCase().includes('api')) {
    return 'api_request';
  }

  if (row.user_id) {
    return 'user_action';
  }

  return 'system';
};

const normalizeLogRow = (row) => ({
  id: row.id,
  level: row.level,
  type: mapTypeFromRow(row),
  service: row.module || 'system',
  message: row.message,
  timestamp: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
});

router.get(
  '/',
  authenticateToken,
  checkPermission('system:manage'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      level,
      type,
      search,
    } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (level) {
      conditions.push(`LOWER(sl.level) = $${paramIndex}`);
      params.push(level.toString().toLowerCase());
      paramIndex += 1;
    }

    if (search) {
      conditions.push(`sl.message ILIKE $${paramIndex}`);
      params.push(`%${search.trim()}%`);
      paramIndex += 1;
    }

    const typeFilterClause = type
      ? `WHERE derived_type = $${paramIndex}`
      : '';

    if (type) {
      params.push(type.toString().toLowerCase());
      paramIndex += 1;
    }

    const baseQuery = `
      SELECT 
        sl.id,
        LOWER(sl.level) AS level,
        sl.message,
        sl.module,
        sl.user_id,
        sl.ip,
        sl.user_agent,
        sl.data,
        sl.created_at,
        CASE
          WHEN sl.data ? 'type' THEN LOWER(sl.data->>'type')
          WHEN sl.module ILIKE '%api%' THEN 'api_request'
          WHEN sl.user_id IS NOT NULL THEN 'user_action'
          ELSE 'system'
        END AS derived_type
      FROM system_logs sl
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;

    const listQuery = `
      SELECT *
      FROM (${baseQuery}) AS base
      ${typeFilterClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (${baseQuery}) AS base
      ${typeFilterClause}`;

    const listParams = [...params, numericLimit, offset];
    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(countQuery, params),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: {
        items: listResult.rows.map(normalizeLogRow),
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.max(1, Math.ceil(total / numericLimit)),
      },
    });
  })
);

router.get(
  '/stats',
  authenticateToken,
  checkPermission('system:manage'),
  asyncHandler(async (_req, res) => {
    const result = await postgresPool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE LOWER(level) = 'error') AS errors,
        COUNT(*) FILTER (WHERE LOWER(level) = 'warning') AS warnings
      FROM system_logs
    `);

    const summary = result.rows[0] || {};
    const totalLogs = Number(summary.total || 0);
    const errorLogs = Number(summary.errors || 0);
    const warningLogs = Number(summary.warnings || 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalLogs,
          errorLogs,
          warningLogs,
          errorRate: totalLogs === 0 ? '0%' : `${((errorLogs / totalLogs) * 100).toFixed(1)}%`,
        },
      },
    });
  })
);

module.exports = router;
