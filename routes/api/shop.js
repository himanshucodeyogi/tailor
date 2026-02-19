const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const Shop = require('../../models/Shop');
const Admin = require('../../models/Admin');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../middleware/jwt-auth');

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// POST /api/shops/register
// Body: { shopName, phone, address, adminUsername, adminPassword }
// Creates a new shop + first admin account
router.post('/register', async (req, res) => {
  try {
    const { shopName, phone, address, adminUsername, adminPassword } = req.body;

    if (!shopName || !adminUsername || !adminPassword) {
      return res.status(400).json({
        error: 'Shop name, admin username, and admin password are required',
      });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash password first (before creating anything)
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(adminPassword, salt);

    // Create shop (shopCode auto-generated)
    const shop = new Shop({ shopName, phone: phone || '', address: address || '' });
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
      // Rollback: delete the shop if admin creation fails
      await Shop.findByIdAndDelete(shop._id);
      throw adminErr;
    }

    // Auto-login: generate token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin', shopId: shop._id },
      JWT_SECRET,
      { expiresIn: EXPIRES_IN }
    );

    res.status(201).json({
      shop: { id: shop._id, shopName: shop.shopName, shopCode: shop.shopCode },
      admin: { id: admin._id, username: admin.username },
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      console.error('Duplicate key error:', JSON.stringify(err.keyValue));
      const field = Object.keys(err.keyValue || {})[0] || 'unknown';
      if (field === 'username') {
        return res.status(409).json({ error: 'Admin username already exists in this shop' });
      }
      return res.status(409).json({ error: 'Shop code conflict, please try again' });
    }
    console.error('API shop register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shops/lookup?code=XXX
router.get('/lookup', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Shop code is required' });
    }

    const shop = await Shop.findOne({ shopCode: code.trim().toUpperCase() }).lean();
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      shop: { id: shop._id, shopName: shop.shopName, shopCode: shop.shopCode },
    });
  } catch (err) {
    console.error('API shop lookup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
