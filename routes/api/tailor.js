const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const Customer = require('../../models/Customer');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

// GET /api/tailor/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const orders = await Order.find({ isActive: true, shop: req.shopId, assignedTailor: req.tailorId })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      totalOrders: orders.length,
      readyForPickup: orders.filter((o) => o.status === 'Ready for Pickup').length,
      inProgress: orders.filter((o) =>
        ['Cutting', 'In Stitching', 'Final Touches'].includes(o.status)
      ).length,
    };

    res.json({
      stats,
      orders: orders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        garmentType: o.garmentType,
        status: o.status,
        statusIndex: ORDER_STATUSES.indexOf(o.status),
        dueDate: o.dueDate,
        createdAt: o.createdAt,
        customer: o.customer
          ? { id: o.customer._id, name: o.customer.name, phone: o.customer.phone }
          : null,
      })),
    });
  } catch (err) {
    console.error('API tailor dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tailor/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, shop: req.shopId, assignedTailor: req.tailorId }).populate('customer').lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        garmentType: order.garmentType,
        description: order.description,
        status: order.status,
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
    console.error('API tailor order detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tailor/orders/:id/status
// Body: { status, readyPhotoUrl? }
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, readyPhotoUrl } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'Ready for Pickup' && !readyPhotoUrl) {
      return res.status(400).json({ error: 'Photo is required for Ready for Pickup status' });
    }

    const update = { status };
    if (readyPhotoUrl) {
      update.readyPhotoUrl = readyPhotoUrl;
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId, assignedTailor: req.tailorId },
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order: {
        id: order._id,
        status: order.status,
        statusIndex: ORDER_STATUSES.indexOf(order.status),
        readyPhotoUrl: order.readyPhotoUrl || null,
      },
    });
  } catch (err) {
    console.error('API tailor update status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tailor/customers/:id/measurements
// Body: { measurements: [{type, length, chest, shoulder, waist, arm, neck, hip, thigh, notes}] }
router.put('/customers/:id/measurements', async (req, res) => {
  try {
    const { measurements } = req.body;
    const customer = await Customer.findOne({ _id: req.params.id, shop: req.shopId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.measurements = measurements || [];
    await customer.save();

    res.json({
      customer: {
        id: customer._id,
        name: customer.name,
        measurements: customer.measurements,
      },
    });
  } catch (err) {
    console.error('API tailor update measurements error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
