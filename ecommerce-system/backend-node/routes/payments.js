const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { getIdMapping } = require('../utils/idMapper');

const router = express.Router();

const mapStatusFromDb = (status) => {
  if (!status) {
    return 'pending';
  }

  const normalized = status.toLowerCase();
  const mapping = {
    success: 'completed',
    paid: 'completed',
    completed: 'completed',
    pending: 'pending',
    processing: 'processing',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    refunded: 'refunded',
    failed: 'failed',
  };

  return mapping[normalized] || normalized;
};

const mapStatusToDb = (status) => {
  if (!status) {
    return 'pending';
  }

  const normalized = status.toLowerCase();
  const mapping = {
    completed: 'success',
    paid: 'success',
    pending: 'pending',
    processing: 'processing',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    refunded: 'refunded',
    failed: 'failed',
  };

  return mapping[normalized] || normalized;
};

const toCent = (amount) => {
  if (amount === null || amount === undefined) {
    return 0;
  }

  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
};

const toDecimal = (amountInCent) => {
  const parsed = Number(amountInCent);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed / 100;
};

const normalizePaymentRow = (row) => {
  if (!row) {
    return null;
  }

  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  const paidAt = row.paid_at instanceof Date ? row.paid_at.toISOString() : row.paid_at;
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;

  return {
    id: row.public_id,
    orderId: row.order_public_id,
    userId: row.user_public_id,
    amount: toCent(row.amount),
    currency: row.currency || 'TWD',
    method: row.payment_method,
    provider: row.provider || undefined,
    status: mapStatusFromDb(row.payment_status),
    transactionId: row.transaction_id || undefined,
    createdAt,
    updatedAt: updatedAt || paidAt || createdAt,
  };
};

const fetchPaymentByPublicId = async (publicId) => {
  const result = await postgresPool.query(
    `SELECT 
       p.payment_id,
       p.public_id,
       p.payment_method,
       p.amount,
       p.payment_status,
       p.paid_at,
       p.created_at,
       p.updated_at,
       p.currency,
       p.provider,
       p.transaction_id,
       o.public_id AS order_public_id,
       u.public_id AS user_public_id
     FROM payments p
     JOIN orders o ON p.order_id = o.order_id
     JOIN users u ON o.user_id = u.user_id
     WHERE p.public_id = $1`,
    [publicId]
  );

  return normalizePaymentRow(result.rows[0]);
};

