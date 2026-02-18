const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// GET /admin/orders - List all orders
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { isActive: true };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.render('orders/index', {
      title: 'Orders',
      orders,
      currentStatus: status || 'all',
      statuses: Order.model ? Order.model.STATUSES : [],
    });
  } catch (error) {
    console.error('Orders list error:', error);
    req.flash('error', 'Failed to load orders');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/orders/new - Show create order form
router.get('/new', async (req, res) => {
  try {
    const { customerId } = req.query;
    const customers = await Customer.find().sort({ name: 1 });

    // Order statuses
    const statuses = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

    res.render('orders/new', {
      title: 'Create Order',
      customers,
      selectedCustomerId: customerId || '',
      statuses,
    });
  } catch (error) {
    console.error('Create order form error:', error);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/orders');
  }
});

// POST /admin/orders - Create new order
router.post('/', async (req, res) => {
  try {
    console.log('===== CREATE ORDER REQUEST =====');
    console.log('Raw form data:', req.body);

    const { customer, garmentType, description, price, advancePaid, dueDate, status } = req.body;

    // Validate required fields
    if (!customer || customer.trim() === '') {
      req.flash('error', 'Please select a customer');
      return res.redirect('/admin/orders/new');
    }

    if (!garmentType || garmentType.trim() === '') {
      req.flash('error', 'Please select a garment type');
      return res.redirect('/admin/orders/new');
    }

    // Verify customer exists
    console.log('Checking if customer exists:', customer);
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      req.flash('error', 'Selected customer not found');
      return res.redirect('/admin/orders/new');
    }

    console.log('Customer verified:', customerExists.name);

    // Parse and validate numeric values
    const parsedPrice = price && price !== '' ? parseFloat(price) : 0;
    const parsedAdvance = advancePaid && advancePaid !== '' ? parseFloat(advancePaid) : 0;

    if (isNaN(parsedPrice) || isNaN(parsedAdvance)) {
      req.flash('error', 'Price and advance paid must be valid numbers');
      return res.redirect('/admin/orders/new');
    }

    // Parse due date
    let parsedDueDate = null;
    if (dueDate && dueDate.trim() !== '') {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        req.flash('error', 'Invalid due date');
        return res.redirect('/admin/orders/new');
      }
    }

    // Generate unique order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${random}`;
    console.log('Generated order number:', orderNumber);

    // Create order
    console.log('Creating order with data:');
    console.log('- Customer:', customer);
    console.log('- Garment Type:', garmentType);
    console.log('- Price:', parsedPrice);
    console.log('- Advance Paid:', parsedAdvance);
    console.log('- Status:', status || 'Order Placed');

    const order = new Order({
      orderNumber,
      customer,
      garmentType,
      description: description || '',
      price: parsedPrice,
      advancePaid: parsedAdvance,
      dueDate: parsedDueDate,
      status: status || 'Order Placed',
      isActive: true,
    });

    console.log('Order instance created, saving to database...');
    await order.save();

    console.log('Order saved successfully!');
    console.log('Order ID:', order._id);
    console.log('Order Number:', order.orderNumber);

    req.flash('success', `Order #${order.orderNumber} created successfully!`);
    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    console.error('===== CREATE ORDER ERROR =====');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    let errorMessage = 'Failed to create order';

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      errorMessage = `Validation error: ${messages}`;
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      errorMessage = 'Order number already exists. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Final error message:', errorMessage);
    req.flash('error', errorMessage);
    res.redirect('/admin/orders/new');
  }
});

// GET /admin/orders/:id - View single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    const statuses = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

    res.render('orders/show', {
      title: `Order ${order.orderNumber}`,
      order,
      statuses,
    });
  } catch (error) {
    console.error('Order show error:', error);
    req.flash('error', 'Failed to load order');
    res.redirect('/admin/orders');
  }
});

// GET /admin/orders/:id/edit - Show edit order form
router.get('/:id/edit', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    const customers = await Customer.find().sort({ name: 1 });
    const statuses = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

    res.render('orders/edit', {
      title: 'Edit Order',
      order,
      customers,
      statuses,
    });
  } catch (error) {
    console.error('Order edit form error:', error);
    req.flash('error', 'Failed to load order');
    res.redirect('/admin/orders');
  }
});

// PUT /admin/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const { garmentType, description, price, advancePaid, dueDate, status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    // Update fields
    order.garmentType = garmentType || order.garmentType;
    order.description = description || '';
    order.price = price ? parseFloat(price) : order.price;
    order.advancePaid = advancePaid ? parseFloat(advancePaid) : order.advancePaid;
    order.dueDate = dueDate || order.dueDate;
    order.status = status || order.status;

    await order.save();

    req.flash('success', `Order updated successfully!`);
    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    console.error('Update order error:', error);
    req.flash('error', 'Failed to update order');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
});

// PATCH /admin/orders/:id/status - Quick update order status (API)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('customer');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`Order ${order.orderNumber} status updated to: ${status}`);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /admin/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    req.flash('success', `Order deleted successfully!`);
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Delete order error:', error);
    req.flash('error', 'Failed to delete order');
    res.redirect('/admin/orders');
  }
});

module.exports = router;
