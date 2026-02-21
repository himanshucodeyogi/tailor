const express = require('express');
const router = express.Router();
const Customer = require('../../../models/Customer');
const Order = require('../../../models/Order');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];
const VALID_TYPES = ['pant', 'shirt', 'coat', 'jacket', 'kurta', 'salwar', 'sherwani', 'lehenga', 'saree', 'other'];

function formatCustomer(c) {
  return {
    id: c._id,
    name: c.name,
    phone: c.phone,
    notes: c.notes,
    measurements: c.measurements,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// GET /api/admin/customers?phone=xxx&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { phone, page = 1, limit = 20 } = req.query;
    let filter = { shop: req.shopId };

    if (phone && phone.trim()) {
      filter.phone = { $regex: phone.replace(/\D/g, ''), $options: 'i' };
    }

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      customers: customers.map(formatCustomer),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('API customers list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/customers
// Body: { name, phone, notes, measurements: [{type, length, shoulder, chest, waist, ...}] }
router.post('/', async (req, res) => {
  try {
    const { name, phone, notes, measurements = [] } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number (10-15 digits required)' });
    }

    const existing = await Customer.findOne({ phone: cleanPhone, shop: req.shopId });
    if (existing) {
      return res.status(409).json({ error: 'Customer with this phone number already exists' });
    }

    for (const m of measurements) {
      if (!VALID_TYPES.includes(m.type)) {
        return res.status(400).json({ error: `Invalid measurement type: ${m.type}` });
      }
    }

    const customer = new Customer({ name, phone: cleanPhone, notes, measurements, shop: req.shopId });
    await customer.save();

    res.status(201).json({ customer: formatCustomer(customer) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Phone number already exists' });
    }
    console.error('API create customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, shop: req.shopId }).lean();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const orders = await Order.find({ customer: customer._id, shop: req.shopId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      customer: formatCustomer(customer),
      orders: orders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        garmentType: o.garmentType,
        status: o.status,
        statusIndex: ORDER_STATUSES.indexOf(o.status),
        price: o.price,
        advancePaid: o.advancePaid,
        balanceDue: o.price - o.advancePaid,
        dueDate: o.dueDate,
        isActive: o.isActive,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error('API customer detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, notes, measurements = [] } = req.body;
    const customer = await Customer.findOne({ _id: req.params.id, shop: req.shopId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const cleanPhone = phone ? phone.replace(/\D/g, '') : customer.phone;
    if (phone && cleanPhone !== customer.phone) {
      const existing = await Customer.findOne({ phone: cleanPhone, shop: req.shopId });
      if (existing) return res.status(409).json({ error: 'Phone number in use by another customer' });
    }

    customer.name = name || customer.name;
    customer.phone = cleanPhone;
    customer.notes = notes !== undefined ? notes : customer.notes;
    customer.measurements = measurements;

    await customer.save();
    res.json({ customer: formatCustomer(customer) });
  } catch (err) {
    console.error('API update customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, shop: req.shopId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    await Order.deleteMany({ customer: req.params.id, shop: req.shopId });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('API delete customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
