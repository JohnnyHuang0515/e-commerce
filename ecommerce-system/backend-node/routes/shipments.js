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
    PICKED_UP: 'processing',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    RETURNED: 'returned',
    CANCELLED: 'cancelled',
    CANCELED: 'cancelled',
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
    processing: 'IN_TRANSIT',
    in_transit: 'IN_TRANSIT',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    delivered: 'DELIVERED',
    failed: 'FAILED',
    returned: 'RETURNED',
    cancelled: 'CANCELLED',
    canceled: 'CANCELLED',
  };

  return mapping[key] || status.toString().toUpperCase();
};

const normalizeDestination = (rawAddress = {}, fallbackAddress = {}) => {
  const source = typeof rawAddress === 'object' && rawAddress !== null ? rawAddress : {};
  const fallback = typeof fallbackAddress === 'object' && fallbackAddress !== null ? fallbackAddress : {};

  return {
    name: source.name || fallback.name || '',
    city: source.city || fallback.city || '',
    district: source.district || fallback.district || fallback.region || '',
    address: source.address || fallback.address || fallback.line1 || '',
  };
};

const normalizeShipmentRow = (row) => {
  if (!row) {
    return null;
  }

  const destination = normalizeDestination(row.shipping_address);
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;
  const estimatedDelivery = row.estimated_delivery instanceof Date ? row.estimated_delivery.toISOString() : row.estimated_delivery;

  return {
    id: row.shipment_id,
    orderId: row.order_number || row.order_id,
    userId: row.user_id,
    status: mapStatusFromDb(row.status),
    provider: row.carrier || undefined,
    method: row.shipping_method || undefined,
    trackingNumber: row.tracking_number || undefined,
    destination,
    estimatedDelivery: estimatedDelivery || undefined,
    updatedAt: updatedAt || createdAt,
    createdAt,
  };
};

