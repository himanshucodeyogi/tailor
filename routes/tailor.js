const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /tailor/dashboard - View my assigned orders
router.get('/dashboard', async (req, res) => {
  try {
    const orderFilter = { isActive: true, assignedTailor: req.session.tailorId };
    if (req.session.shopId) orderFilter.shop = req.session.shopId;
    const orders = await Order.find(orderFilter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    const stats = {
      totalOrders: orders.length,
      readyForPickup: orders.filter(o => o.status === 'Ready for Pickup').length,
      inProgress: orders.filter(o => ['Cutting', 'In Stitching', 'Final Touches'].includes(o.status)).length,
    };

    res.render('tailor/dashboard', {
      title: 'Tailor Dashboard',
      orders,
      stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/tailor/login');
  }
});

// GET /tailor/orders/:id - View order detail with customer measurements
router.get('/orders/:id', async (req, res) => {
  try {
    const oFilter = { _id: req.params.id, assignedTailor: req.session.tailorId };
    if (req.session.shopId) oFilter.shop = req.session.shopId;
    const order = await Order.findOne(oFilter).populate('customer');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/tailor/dashboard');
    }

    const statuses = Order.STATUSES;
    const currentIndex = statuses.indexOf(order.status);

    res.render('tailor/order', {
      title: `Order ${order.orderNumber}`,
      order,
      statuses,
      currentIndex,
      statusColors: Order.STATUS_COLORS,
    });
  } catch (error) {
    console.error('Order view error:', error);
    req.flash('error', 'Error loading order');
    res.redirect('/tailor/dashboard');
  }
});

// PATCH /tailor/orders/:id/status - Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, readyPhotoUrl } = req.body;
    const validStatuses = Order.STATUSES;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const statusFilter = { _id: req.params.id, assignedTailor: req.session.tailorId };
    if (req.session.shopId) statusFilter.shop = req.session.shopId;

    if (status === 'Ready for Pickup') {
      if (!readyPhotoUrl) {
        return res.status(400).json({ error: 'Photo is required for Ready for Pickup status' });
      }

      const order = await Order.findOneAndUpdate(
        statusFilter,
        { pendingReadyPhoto: readyPhotoUrl, pendingApproval: true },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({
        success: true,
        pendingApproval: true,
        message: 'Photo submitted for owner approval',
      });
    }

    const order = await Order.findOneAndUpdate(
      statusFilter,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      status: order.status,
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Error updating status' });
  }
});

module.exports = router;
