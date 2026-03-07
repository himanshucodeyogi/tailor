const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Tailor = require('../models/Tailor');

// GET /cutting-master/dashboard - View assigned orders
router.get('/dashboard', async (req, res) => {
  try {
    const orders = await Order.find({
      isActive: true,
      assignedCuttingMaster: req.session.cuttingMasterId,
    })
      .populate('customer', 'name phone')
      .populate('assignedTailor', 'name')
      .sort({ createdAt: -1 });

    const stats = {
      totalOrders: orders.length,
      pendingCuts: orders.filter(o => (o.cuttingStatus || 'Pending') !== 'Done').length,
      completedCuts: orders.filter(o => o.cuttingStatus === 'Done').length,
    };

    res.render('cutting-master/dashboard', {
      title: 'Cutting Master Dashboard',
      orders,
      stats,
    });
  } catch (error) {
    console.error('CM Dashboard error:', error);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/cutting-master/login');
  }
});

// GET /cutting-master/orders/:id - View order detail
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      assignedCuttingMaster: req.session.cuttingMasterId,
    })
      .populate('customer')
      .populate('assignedTailor', 'name');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/cutting-master/dashboard');
    }

    const statuses = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];
    const currentIndex = statuses.indexOf(order.status);

    // Get available tailors for assignment (same shop)
    const tailorFilter = req.session.shopId ? { shop: req.session.shopId } : {};
    const tailors = await Tailor.find(tailorFilter).sort({ name: 1 });

    res.render('cutting-master/order', {
      title: `Order ${order.orderNumber}`,
      order,
      statuses,
      currentIndex,
      tailors,
    });
  } catch (error) {
    console.error('CM Order view error:', error);
    req.flash('error', 'Error loading order');
    res.redirect('/cutting-master/dashboard');
  }
});

// GET /cutting-master/bulk-assign - Bulk assign tailor page
router.get('/bulk-assign', async (req, res) => {
  try {
    const orderFilter = {
      isActive: true,
      assignedCuttingMaster: req.session.cuttingMasterId,
      cuttingStatus: 'Done',
    };
    const orders = await Order.find(orderFilter)
      .populate('customer', 'name phone')
      .populate('assignedTailor', 'name')
      .sort({ createdAt: -1 });

    const tailorFilter = req.session.shopId ? { shop: req.session.shopId } : {};
    const tailors = await Tailor.find(tailorFilter).sort({ name: 1 });

    res.render('cutting-master/bulk-assign', {
      title: 'Bulk Assign Tailor',
      orders,
      tailors,
    });
  } catch (error) {
    console.error('CM Bulk assign page error:', error);
    req.flash('error', 'Error loading bulk assign page');
    res.redirect('/cutting-master/dashboard');
  }
});

// POST /cutting-master/bulk-assign - Process bulk tailor assignment
router.post('/bulk-assign', async (req, res) => {
  try {
    const { orderIds, tailorId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'No orders selected' });
    }
    if (!tailorId) {
      return res.status(400).json({ error: 'No tailor selected' });
    }

    const tailor = await Tailor.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds }, assignedCuttingMaster: req.session.cuttingMasterId },
      { assignedTailor: tailorId, status: 'In Stitching' }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} order(s) assigned to ${tailor.name}`,
    });
  } catch (error) {
    console.error('CM Bulk assign error:', error);
    res.status(500).json({ error: 'Failed to assign orders' });
  }
});

// PATCH /cutting-master/orders/:id/cutting-status - Update cutting status
router.patch('/orders/:id/cutting-status', async (req, res) => {
  try {
    const { cuttingStatus } = req.body;

    if (!['Pending', 'Done'].includes(cuttingStatus)) {
      return res.status(400).json({ error: 'Invalid cutting status' });
    }

    // When cutting Done → order status "Cutting"; When Pending → "Order Placed"
    const updateData = { cuttingStatus };
    if (cuttingStatus === 'Done') {
      updateData.status = 'Cutting';
    } else {
      updateData.status = 'Order Placed';
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, assignedCuttingMaster: req.session.cuttingMasterId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Cutting status updated',
      cuttingStatus: order.cuttingStatus,
    });
  } catch (error) {
    console.error('CM cutting status update error:', error);
    res.status(500).json({ error: 'Error updating cutting status' });
  }
});

// PATCH /cutting-master/orders/:id/assign-tailor - Assign tailor to order
router.patch('/orders/:id/assign-tailor', async (req, res) => {
  try {
    const { tailorId } = req.body;

    if (!tailorId) {
      return res.status(400).json({ error: 'Tailor ID is required' });
    }

    // Verify tailor exists
    const tailor = await Tailor.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, assignedCuttingMaster: req.session.cuttingMasterId },
      { assignedTailor: tailorId, status: 'In Stitching' },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Tailor "${tailor.name}" assigned successfully`,
      tailorName: tailor.name,
    });
  } catch (error) {
    console.error('CM assign tailor error:', error);
    res.status(500).json({ error: 'Error assigning tailor' });
  }
});

module.exports = router;
