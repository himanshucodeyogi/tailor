const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');

// GET /admin/dashboard - Admin dashboard with stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalCustomers = await Customer.countDocuments();
    const totalActiveOrders = await Order.countDocuments({ isActive: true });
    const readyForPickup = await Order.countDocuments({
      status: 'Ready for Pickup',
      isActive: true,
    });

    // Get low stock items
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    });
    const lowStockCount = lowStockItems.length;

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: {
        totalCustomers,
        totalActiveOrders,
        readyForPickup,
        lowStockCount,
      },
      statusBreakdown,
      recentOrders,
      lowStockItems,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/admin/login');
  }
});

module.exports = router;
