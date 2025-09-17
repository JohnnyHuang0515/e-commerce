const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { getIdMapping } = require('../utils/idMapper');

const router = express.Router();

const normalizeShipmentRow = (row) => {
  if (!row) {
    return null;
  }

  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;
  const estimatedDelivery =
    row.estimated_delivery instanceof Date ? row.estimated_delivery.toISOString() : row.estimated_delivery;

  return {
    id: row.public_id,
    orderId: row.order_public_id,
    userId: row.user_public_id,
    status: (row.status || 'pending').toLowerCase(),
    provider: row.provider || undefined,
    method: row.method || undefined,
    trackingNumber: row.tracking_number || undefined,
    destination: {
      name: row.destination_name || '',
      city: row.destination_city || '',
      district: row.destination_district || '',
      address: row.destination_address || row.shipping_address || '',
    },
    estimatedDelivery: estimatedDelivery || undefined,
    updatedAt: updatedAt || createdAt,
    createdAt,
  };
};

const fetchShipmentByPublicId = async (publicId) => {
  const result = await postgresPool.query(
    `SELECT 
       s.shipment_id,
       s.public_id,
       s.status,
       s.carrier AS provider,
       s.method,
       s.tracking_number,
       s.destination_name,
       s.destination_city,
       s.destination_district,
       s.destination_address,
       s.estimated_delivery,
       s.created_at,
       s.updated_at,
       o.shipping_address,
       o.public_id AS order_public_id,
       u.public_id AS user_public_id
     FROM shipments s
     JOIN orders o ON s.order_id = o.order_id
     JOIN users u ON o.user_id = u.user_id
     WHERE s.public_id = $1`,
    [publicId]
  );

  return normalizeShipmentRow(result.rows[0]);
};

router.get(
  '/',
  authenticateToken,
  checkPermission('logistics:manage'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, provider, method } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(String(status).toLowerCase());
      paramIndex += 1;
    }

    if (provider) {
      conditions.push(`s.carrier = $${paramIndex}`);
      params.push(provider);
      paramIndex += 1;
    }

    if (method) {
      conditions.push(`s.method = $${paramIndex}`);
      params.push(method);
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listQuery = `
      SELECT 
        s.shipment_id,
        s.public_id,
        s.status,
        s.carrier AS provider,
        s.method,
        s.tracking_number,
        s.destination_name,
        s.destination_city,
        s.destination_district,
        s.destination_address,
        s.estimated_delivery,
        s.created_at,
        s.updated_at,
        o.shipping_address,
        o.public_id AS order_public_id,
        u.public_id AS user_public_id
      FROM shipments s
      JOIN orders o ON s.order_id = o.order_id
      JOIN users u ON o.user_id = u.user_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const listParams = [...params, numericLimit, offset];
    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(
        `SELECT COUNT(*) AS total
         FROM shipments s
         JOIN orders o ON s.order_id = o.order_id
         JOIN users u ON o.user_id = u.user_id
         ${whereClause}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: {
        items: listResult.rows.map(normalizeShipmentRow),
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
  checkPermission('logistics:manage'),
  asyncHandler(async (_req, res) => {
    const result = await postgresPool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered,
        COUNT(CASE WHEN status IN ('in_transit', 'out_for_delivery') THEN 1 END) AS in_transit,
        COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) AS pending,
        COUNT(CASE WHEN status IN ('failed', 'returned', 'cancelled') THEN 1 END) AS failed
      FROM shipments
    `);

    const stats = result.rows[0] || {};

    res.json({
      success: true,
      data: {
        total: Number(stats.total || 0),
        delivered: Number(stats.delivered || 0),
        inTransit: Number(stats.in_transit || 0),
        pending: Number(stats.pending || 0),
        failed: Number(stats.failed || 0),
      },
    });
  })
);

router.get(
  '/:shipmentId',
  authenticateToken,
  checkPermission('logistics:manage'),
  asyncHandler(async (req, res) => {
    const shipment = await fetchShipmentByPublicId(req.params.shipmentId);

    if (!shipment) {
      throw new NotFoundError('找不到指定的物流紀錄');
    }

    res.json({ success: true, data: shipment });
  })
);

router.post(
  '/',
  authenticateToken,
  checkPermission('logistics:manage'),
  asyncHandler(async (req, res) => {
    const {
      orderId,
      status = 'pending',
      provider,
      method,
      trackingNumber,
      destination = {},
      estimatedDelivery,
    } = req.body;

    if (!orderId) {
      throw new ValidationError('請提供訂單 ID');
    }

    const orderMapping = await getIdMapping('orders', orderId);
    if (!orderMapping) {
      throw new NotFoundError('找不到指定的訂單');
    }

    const shipmentPublicId = uuidv4();
    const normalizedStatus = String(status).toLowerCase();
    const shippedAtStatuses = ['in_transit', 'out_for_delivery', 'delivered'];
    const deliveredAtStatuses = ['delivered'];

    await postgresPool.query(
      `INSERT INTO shipments (
         order_id,
         status,
         carrier,
         method,
         tracking_number,
         destination_name,
         destination_city,
         destination_district,
         destination_address,
         estimated_delivery,
         shipped_at,
         delivered_at,
         public_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        orderMapping.internal_id,
        normalizedStatus,
        provider || null,
        method || null,
        trackingNumber || null,
        destination.name || null,
        destination.city || null,
        destination.district || null,
        destination.address || null,
        estimatedDelivery ? new Date(estimatedDelivery) : null,
        shippedAtStatuses.includes(normalizedStatus) ? new Date() : null,
        deliveredAtStatuses.includes(normalizedStatus) ? new Date() : null,
        shipmentPublicId,
      ]
    );

    const shipment = await fetchShipmentByPublicId(shipmentPublicId);

    res.status(201).json({ success: true, data: shipment });
  })
);

