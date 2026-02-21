const express = require('express');
const router = express.Router();
const Order = require('../../../models/Order');
const Customer = require('../../../models/Customer');
const Tailor = require('../../../models/Tailor');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

function formatOrder(o) {
  const customer = o.customer;
  const tailor = o.assignedTailor;
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
    readyPhotoUrl: o.readyPhotoUrl || null,
    pendingApproval: o.pendingApproval || false,
    pendingReadyPhoto: o.pendingReadyPhoto || null,
    assignedTailor: tailor
      ? { id: tailor._id, name: tailor.name }
      : null,
  };
}

// GET /api/admin/orders?status=xxx&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, pendingApproval } = req.query;
    let filter = { isActive: true, shop: req.shopId };
    if (status && status !== 'all' && ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (pendingApproval === 'true') {
      filter.pendingApproval = true;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .populate('assignedTailor', 'name')
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
    const { customerId, garmentType, description, price, advancePaid, dueDate, status, tailorId } = req.body;

    if (!customerId) return res.status(400).json({ error: 'Customer is required' });
    if (!garmentType) return res.status(400).json({ error: 'Garment type is required' });

    const customer = await Customer.findOne({ _id: customerId, shop: req.shopId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const orderNumber = await Order.generateNextOrderNumber(req.shopId);

    const order = new Order({
      orderNumber,
      customer: customerId,
      garmentType,
      description: description || '',
      price: price ? parseFloat(price) : 0,
      advancePaid: advancePaid ? parseFloat(advancePaid) : 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'Order Placed',
      assignedTailor: tailorId || null,
      isActive: true,
      shop: req.shopId,
    });

    await order.save();
    await order.populate('customer', 'name phone');
    await order.populate('assignedTailor', 'name');

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
    const order = await Order.findOne({ _id: req.params.id, shop: req.shopId })
      .populate('customer')
      .populate('assignedTailor', 'name')
      .lean();
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
    const { garmentType, description, price, advancePaid, dueDate, status, tailorId } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shop: req.shopId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (garmentType) order.garmentType = garmentType;
    if (description !== undefined) order.description = description;
    if (price !== undefined) order.price = parseFloat(price);
    if (advancePaid !== undefined) order.advancePaid = parseFloat(advancePaid);
    if (dueDate !== undefined) order.dueDate = dueDate ? new Date(dueDate) : null;
    if (status && ORDER_STATUSES.includes(status)) order.status = status;
    if (tailorId !== undefined) order.assignedTailor = tailorId || null;

    await order.save();
    await order.populate('customer', 'name phone');
    await order.populate('assignedTailor', 'name');

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
    ).populate('customer', 'name phone').populate('assignedTailor', 'name').lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ order: formatOrder(order) });
  } catch (err) {
    console.error('API update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/orders/:id/assign
// Body: { tailorId: "..." } or { tailorId: null }
router.patch('/:id/assign', async (req, res) => {
  try {
    const { tailorId } = req.body;

    if (tailorId) {
      const tailor = await Tailor.findOne({ _id: tailorId, shop: req.shopId });
      if (!tailor) return res.status(404).json({ error: 'Tailor not found' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId },
      { assignedTailor: tailorId || null },
      { new: true, runValidators: true }
    ).populate('customer', 'name phone').populate('assignedTailor', 'name').lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ order: formatOrder(order) });
  } catch (err) {
    console.error('API assign tailor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/orders/bulk-assign
// Body: { orderIds: [...], tailorId: "..." }
router.post('/bulk-assign', async (req, res) => {
  try {
    const { orderIds, tailorId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds array is required' });
    }
    if (!tailorId) {
      return res.status(400).json({ error: 'tailorId is required' });
    }

    const tailor = await Tailor.findOne({ _id: tailorId, shop: req.shopId });
    if (!tailor) return res.status(404).json({ error: 'Tailor not found' });

    const result = await Order.updateMany(
      { _id: { $in: orderIds }, shop: req.shopId },
      { assignedTailor: tailorId }
    );

    res.json({
      message: `${result.modifiedCount} orders assigned to ${tailor.name}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('API bulk assign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/orders/:id/approve-ready
// Body: { approved: true/false }
router.patch('/:id/approve-ready', async (req, res) => {
  try {
    const { approved } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shop: req.shopId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.pendingApproval) return res.status(400).json({ error: 'No pending approval for this order' });

    if (approved) {
      order.status = 'Ready for Pickup';
      order.readyPhotoUrl = order.pendingReadyPhoto;
    }
    order.pendingApproval = false;
    order.pendingReadyPhoto = null;

    await order.save();
    await order.populate('customer', 'name phone');
    await order.populate('assignedTailor', 'name');

    res.json({ order: formatOrder(order.toObject({ virtuals: false })) });
  } catch (err) {
    console.error('API approve-ready error:', err);
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
