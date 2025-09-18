const express = require('express');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

const normalizeRole = (role) => (role ? role.toString().toLowerCase() : 'member');
const normalizeStatus = (status) => (status ? status.toString().toLowerCase() : 'inactive');

const normalizeUserRow = (row, permissionsMap) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: normalizeRole(row.role),
  status: normalizeStatus(row.status),
  phone: row.phone || undefined,
  city: row.city || undefined,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  lastLoginAt: row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at,
  permissions: permissionsMap.get(row.id) || [],
});

router.get(
  '/',
  authenticateToken,
  checkPermission('users:read'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
    } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex += 1;
    }

    if (role) {
      conditions.push(`LOWER(u.role::text) = $${paramIndex}`);
      params.push(role.toString().toLowerCase());
      paramIndex += 1;
    }

    if (status) {
      conditions.push(`LOWER(u.status) = $${paramIndex}`);
      params.push(status.toString().toLowerCase());
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        u.last_login_at,
        up.phone,
        up.city
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      ${whereClause}`;

    const listParams = [...params, numericLimit, offset];
    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(countQuery, params),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const userIds = listResult.rows.map((row) => row.id);

    let permissionsMap = new Map();
    if (userIds.length > 0) {
      const permissionsResult = await postgresPool.query(
        `SELECT 
           ur.user_id,
           p.name AS permission
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.is_active = true
           AND ur.user_id = ANY($1::uuid[])`,
        [userIds]
      );

      permissionsMap = new Map();
      permissionsResult.rows.forEach((row) => {
        if (!permissionsMap.has(row.user_id)) {
          permissionsMap.set(row.user_id, []);
        }
        permissionsMap.get(row.user_id).push(row.permission);
      });
    }

    const items = listResult.rows.map((row) => normalizeUserRow(row, permissionsMap));

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
  '/overview',
  authenticateToken,
  checkPermission('users:read'),
  asyncHandler(async (_req, res) => {
    const result = await postgresPool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active') AS active,
        COUNT(*) FILTER (WHERE LOWER(status) = 'suspended') AS suspended,
        COUNT(*) FILTER (
          WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ) AS new_this_month
      FROM users`);

    const stats = result.rows[0] || {};

    res.json({
      success: true,
      data: {
        total: Number(stats.total || 0),
        active: Number(stats.active || 0),
        suspended: Number(stats.suspended || 0),
        newThisMonth: Number(stats.new_this_month || 0),
      },
    });
  })
);

router.get(
  '/:userId',
  authenticateToken,
  checkPermission('users:read'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const userResult = await postgresPool.query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.role,
         u.status,
         u.created_at,
         u.last_login_at,
         up.phone,
         up.city,
         up.address
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id::text = $1 OR u.email = $1
       LIMIT 1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      throw new NotFoundError('用戶不存在');
    }

    const base = userResult.rows[0];

    const rolesResult = await postgresPool.query(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.is_active = true`,
      [base.id]
    );

    const permissionsResult = await postgresPool.query(
      `SELECT p.name AS permission
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1 AND ur.is_active = true`,
      [base.id]
    );

    res.json({
      success: true,
      data: {
        ...normalizeUserRow(base, new Map([[base.id, permissionsResult.rows.map((row) => row.permission)]])),
        roles: rolesResult.rows.map((row) => row.role_name),
        address: base.address || undefined,
      },
    });
  })
);

router.post(
  '/',
  authenticateToken,
  checkPermission('users:read'),
  asyncHandler(async (_req, res) => {
    res.status(501).json({ success: false, error: '用戶建立尚未開放。' });
  })
);

router.put(
  '/:userId',
  authenticateToken,
  checkPermission('users:read'),
  asyncHandler(async (_req, res) => {
    res.status(501).json({ success: false, error: '用戶更新尚未開放。' });
  })
);

router.delete(
  '/:userId',
  authenticateToken,
  checkPermission('users:read'),
  asyncHandler(async (_req, res) => {
    res.status(501).json({ success: false, error: '用戶刪除尚未開放。' });
  })
);

module.exports = router;