router.get(
  '/',
  authenticateToken,
  checkPermission('payments:manage'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      method,
      userId,
      orderId,
      startDate,
      endDate,
    } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`p.payment_status = $${paramIndex}`);
      params.push(mapStatusToDb(status));
      paramIndex += 1;
    }

    if (method) {
      conditions.push(`p.payment_method = $${paramIndex}`);
      params.push(method);
      paramIndex += 1;
    }

    if (userId) {
      const userMapping = await getIdMapping('users', userId);
      if (!userMapping) {
        throw new NotFoundError('找不到指定的用戶');
      }
      conditions.push(`o.user_id = $${paramIndex}`);
      params.push(userMapping.internal_id);
      paramIndex += 1;
    }

    if (orderId) {
      const orderMapping = await getIdMapping('orders', orderId);
      if (!orderMapping) {
        throw new NotFoundError('找不到指定的訂單');
      }
      conditions.push(`p.order_id = $${paramIndex}`);
      params.push(orderMapping.internal_id);
      paramIndex += 1;
    }

    if (startDate) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(new Date(startDate));
      paramIndex += 1;
    }

    if (endDate) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(new Date(endDate));
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listQuery = `
      SELECT 
        p.payment_id,
        p.public_id,
        p.payment_method,
        p.amount,
        p.payment_status,
        p.paid_at,
        p.created_at,
        p.updated_at,
        p.currency,
        p.provider,
        p.transaction_id,
        o.public_id AS order_public_id,
        u.public_id AS user_public_id
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN users u ON o.user_id = u.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const listParams = [...params, numericLimit, offset];
    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(
        `SELECT COUNT(*) AS total
         FROM payments p
         JOIN orders o ON p.order_id = o.order_id
         JOIN users u ON o.user_id = u.user_id
         ${whereClause}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: {
        items: listResult.rows.map(normalizePaymentRow),
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
  checkPermission('payments:manage'),
  asyncHandler(async (_req, res) => {
    const result = await postgresPool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(amount) AS total_amount,
        COUNT(CASE WHEN payment_status IN ('success', 'completed', 'paid') THEN 1 END) AS completed,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN payment_status = 'processing' THEN 1 END) AS processing,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) AS failed,
        COUNT(CASE WHEN payment_status = 'cancelled' THEN 1 END) AS cancelled,
        COUNT(CASE WHEN payment_status = 'refunded' THEN 1 END) AS refunded
      FROM payments
    `);

    const stats = result.rows[0] || {};

    res.json({
      success: true,
      data: {
        total: Number(stats.total || 0),
        completed: Number(stats.completed || 0),
        refunded: Number(stats.refunded || 0),
        pending: Number(stats.pending || 0),
        processing: Number(stats.processing || 0),
        failed: Number(stats.failed || 0),
        cancelled: Number(stats.cancelled || 0),
        totalAmount: toCent(stats.total_amount || 0),
      },
    });
  })
);

router.get(
  '/:paymentId',
  authenticateToken,
  checkPermission('payments:manage'),
  asyncHandler(async (req, res) => {
    const payment = await fetchPaymentByPublicId(req.params.paymentId);

    if (!payment) {
      throw new NotFoundError('找不到指定的支付紀錄');
    }

    res.json({ success: true, data: payment });
  })
);

router.post(
  '/',
  authenticateToken,
  checkPermission('payments:manage'),
  asyncHandler(async (req, res) => {
    const {
      orderId,
      amount,
      method,
      status = 'pending',
      currency = 'TWD',
      provider,
      transactionId,
    } = req.body;

    if (!orderId) {
      throw new ValidationError('請提供訂單 ID');
    }

    if (amount === undefined || amount === null) {
      throw new ValidationError('請提供支付金額');
    }

    if (Number(amount) <= 0) {
      throw new ValidationError('支付金額必須大於 0');
    }

    if (!method) {
      throw new ValidationError('請提供支付方式');
    }

    const orderMapping = await getIdMapping('orders', orderId);
    if (!orderMapping) {
      throw new NotFoundError('找不到指定的訂單');
    }

    const existingPayment = await postgresPool.query(
      'SELECT payment_id FROM payments WHERE order_id = $1 LIMIT 1',
      [orderMapping.internal_id]
    );

    if (existingPayment.rowCount > 0) {
      throw new ValidationError('該訂單已存在支付紀錄');
    }

    const dbStatus = mapStatusToDb(status);
    const paidAt = ['success', 'completed', 'paid'].includes(dbStatus) ? new Date() : null;
    const paymentPublicId = uuidv4();

    await postgresPool.query(
      `INSERT INTO payments (
         order_id,
         payment_method,
         amount,
         payment_status,
         paid_at,
         public_id,
         currency,
         provider,
         transaction_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
  })
);
      [
        orderMapping.internal_id,
        method,
        toDecimal(amount),
        dbStatus,
        paidAt,
        paymentPublicId,
        currency,
        provider || null,
        transactionId || null,
      ]
    );

    const payment = await fetchPaymentByPublicId(paymentPublicId);

    res.status(201).json({ success: true, data: payment });
  })
);

router.put(
  '/:paymentId',
  authenticateToken,
  checkPermission('payments:manage'),
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { amount, method, status, currency, provider, transactionId } = req.body;

    const existing = await postgresPool.query(
      `SELECT payment_id FROM payments WHERE public_id = $1 LIMIT 1`,
      [paymentId]
    );

    if (existing.rowCount === 0) {
      throw new NotFoundError('找不到指定的支付紀錄');
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        throw new ValidationError('支付金額必須大於 0');
      }
      updates.push(`amount = $${paramIndex}`);
      params.push(toDecimal(amount));
      paramIndex += 1;
    }

    if (method) {
      updates.push(`payment_method = $${paramIndex}`);
      params.push(method);
      paramIndex += 1;
    }

    if (status) {
      const dbStatus = mapStatusToDb(status);
      updates.push(`payment_status = $${paramIndex}`);
      params.push(dbStatus);
      paramIndex += 1;

      updates.push(`paid_at = $${paramIndex}`);
      const paidAt = ['success', 'completed', 'paid'].includes(dbStatus) ? new Date() : null;
      params.push(paidAt);
      paramIndex += 1;
    }

    if (currency) {
      updates.push(`currency = $${paramIndex}`);
      params.push(currency);
      paramIndex += 1;
    }

    if (provider !== undefined) {
      updates.push(`provider = $${paramIndex}`);
      params.push(provider || null);
      paramIndex += 1;
    }

    if (transactionId !== undefined) {
      updates.push(`transaction_id = $${paramIndex}`);
      params.push(transactionId || null);
      paramIndex += 1;
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      throw new ValidationError('沒有需要更新的欄位');
    }

    const updateQuery = `
      UPDATE payments
      SET ${updates.join(', ')}
      WHERE public_id = $${paramIndex}
    `;
    params.push(paymentId);

    await postgresPool.query(updateQuery, params);

    const payment = await fetchPaymentByPublicId(paymentId);

    res.json({ success: true, data: payment });
  })
);

module.exports = router;
