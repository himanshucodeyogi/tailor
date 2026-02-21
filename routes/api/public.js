const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const Shop = require('../../models/Shop');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

// POST /api/track
// Body: { phone, shopCode }
// Response 200: { customer: { id, name, phone }, orders: [...] }
router.post('/track', async (req, res) => {
  try {
    const { phone, shopCode } = req.body;

    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Build customer query
    let customerQuery = { phone: cleanPhone };
    if (shopCode && shopCode.trim()) {
      const shop = await Shop.findOne({ shopCode: shopCode.trim().toUpperCase() }).lean();
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
      customerQuery.shop = shop._id;
    }

    const customer = await Customer.findOne(customerQuery).lean();

    if (!customer) {
      return res.status(404).json({ error: 'No customer found with that phone number' });
    }

    const orders = await Order.find({ customer: customer._id, isActive: true, shop: customer.shop })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (orders.length === 0) {
      return res.status(404).json({ error: 'No active orders found for this phone number' });
    }

    // Fetch shop details for display
    const shop = customer.shop
      ? await Shop.findById(customer.shop).select('shopName address phone').lean()
      : null;

    res.json({
      customer: { id: customer._id, name: customer.name, phone: customer.phone },
      shop: shop
        ? { name: shop.shopName, address: shop.address || '', phone: shop.phone || '' }
        : null,
      orders: orders.map((o) => ({
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
        createdAt: o.createdAt,
        readyPhotoUrl: o.readyPhotoUrl || null,
      })),
    });
  } catch (err) {
    console.error('API track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
