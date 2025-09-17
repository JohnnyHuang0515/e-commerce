const express = require('express');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

const mapStatusFromDb = (status) => {
  if (!status) {
    return 'pending';
  }

  const key = status.toString().toUpperCase();
  const mapping = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    IN_PROGRESS: 'processing',
    COMPLETED: 'completed',
    SUCCESS: 'completed',
    PAID: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    CANCELED: 'cancelled',
    REFUNDED: 'refunded',
  };

  return mapping[key] || key.toLowerCase();
};

const mapStatusToDb = (status) => {
  if (!status) {
    return 'PENDING';
  }

  const key = status.toString().toLowerCase();
  const mapping = {
    pending: 'PENDING',
    processing: 'PROCESSING',
    in_progress: 'PROCESSING',
    completed: 'SUCCESS',
    success: 'SUCCESS',
    paid: 'SUCCESS',
    failed: 'FAILED',
    cancelled: 'CANCELLED',
    canceled: 'CANCELLED',
    refunded: 'REFUNDED',
  };

  return mapping[key] || status.toString().toUpperCase();
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
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;
  const transactionId = row.transaction_id || row.external_payment_id || null;

  return {
    id: row.payment_id,
    orderId: row.order_number || row.order_id,
    userId: row.user_id,
    amount: toCent(row.amount),
    currency: row.currency || 'TWD',
    method: row.payment_method,
    provider: row.payment_provider || undefined,
    status: mapStatusFromDb(row.status),
    transactionId: transactionId || undefined,
    createdAt,
    updatedAt,
  };
};

const fetchPaymentById = async (paymentId) => {
  const result = await postgresPool.query(
    `SELECT 
       p.id AS payment_id,
       p.order_id,
       o.order_number,
       o.user_id,
       p.payment_method,
       p.payment_provider,
       p.amount,
       p.currency,
       p.status,
       p.transaction_id,
       p.external_payment_id,
       p.created_at,
       p.updated_at
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     WHERE p.id::text = $1`,
    [paymentId]
  );

  return normalizePaymentRow(result.rows[0]);
};

const findOrderByIdentifier = async (identifier) => {
  if (!identifier) {
    return null;
  }

  const result = await postgresPool.query(
    `SELECT id, order_number, user_id, shipping_address
     FROM orders
     WHERE id::text = $1 OR order_number = $1
     LIMIT 1`,
    [identifier]
  );

  return result.rows[0] || null;
};

const updateOrderPaymentMetadata = async (orderId, paymentId, dbStatus, method) => {
  if (!orderId) {
    return;
  }

  try {
    await postgresPool.query(
      `UPDATE orders
       SET payment_status = $1,
           payment_method = COALESCE($2, payment_method),
           payment_id = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [dbStatus, method || null, paymentId || null, orderId]
    );
  } catch (error) {
    console.warn('更新訂單支付資訊失敗:', error.message);
  }
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
      conditions.push(`p.status = $${paramIndex}`);
      params.push(mapStatusToDb(status));
      paramIndex += 1;
    }

    if (method) {
      conditions.push(`p.payment_method = $${paramIndex}`);
      params.push(method);
      paramIndex += 1;
    }

    if (userId) {
      conditions.push(`o.user_id::text = $${paramIndex}`);
      params.push(userId);
      paramIndex += 1;
    }

    if (orderId) {
      conditions.push(`(o.id::text = $${paramIndex} OR o.order_number = $${paramIndex})`);
      params.push(orderId);
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
        p.id AS payment_id,
        p.order_id,
        o.order_number,
        o.user_id,
        p.payment_method,
        p.payment_provider,
        p.amount,
        p.currency,
        p.status,
        p.transaction_id,
        p.external_payment_id,
        p.created_at,
        p.updated_at
      FROM payments p
      JOIN orders o ON p.order_id = o.id
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
         JOIN orders o ON p.order_id = o.id
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
        COUNT(CASE WHEN status IN ('SUCCESS') THEN 1 END) AS completed,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) AS processing,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) AS failed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) AS refunded
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
    const payment = await fetchPaymentById(req.params.paymentId);

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

    const order = await findOrderByIdentifier(orderId);
    if (!order) {
      throw new NotFoundError('找不到指定的訂單');
    }

    const existingPayment = await postgresPool.query(
      'SELECT id FROM payments WHERE order_id = $1 LIMIT 1',
      [order.id]
    );

    if (existingPayment.rowCount > 0) {
      throw new ValidationError('該訂單已存在支付紀錄');
    }

    const dbStatus = mapStatusToDb(status);
    const processedAt = ['COMPLETED', 'SUCCESS', 'PAID'].includes(dbStatus) ? new Date() : null;
    const providerValue = provider?.trim() || 'manual';

    const insertResult = await postgresPool.query(
      `INSERT INTO payments (
         order_id,
         payment_method,
         payment_provider,
         amount,
         currency,
         status,
         transaction_id,
         processed_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        order.id,
        method,
        providerValue,
        toDecimal(amount),
        currency || 'TWD',
        dbStatus,
        transactionId || null,
        processedAt,
      ]
    );

    const paymentId = insertResult.rows[0].id;
    await updateOrderPaymentMetadata(order.id, paymentId, dbStatus, method);

    const payment = await fetchPaymentById(paymentId);

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
      `SELECT id, order_id FROM payments WHERE id::text = $1 LIMIT 1`,
      [paymentId]
    );

    if (existing.rowCount === 0) {
      throw new NotFoundError('找不到指定的支付紀錄');
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;
    let updatedStatus = null;
    let updatedMethod = null;

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
      updatedMethod = method;
      paramIndex += 1;
    }

    if (status) {
      const dbStatus = mapStatusToDb(status);
      updates.push(`status = $${paramIndex}`);
      params.push(dbStatus);
      paramIndex += 1;

      updates.push(`processed_at = $${paramIndex}`);
      const processedAt = ['COMPLETED', 'SUCCESS', 'PAID'].includes(dbStatus) ? new Date() : null;
      params.push(processedAt);
      paramIndex += 1;
      updatedStatus = dbStatus;
    }

    if (currency) {
      updates.push(`currency = $${paramIndex}`);
      params.push(currency);
      paramIndex += 1;
    }

    if (provider !== undefined) {
      updates.push(`payment_provider = $${paramIndex}`);
      params.push(provider ? provider.trim() : null);
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
      WHERE id::text = $${paramIndex}
    `;
    params.push(paymentId);

    await postgresPool.query(updateQuery, params);

    const payment = await fetchPaymentById(paymentId);

    const finalStatus = updatedStatus || mapStatusToDb(payment.status);
    const finalMethod = updatedMethod || payment.method;
    await updateOrderPaymentMetadata(existing.rows[0].order_id, paymentId, finalStatus, finalMethod);

    res.json({ success: true, data: payment });
  })
);

router.delete(
  '/:paymentId',
  authenticateToken,
  checkPermission('payments:manage'),
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const existing = await postgresPool.query(
      `SELECT id, order_id FROM payments WHERE id::text = $1 LIMIT 1`,
      [paymentId]
    );

    if (existing.rowCount === 0) {
      throw new NotFoundError('找不到指定的支付紀錄');
    }

    await postgresPool.query('DELETE FROM payments WHERE id = $1', [existing.rows[0].id]);

    await updateOrderPaymentMetadata(existing.rows[0].order_id, null, 'PENDING', null);

    res.json({ success: true });
  })
);

module.exports = router;
