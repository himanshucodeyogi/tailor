const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// GET / - Home page with order tracking form
router.get('/', (req, res) => {
  res.render('public/home', { title: 'Home' });
});

// POST /track - Handle order tracking by phone number
router.post('/track', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length === 0) {
      return res.render('public/home', {
        title: 'Home',
        trackError: 'Please enter a phone number',
      });
    }

    // Find customer by phone
    const customer = await Customer.findOne({
      phone: phone.replace(/\D/g, ''),
    });

    if (!customer) {
      return res.render('public/home', {
        title: 'Home',
        trackError: 'No customer found with that phone number',
      });
    }

    // Find active orders for this customer
    const orders = await Order.find({
      customer: customer._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(3);

    if (orders.length === 0) {
      return res.render('public/home', {
        title: 'Home',
        trackError: 'No active orders found for this phone number',
      });
    }

    // Render with tracking results
    res.render('public/home', {
      title: 'Home',
      trackResults: { customer, orders },
    });
  } catch (error) {
    console.error('Track error:', error);
    res.render('public/home', {
      title: 'Home',
      trackError: 'An error occurred. Please try again.',
    });
  }
});

// GET /pricing - Static pricing page
router.get('/pricing', (req, res) => {
  res.render('public/pricing', { title: 'Pricing' });
});

// GET /portfolio - Portfolio page
router.get('/portfolio', (req, res) => {
  res.render('public/portfolio', { title: 'Portfolio' });
});

module.exports = router;
