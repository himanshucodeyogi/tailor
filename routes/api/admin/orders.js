const express = require('express');
const router = express.Router();
const Order = require('../../../models/Order');
const Customer = require('../../../models/Customer');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

function formatOrder(o) {
  const customer = o.customer;
  return {
    id: o._id,
    orderNumber: o.orderNumber,
    garmentType: o.garmentType,
    description: o.description,
    status: o.status,
    statusIndex: ORDER_STATUSES.indexOf(o.status),
    price: o.price,
    advancePaid: o.advancePaid,
    balanceDue: o.price - o.advancePaid,
    dueDate: o.dueDate,
    isActive: o.isActive,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    customer: customer
      ? { id: customer._id, name: customer.name, phone: customer.phone }
      : null,
  };
}

// GET /api/admin/orders?status=xxx&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let filter = { isActive: true, shop: req.shopId };
    if (status && status !== 'all' && ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      orders: orders.map(formatOrder),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      statuses: ORDER_STATUSES,
    });
  } catch (err) {
    console.error('API orders list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/orders
// Body: { customerId, garmentType, description, price, advancePaid, dueDate, status }
router.post('/', async (req, res) => {
  try {
    const { customerId, garmentType, description, price, advancePaid, dueDate, status } = req.body;

    if (!customerId) return res.status(400).json({ error: 'Customer is required' });
    if (!garmentType) return res.status(400).json({ error: 'Garment type is required' });

    const customer = await Customer.findOne({ _id: customerId, shop: req.shopId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    const order = new Order({
      orderNumber,
      customer: customerId,
      garmentType,
      description: description || '',
      price: price ? parseFloat(price) : 0,
      advancePaid: advancePaid ? parseFloat(advancePaid) : 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'Order Placed',
      isActive: true,
      shop: req.shopId,
    });

    await order.save();
    await order.populate('customer', 'name phone');

    res.status(201).json({ order: formatOrder(order.toObject({ virtuals: false })) });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    console.error('API create order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, shop: req.shopId }).populate('customer').lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: formatOrder(order) });
  } catch (err) {
    console.error('API order detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/orders/:id
router.put('/:id', async (req, res) => {
  try {
    const { garmentType, description, price, advancePaid, dueDate, status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shop: req.shopId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (garmentType) order.garmentType = garmentType;
    if (description !== undefined) order.description = description;
    if (price !== undefined) order.price = parseFloat(price);
    if (advancePaid !== undefined) order.advancePaid = parseFloat(advancePaid);
    if (dueDate !== undefined) order.dueDate = dueDate ? new Date(dueDate) : null;
    if (status && ORDER_STATUSES.includes(status)) order.status = status;

    await order.save();
    await order.populate('customer', 'name phone');

    res.json({ order: formatOrder(order.toObject({ virtuals: false })) });
  } catch (err) {
    console.error('API update order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/orders/:id/status
// Body: { status }
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId },
      { status },
      { new: true, runValidators: true }
    ).populate('customer', 'name phone').lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ order: formatOrder(order) });
  } catch (err) {
    console.error('API update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, shop: req.shopId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('API delete order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
