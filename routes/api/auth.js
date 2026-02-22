const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const Tailor = require('../../models/Tailor');
const CuttingMaster = require('../../models/CuttingMaster');
const { JWT_SECRET } = require('../../middleware/jwt-auth');

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// POST /api/auth/admin/login
// Body: { username, password }
// Response 200: { token, admin: { id, username } }
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password, shopId } = req.body;

    if (!username || !password || !shopId) {
      return res.status(400).json({ error: 'Username, password, and shopId are required' });
    }

    const admin = await Admin.findOne({ username, shop: shopId });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await admin.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin', shopId: admin.shop },
      JWT_SECRET,
      { expiresIn: EXPIRES_IN }
    );

    res.json({
      token,
      admin: { id: admin._id, username: admin.username },
    });
  } catch (err) {
    console.error('API admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/tailor/login
// Body: { username, password }
// Response 200: { token, tailor: { id, username, name } }
router.post('/tailor/login', async (req, res) => {
  try {
    const { username, password, shopId } = req.body;

    if (!username || !password || !shopId) {
      return res.status(400).json({ error: 'Username, password, and shopId are required' });
    }

    const tailor = await Tailor.findOne({ username, shop: shopId });
    if (!tailor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await tailor.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: tailor._id, username: tailor.username, name: tailor.name, role: 'tailor', shopId: tailor.shop },
      JWT_SECRET,
      { expiresIn: EXPIRES_IN }
    );

    res.json({
      token,
      tailor: { id: tailor._id, username: tailor.username, name: tailor.name },
    });
  } catch (err) {
    console.error('API tailor login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/cuttingmaster/login
// Body: { username, password, shopId }
// Response 200: { token, cuttingMaster: { id, username, name } }
router.post('/cuttingmaster/login', async (req, res) => {
  try {
    const { username, password, shopId } = req.body;

    if (!username || !password || !shopId) {
      return res.status(400).json({ error: 'Username, password, and shopId are required' });
    }

    const cm = await CuttingMaster.findOne({ username, shop: shopId });
    if (!cm) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await cm.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: cm._id, username: cm.username, name: cm.name, role: 'cuttingMaster', shopId: cm.shop },
      JWT_SECRET,
      { expiresIn: EXPIRES_IN }
    );

    res.json({
      token,
      cuttingMaster: { id: cm._id, username: cm.username, name: cm.name },
    });
  } catch (err) {
    console.error('API cutting master login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