const fetchShipmentById = async (shipmentId) => {
  const result = await postgresPool.query(
    `SELECT 
       l.id AS shipment_id,
       l.order_id,
       o.order_number,
       o.user_id,
       l.status,
       l.carrier,
       l.shipping_method,
       l.tracking_number,
       l.shipping_address,
       l.estimated_delivery,
       l.actual_delivery,
       l.created_at,
       l.updated_at
     FROM logistics l
     JOIN orders o ON l.order_id = o.id
     WHERE l.id::text = $1`,
    [shipmentId]
  );

  return normalizeShipmentRow(result.rows[0]);
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

const buildShippingAddress = (destination = {}, orderShippingAddress = {}) => {
  const normalized = normalizeDestination(destination, orderShippingAddress);

  if (!normalized.name && !normalized.address) {
    throw new ValidationError('請提供完整的配送地址資訊');
  }

  return normalized;
};

router.get(
  '/',
  authenticateToken,
  checkPermission('logistics:manage'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      provider,
      method,
      orderId,
      userId,
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
      conditions.push(`l.status = $${paramIndex}`);
      params.push(mapStatusToDb(status));
      paramIndex += 1;
    }

    if (provider) {
      conditions.push(`l.carrier = $${paramIndex}`);
      params.push(provider);
      paramIndex += 1;
    }

    if (method) {
      conditions.push(`l.shipping_method = $${paramIndex}`);
      params.push(method);
      paramIndex += 1;
    }

    if (orderId) {
      conditions.push(`(o.id::text = $${paramIndex} OR o.order_number = $${paramIndex})`);
      params.push(orderId);
      paramIndex += 1;
    }

    if (userId) {
      conditions.push(`o.user_id::text = $${paramIndex}`);
      params.push(userId);
      paramIndex += 1;
    }

    if (startDate) {
      conditions.push(`l.created_at >= $${paramIndex}`);
      params.push(new Date(startDate));
      paramIndex += 1;
    }

    if (endDate) {
      conditions.push(`l.created_at <= $${paramIndex}`);
      params.push(new Date(endDate));
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listQuery = `
      SELECT 
        l.id AS shipment_id,
        l.order_id,
        o.order_number,
        o.user_id,
        l.status,
        l.carrier,
        l.shipping_method,
        l.tracking_number,
        l.shipping_address,
        l.estimated_delivery,
        l.actual_delivery,
        l.created_at,
        l.updated_at
      FROM logistics l
      JOIN orders o ON l.order_id = o.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const listParams = [...params, numericLimit, offset];
    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(
        `SELECT COUNT(*) AS total
         FROM logistics l
         JOIN orders o ON l.order_id = o.id
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
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) AS delivered,
        COUNT(CASE WHEN status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP') THEN 1 END) AS in_transit,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending,
        COUNT(CASE WHEN status IN ('FAILED', 'RETURNED', 'CANCELLED') THEN 1 END) AS failed
      FROM logistics
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
    const shipment = await fetchShipmentById(req.params.shipmentId);

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
      destination,
      estimatedDelivery,
    } = req.body;

    if (!orderId) {
      throw new ValidationError('請提供訂單 ID');
    }

    const order = await findOrderByIdentifier(orderId);
    if (!order) {
      throw new NotFoundError('找不到指定的訂單');
    }

    const shippingAddress = buildShippingAddress(destination, order.shipping_address || {});
    const dbStatus = mapStatusToDb(status);
    const estimatedDeliveryDate = estimatedDelivery ? new Date(estimatedDelivery) : null;
    const actualDeliveryDate = dbStatus === 'DELIVERED' ? new Date() : null;

    const insertResult = await postgresPool.query(
      `INSERT INTO logistics (
         order_id,
         shipping_method,
         carrier,
         tracking_number,
         status,
         shipping_address,
         estimated_delivery,
         actual_delivery
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        order.id,
        method || '標準配送',
        provider || 'manual',
        trackingNumber || null,
        dbStatus,
        shippingAddress,
        estimatedDeliveryDate,
        actualDeliveryDate,
      ]
    );

    const shipment = await fetchShipmentById(insertResult.rows[0].id);

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
      `SELECT id, order_id, shipping_address
       FROM logistics
       WHERE id::text = $1
       LIMIT 1`,
      [shipmentId]
    );

    if (existing.rowCount === 0) {
      throw new NotFoundError('找不到指定的物流紀錄');
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      const dbStatus = mapStatusToDb(status);
      updates.push(`status = $${paramIndex}`);
      params.push(dbStatus);
      paramIndex += 1;

      updates.push(`actual_delivery = $${paramIndex}`);
      params.push(dbStatus === 'DELIVERED' ? new Date() : null);
      paramIndex += 1;
    }

    if (provider !== undefined) {
      updates.push(`carrier = $${paramIndex}`);
      params.push(provider ? provider.trim() : null);
      paramIndex += 1;
    }

    if (method !== undefined) {
      updates.push(`shipping_method = $${paramIndex}`);
      params.push(method || null);
      paramIndex += 1;
    }

    if (trackingNumber !== undefined) {
      updates.push(`tracking_number = $${paramIndex}`);
      params.push(trackingNumber || null);
      paramIndex += 1;
    }

    if (destination) {
      const mergedAddress = buildShippingAddress(destination, existing.rows[0].shipping_address || {});
      updates.push(`shipping_address = $${paramIndex}`);
      params.push(mergedAddress);
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
      UPDATE logistics
      SET ${updates.join(', ')}
      WHERE id::text = $${paramIndex}
    `;
    params.push(shipmentId);

    await postgresPool.query(updateQuery, params);

    const shipment = await fetchShipmentById(shipmentId);

    res.json({ success: true, data: shipment });
  })
);

router.delete(
  '/:shipmentId',
  authenticateToken,
  checkPermission('logistics:manage'),
  asyncHandler(async (req, res) => {
    const { shipmentId } = req.params;

    const existing = await postgresPool.query(
      `SELECT id FROM logistics WHERE id::text = $1 LIMIT 1`,
      [shipmentId]
    );

    if (existing.rowCount === 0) {
      throw new NotFoundError('找不到指定的物流紀錄');
    }

    await postgresPool.query('DELETE FROM logistics WHERE id = $1', [existing.rows[0].id]);

    res.json({ success: true });
  })
);

module.exports = router;
