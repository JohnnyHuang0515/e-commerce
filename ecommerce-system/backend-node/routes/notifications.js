const express = require('express');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const deriveStatus = (row) => {
  const recipientsCount = Array.isArray(row.recipients) ? row.recipients.length : 0;
  const readCount = Array.isArray(row.read_by) ? row.read_by.length : 0;

  if (recipientsCount === 0) {
    return 'draft';
  }

  if (row.expires_at && row.expires_at < new Date()) {
    return 'failed';
  }

  if (readCount >= recipientsCount && recipientsCount > 0) {
    return 'read';
  }

  if (readCount === 0) {
    return 'unread';
  }

  return 'sent';
};

const mapNotification = (row, recipientsMap) => {
  const sentAt = row.data?.sent_at ?? row.created_at;
  const scheduledAt = row.data?.scheduled_at ?? null;

  const recipients = (row.recipients || []).map((id) => {
    const user = recipientsMap.get(id) || {};
    return {
      id,
      name: user.name,
      email: user.email,
    };
  });

  return {
    id: row.id,
    title: row.title,
    content: row.message,
    type: row.type,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    sentAt: sentAt ? new Date(sentAt).toISOString() : undefined,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    recipients,
    metadata: row.data || undefined,
  };
};

router.get(
  '/',
  authenticateToken,
  checkPermission('system:manage'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`n.type = $${paramIndex}`);
      params.push(type);
      paramIndex += 1;
    }

    if (search) {
      conditions.push(`(n.title ILIKE $${paramIndex} OR n.message ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex += 1;
    }

    if (startDate) {
      conditions.push(`n.created_at >= $${paramIndex}`);
      params.push(new Date(startDate));
      paramIndex += 1;
    }

    if (endDate) {
      conditions.push(`n.created_at <= $${paramIndex}`);
      params.push(new Date(endDate));
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseQuery = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.recipients,
        n.read_by,
        n.priority,
        n.data,
        n.expires_at,
        n.created_at,
        CASE
          WHEN CARDINALITY(n.recipients) = 0 THEN 'draft'
          WHEN n.expires_at IS NOT NULL AND n.expires_at < NOW() THEN 'failed'
          WHEN CARDINALITY(n.read_by) >= CARDINALITY(n.recipients) AND CARDINALITY(n.recipients) > 0 THEN 'read'
          WHEN CARDINALITY(n.read_by) = 0 THEN 'unread'
          ELSE 'sent'
        END AS status
      FROM notifications n
      ${whereClause}
    `;

    const listQuery = `
      SELECT *
      FROM (${baseQuery}) AS notifications
      ${status ? `WHERE status = $${paramIndex}` : ''}
      ORDER BY created_at DESC
      LIMIT $${status ? paramIndex + 1 : paramIndex} OFFSET $${status ? paramIndex + 2 : paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (${baseQuery}) AS notifications
      ${status ? `WHERE status = $${paramIndex}` : ''}
    `;

    const listParams = status
      ? [...params, status, numericLimit, offset]
      : [...params, numericLimit, offset];

    const countParams = status ? [...params, status] : params;

    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(countQuery, countParams),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    const recipientIds = new Set();
    listResult.rows.forEach((row) => {
      (row.recipients || []).forEach((id) => {
        if (id) {
          recipientIds.add(id);
        }
      });
    });

    let recipientsMap = new Map();
    if (recipientIds.size > 0) {
      const ids = Array.from(recipientIds);
      const recipientsResult = await postgresPool.query(
        `SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])`,
        [ids]
      );
      recipientsMap = new Map(
        recipientsResult.rows.map((row) => [row.id, { name: row.name, email: row.email }])
      );
    }

    const items = listResult.rows.map((row) => mapNotification(row, recipientsMap));

    res.json({
      success: true,
      data: {
        items,
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
        COUNT(*) FILTER (WHERE CARDINALITY(recipients) = 0) AS draft,
        COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW()) AS failed,
        COUNT(*) FILTER (WHERE CARDINALITY(read_by) >= CARDINALITY(recipients) AND CARDINALITY(recipients) > 0) AS read,
        COUNT(*) FILTER (WHERE CARDINALITY(read_by) = 0 AND CARDINALITY(recipients) > 0) AS unread,
        COUNT(*) FILTER (
          WHERE CARDINALITY(recipients) > 0
            AND (expires_at IS NULL OR expires_at >= NOW())
        ) AS sent
      FROM notifications
    `);

    const stats = result.rows[0] || {};

    res.json({
      success: true,
      data: {
        total: Number(stats.total || 0),
        sent: Number(stats.sent || 0),
        failed: Number(stats.failed || 0),
        read: Number(stats.read || 0),
        unread: Number(stats.unread || 0),
      },
    });
  })
);

module.exports = router;
