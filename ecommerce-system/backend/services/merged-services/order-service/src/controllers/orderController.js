const { Order, OrderItem, Payment, Logistics } = require('../models');
const { Op } = require('sequelize');
// ... other imports

// --- Helper function to update order status ---
const updateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    const order = await Order.findByPk(orderId);
    if (!order) {
        throw new Error('Order not found');
    }
    // Add status transition validation logic here if needed
    await order.update({ status: newStatus, ...additionalData });
    return order;
};


// --- New Controller Functions ---

const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        await order.update(req.body);
        res.json({ success: true, message: 'Order updated successfully', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating order', error: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        await order.update({ status: 'deleted', deleted_at: new Date() }); // Soft delete
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting order', error: error.message });
    }
};

const confirmOrder = async (req, res) => {
    try {
        const order = await updateOrderStatus(req.params.id, 'confirmed');
        res.json({ success: true, message: 'Order confirmed', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error confirming order', error: error.message });
    }
};

const shipOrder = async (req, res) => {
    try {
        const { trackingNumber } = req.body;
        const order = await updateOrderStatus(req.params.id, 'shipped', { tracking_number: trackingNumber });
        res.json({ success: true, message: 'Order shipped', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error shipping order', error: error.message });
    }
};

const completeOrder = async (req, res) => {
    try {
        const order = await updateOrderStatus(req.params.id, 'delivered');
        res.json({ success: true, message: 'Order completed', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error completing order', error: error.message });
    }
};

const returnOrder = async (req, res) => {
    try {
        const order = await updateOrderStatus(req.params.id, 'returned');
        res.json({ success: true, message: 'Order returned', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error returning order', error: error.message });
    }
};

const exportOrders = async (req, res) => {
    try {
        // Add logic to query orders and convert to CSV
        res.header('Content-Type', 'text/csv');
        res.attachment('orders.csv');
        res.send('order_id,user_id,status,total\n1,user1,shipped,100\n');
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error exporting orders', error: error.message });
    }
};

const batchUpdateStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        await Order.update({ status }, { where: { id: { [Op.in]: orderIds } } });
        res.json({ success: true, message: 'Batch update successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error in batch update', error: error.message });
    }
};


// --- Existing Controller Functions (Modified for consistency if needed) ---
const getOrders = async (req, res) => { /* ... existing implementation ... */ };
const getOrderById = async (req, res) => { /* ... existing implementation ... */ };
const createOrder = async (req, res) => { /* ... existing implementation ... */ };
const cancelOrder = async (req, res) => { /* ... existing implementation, but now uses PUT ... */ };
const getOrderStats = async (req, res) => { /* ... renamed from getOrderStatistics ... */ };
const getOrderOverview = async (req, res) => { /* ... existing implementation ... */ };


module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    cancelOrder,
    confirmOrder,
    shipOrder,
    completeOrder,
    returnOrder,
    getOrderStats,
    getOrderOverview,
    exportOrders,
    batchUpdateStatus
};