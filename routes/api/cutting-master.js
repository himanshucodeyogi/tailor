const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const Tailor = require('../../models/Tailor');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

// GET /api/cuttingmaster/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const orders = await Order.find({
      isActive: true,
      shop: req.shopId,
      assignedCuttingMaster: req.cuttingMasterId,
    })
      .populate('customer', 'name phone')
      .populate('assignedTailor', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      totalOrders: orders.length,
      cuttingPending: orders.filter((o) => o.cuttingStatus !== 'Done').length,
      cuttingDone: orders.filter((o) => o.cuttingStatus === 'Done').length,
    };

    res.json({
      stats,
      orders: orders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        garmentType: o.garmentType,
        status: o.status,
        cuttingStatus: o.cuttingStatus || 'Pending',
        statusIndex: ORDER_STATUSES.indexOf(o.status),
        dueDate: o.dueDate,
        createdAt: o.createdAt,
        customer: o.customer
          ? { id: o.customer._id, name: o.customer.name, phone: o.customer.phone }
          : null,
        assignedTailor: o.assignedTailor
          ? { id: o.assignedTailor._id, name: o.assignedTailor.name }
          : null,
      })),
    });
  } catch (err) {
    console.error('API cutting master dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cuttingmaster/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      shop: req.shopId,
      assignedCuttingMaster: req.cuttingMasterId,
    })
      .populate('customer')
      .lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        garmentType: order.garmentType,
        description: order.description,
        status: order.status,
        cuttingStatus: order.cuttingStatus || 'Pending',
        statusIndex: ORDER_STATUSES.indexOf(order.status),
        statuses: ORDER_STATUSES,
        price: order.price,
        advancePaid: order.advancePaid,
        balanceDue: order.price - order.advancePaid,
        dueDate: order.dueDate,
        createdAt: order.createdAt,
        readyPhotoUrl: order.readyPhotoUrl || null,
        customer: order.customer
          ? {
              id: order.customer._id,
              name: order.customer.name,
              phone: order.customer.phone,
              measurements: order.customer.measurements,
              notes: order.customer.notes,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('API cutting master order detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/cuttingmaster/orders/:id/cutting-status
// Body: { cuttingStatus: 'Pending' | 'Done', status?: string }
router.patch('/orders/:id/cutting-status', async (req, res) => {
  try {
    const { cuttingStatus, status } = req.body;
    if (!['Pending', 'Done'].includes(cuttingStatus)) {
      return res.status(400).json({ error: 'Invalid cutting status. Must be Pending or Done.' });
    }

    const updateData = { cuttingStatus };

    // If status is provided, update it along with statusIndex
    if (status && ORDER_STATUSES.includes(status)) {
      updateData.status = status;
      updateData.statusIndex = ORDER_STATUSES.indexOf(status);
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId, assignedCuttingMaster: req.cuttingMasterId },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order: {
        id: order._id,
        cuttingStatus: order.cuttingStatus,
        status: order.status,
        statusIndex: ORDER_STATUSES.indexOf(order.status),
      },
    });
  } catch (err) {
    console.error('API cutting master update cutting status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/cuttingmaster/orders/:id/assign-tailor
// Body: { tailorId: string, status?: string }
router.patch('/orders/:id/assign-tailor', async (req, res) => {
  try {
    const { tailorId, status } = req.body;
    if (!tailorId) {
      return res.status(400).json({ error: 'tailorId is required' });
    }

    // Verify tailor belongs to same shop
    const tailor = await Tailor.findOne({ _id: tailorId, shop: req.shopId }).lean();
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }

    const updateData = { assignedTailor: tailorId };

    // If status is provided, update it along with statusIndex
    if (status && ORDER_STATUSES.includes(status)) {
      updateData.status = status;
      updateData.statusIndex = ORDER_STATUSES.indexOf(status);
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId, assignedCuttingMaster: req.cuttingMasterId },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order: {
        id: order._id,
        assignedTailor: tailorId,
        tailorName: tailor.name,
        status: order.status,
        statusIndex: ORDER_STATUSES.indexOf(order.status),
      },
    });
  } catch (err) {
    console.error('API cutting master assign tailor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/cuttingmaster/orders/bulk-assign-tailor
// Body: { orderIds: [...], tailorId: "..." }
router.post('/orders/bulk-assign-tailor', async (req, res) => {
  try {
    const { orderIds, tailorId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds array is required' });
    }
    if (!tailorId) {
      return res.status(400).json({ error: 'tailorId is required' });
    }

    const tailor = await Tailor.findOne({ _id: tailorId, shop: req.shopId }).lean();
    if (!tailor) return res.status(404).json({ error: 'Tailor not found' });

    const result = await Order.updateMany(
      { _id: { $in: orderIds }, shop: req.shopId, assignedCuttingMaster: req.cuttingMasterId },
      { assignedTailor: tailorId }
    );

    res.json({
      message: `${result.modifiedCount} orders assigned to ${tailor.name}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('API cutting master bulk assign tailor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cuttingmaster/tailors
router.get('/tailors', async (req, res) => {
  try {
    const tailors = await Tailor.find({ shop: req.shopId }).sort({ name: 1 }).lean();
    res.json({
      tailors: tailors.map((t) => ({
        id: t._id,
        name: t.name,
        username: t.username,
      })),
    });
  } catch (err) {
    console.error('API cutting master tailors list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
