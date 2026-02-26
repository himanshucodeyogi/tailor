const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const Shop = require('../../models/Shop');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

// POST /api/track
// Body: { phone, shopCode }
// Response 200: { customer: { name, phone }, orders: [...] }
// Returns orders from ALL shops for the given phone number
router.post('/track', async (req, res) => {
  try {
    const { phone, shopCode } = req.body;

    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Find ALL customers with this phone number across all shops
    let customerQuery = { phone: cleanPhone };
    if (shopCode && shopCode.trim()) {
      const shop = await Shop.findOne({ shopCode: shopCode.trim().toUpperCase() }).lean();
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
      customerQuery.shop = shop._id;
    }

    const customers = await Customer.find(customerQuery).lean();

    if (customers.length === 0) {
      return res.status(404).json({ error: 'No customer found with that phone number' });
    }

    // Get customer IDs for finding orders
    const customerIds = customers.map(c => c._id);

    // Find all orders for these customers
    const orders = await Order.find({
      customer: { $in: customerIds },
      isActive: true
    })
      .populate('shop', 'shopName address phone shopCode')
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length === 0) {
      return res.status(404).json({ error: 'No active orders found for this phone number' });
    }

    // Use the first customer's name (they should all have same name)
    const customerName = customers[0].name;

    res.json({
      customer: { name: customerName, phone: cleanPhone },
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
        cuttingStatus: o.cuttingStatus || 'Pending',
        // Include shop details with each order
        shop: o.shop ? {
          id: o.shop._id,
          name: o.shop.shopName,
          code: o.shop.shopCode,
          address: o.shop.address || '',
          phone: o.shop.phone || ''
        } : null,
      })),
    });
  } catch (err) {
    console.error('API track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
