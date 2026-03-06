const express = require('express');
const router = express.Router();
const CuttingMaster = require('../models/CuttingMaster');
const Shop = require('../models/Shop');
const { redirectCMIfLoggedIn } = require('../middleware/auth');

// GET /cutting-master/login - Show login form
router.get('/login', redirectCMIfLoggedIn, (req, res) => {
  res.render('cutting-master/login', { title: 'Cutting Master Login' });
});

// POST /cutting-master/login - Process login
router.post('/login', redirectCMIfLoggedIn, async (req, res) => {
  try {
    const { username, password, shopCode } = req.body;

    if (!username || !password || !shopCode) {
      req.flash('error', 'Shop code, username, and password are required');
      return res.redirect('/cutting-master/login');
    }

    // Find shop by code
    const shop = await Shop.findOne({ shopCode: shopCode.trim().toUpperCase() });
    if (!shop) {
      req.flash('error', 'Invalid shop code');
      return res.redirect('/cutting-master/login');
    }

    // Find cutting master by username within this shop
    const cm = await CuttingMaster.findOne({ username, shop: shop._id });

    if (!cm) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/cutting-master/login');
    }

    // Compare password
    const isPasswordValid = await cm.comparePassword(password);

    if (!isPasswordValid) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/cutting-master/login');
    }

    // Create session
    req.session.cuttingMasterId = cm._id;
    req.session.cuttingMasterName = cm.name;
    req.session.shopId = shop._id;
    req.session.shopName = shop.shopName;
    req.session.shopCode = shop.shopCode;

    req.flash('success', `Welcome, ${cm.name}!`);
    res.redirect('/cutting-master/dashboard');
  } catch (error) {
    console.error('Cutting Master login error:', error);
    req.flash('error', 'Server error during login');
    res.redirect('/cutting-master/login');
  }
});

// POST /cutting-master/logout - Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/cutting-master/login');
  });
});

module.exports = router;