router.put(
  '/:shipmentId',
  authenticateToken,
  checkPermission('logistics:manage'),
  asyncHandler(async (req, res) => {
    const { shipmentId } = req.params;
    const {
      status,
      provider,
      method,
      trackingNumber,
      destination,
      estimatedDelivery,
    } = req.body;

    const existing = await postgresPool.query(
      `SELECT shipment_id FROM shipments WHERE public_id = $1 LIMIT 1`,
      [shipmentId]
    );

    if (existing.rowCount === 0) {
      throw new NotFoundError('找不到指定的物流紀錄');
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      updates.push(`status = $${paramIndex}`);
      params.push(normalizedStatus);
      paramIndex += 1;

      const shippedAtStatuses = ['in_transit', 'out_for_delivery', 'delivered'];
      updates.push(`shipped_at = $${paramIndex}`);
      params.push(shippedAtStatuses.includes(normalizedStatus) ? new Date() : null);
      paramIndex += 1;

      updates.push(`delivered_at = $${paramIndex}`);
      params.push(normalizedStatus === 'delivered' ? new Date() : null);
      paramIndex += 1;
    }

    if (provider !== undefined) {
      updates.push(`carrier = $${paramIndex}`);
      params.push(provider || null);
      paramIndex += 1;
    }

    if (method !== undefined) {
      updates.push(`method = $${paramIndex}`);
      params.push(method || null);
      paramIndex += 1;
    }

    if (trackingNumber !== undefined) {
      updates.push(`tracking_number = $${paramIndex}`);
      params.push(trackingNumber || null);
      paramIndex += 1;
    }

    if (destination) {
      updates.push(`destination_name = $${paramIndex}`);
      params.push(destination.name || null);
      paramIndex += 1;

      updates.push(`destination_city = $${paramIndex}`);
      params.push(destination.city || null);
      paramIndex += 1;

      updates.push(`destination_district = $${paramIndex}`);
      params.push(destination.district || null);
      paramIndex += 1;

      updates.push(`destination_address = $${paramIndex}`);
      params.push(destination.address || null);
      paramIndex += 1;
    }

    if (estimatedDelivery !== undefined) {
      updates.push(`estimated_delivery = $${paramIndex}`);
      params.push(estimatedDelivery ? new Date(estimatedDelivery) : null);
      paramIndex += 1;
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      throw new ValidationError('沒有需要更新的欄位');
    }

    const updateQuery = `
      UPDATE shipments
      SET ${updates.join(', ')}
      WHERE public_id = $${paramIndex}
    `;
    params.push(shipmentId);

    await postgresPool.query(updateQuery, params);

    const shipment = await fetchShipmentByPublicId(shipmentId);

    res.json({ success: true, data: shipment });
  })
);

module.exports = router;
