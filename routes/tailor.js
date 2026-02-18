const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// GET /tailor/dashboard - View all active orders
router.get('/dashboard', async (req, res) => {
  try {
    const orders = await Order.find({ isActive: true })
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
    const order = await Order.findById(req.params.id).populate('customer');

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
    const { status } = req.body;
    const validStatuses = Order.STATUSES;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
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

// GET /tailor/customers/:id/measurements/edit - View/edit customer measurements
router.get('/customers/:id/measurements/edit', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/tailor/dashboard');
    }

    const measurementTypes = [
      'pant', 'shirt', 'coat', 'jacket', 'kurta',
      'salwar', 'sherwani', 'lehenga', 'saree', 'other'
    ];

    res.render('tailor/edit-measurements', {
      title: `Edit Measurements - ${customer.name}`,
      customer,
      measurementTypes,
    });
  } catch (error) {
    console.error('Edit measurements view error:', error);
    req.flash('error', 'Error loading customer');
    res.redirect('/tailor/dashboard');
  }
});

// PUT /tailor/customers/:id/measurements - Update customer measurements
router.put('/customers/:id/measurements', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/tailor/dashboard');
    }

    const { measurementTypes } = req.body;

    // Clear existing measurements
    customer.measurements = [];

    // Add new measurements based on submitted types
    if (Array.isArray(measurementTypes)) {
      measurementTypes.forEach((type) => {
        const measurement = {
          type,
          length: req.body[`length_${type}`] ? parseFloat(req.body[`length_${type}`]) : null,
          chest: req.body[`chest_${type}`] ? parseFloat(req.body[`chest_${type}`]) : null,
          shoulder: req.body[`shoulder_${type}`] ? parseFloat(req.body[`shoulder_${type}`]) : null,
          waist: req.body[`waist_${type}`] ? parseFloat(req.body[`waist_${type}`]) : null,
          arm: req.body[`arm_${type}`] ? parseFloat(req.body[`arm_${type}`]) : null,
          neck: req.body[`neck_${type}`] ? parseFloat(req.body[`neck_${type}`]) : null,
          hip: req.body[`hip_${type}`] ? parseFloat(req.body[`hip_${type}`]) : null,
          thigh: req.body[`thigh_${type}`] ? parseFloat(req.body[`thigh_${type}`]) : null,
          notes: req.body[`notes_${type}`] || '',
        };
        customer.measurements.push(measurement);
      });
    }

    await customer.save();
    req.flash('success', 'Measurements updated successfully');
    res.redirect(`/tailor/orders?customerId=${customer._id}`);
  } catch (error) {
    console.error('Measurements update error:', error);
    req.flash('error', 'Error updating measurements');
    res.redirect(`/tailor/customers/${req.params.id}/measurements/edit`);
  }
});

module.exports = router;
