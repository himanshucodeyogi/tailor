const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Customer = require('../../../models/Customer');
const Order = require('../../../models/Order');
const Inventory = require('../../../models/Inventory');

const ORDER_STATUSES = ['Order Placed', 'Cutting', 'In Stitching', 'Final Touches', 'Ready for Pickup'];

// GET /api/admin/dashboard
// Response 200: { stats, statusBreakdown, recentOrders, lowStockItems }
router.get('/', async (req, res) => {
  try {
    const shopFilter = { shop: req.shopId };
    const totalCustomers = await Customer.countDocuments(shopFilter);
    const totalActiveOrders = await Order.countDocuments({ ...shopFilter, isActive: true });
    const readyForPickup = await Order.countDocuments({ ...shopFilter, status: 'Ready for Pickup', isActive: true });

    const lowStockItems = await Inventory.find({
      ...shopFilter,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).lean();

    const statusBreakdown = await Order.aggregate([
      { $match: { shop: new mongoose.Types.ObjectId(req.shopId), isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const recentOrders = await Order.find(shopFilter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      stats: {
        totalCustomers,
        totalActiveOrders,
        readyForPickup,
        lowStockCount: lowStockItems.length,
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s._id,
        count: s.count,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        garmentType: o.garmentType,
        status: o.status,
        statusIndex: ORDER_STATUSES.indexOf(o.status),
        price: o.price,
        advancePaid: o.advancePaid,
        balanceDue: o.price - o.advancePaid,
        dueDate: o.dueDate,
        createdAt: o.createdAt,
        customer: o.customer
          ? { id: o.customer._id, name: o.customer.name, phone: o.customer.phone }
          : null,
      })),
      lowStockItems: lowStockItems.map((i) => ({
        id: i._id,
        itemName: i.itemName,
        quantity: i.quantity,
        unit: i.unit,
        lowStockThreshold: i.lowStockThreshold,
        isLowStock: i.quantity <= i.lowStockThreshold,
      })),
    });
  } catch (err) {
    console.error('API dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
