const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const Shop = require('../models/Shop');
const Admin = require('../models/Admin');

// GET /register - Show shop registration form
router.get('/register', (req, res) => {
  // Redirect if already logged in
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('auth/register', { title: 'Register Shop' });
});

// POST /register - Create shop + admin
router.post('/register', async (req, res) => {
  try {
    const { shopName, phone, address, adminUsername, adminPassword, confirmPassword } = req.body;

    // Validation
    if (!shopName || !adminUsername || !adminPassword) {
      req.flash('error', 'Shop name, admin username, and password are required');
      return res.redirect('/register');
    }

    if (adminPassword.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/register');
    }

    if (adminPassword !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(adminPassword, salt);

    // Create shop
    const shop = new Shop({
      shopName,
      phone: phone || '',
      address: address || '',
    });
    await shop.save();

    // Create admin for this shop
    let admin;
    try {
      admin = new Admin({
        username: adminUsername,
        passwordHash,
        shop: shop._id,
      });
      await admin.save();
    } catch (adminErr) {
      // Rollback: delete shop if admin creation fails
      await Shop.findByIdAndDelete(shop._id);
      throw adminErr;
    }

    // Auto-login: set session
    req.session.adminId = admin._id;
    req.session.adminUsername = admin.username;
    req.session.shopId = shop._id;
    req.session.shopName = shop.shopName;
    req.session.shopCode = shop.shopCode;

    req.flash('success', `Shop "${shop.shopName}" registered! Your Shop Code is: ${shop.shopCode} — share this code with your team for login.`);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Shop registration error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'unknown';
      if (field === 'username') {
        req.flash('error', 'Admin username already exists in this shop');
      } else {
        req.flash('error', 'Shop code conflict, please try again');
      }
      return res.redirect('/register');
    }

    req.flash('error', 'Error registering shop');
    res.redirect('/register');
  }
});

module.exports = router;
