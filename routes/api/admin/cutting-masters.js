const express = require('express');
const router = express.Router();
const CuttingMaster = require('../../../models/CuttingMaster');
const bcryptjs = require('bcryptjs');

// GET /api/admin/cutting-masters
router.get('/', async (req, res) => {
  try {
    const cuttingMasters = await CuttingMaster.find({ shop: req.shopId }).sort({ createdAt: -1 }).lean();
    res.json({
      cuttingMasters: cuttingMasters.map((cm) => ({
        id: cm._id,
        username: cm.username,
        name: cm.name,
        createdAt: cm.createdAt,
      })),
    });
  } catch (err) {
    console.error('API cutting masters list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/cutting-masters
// Body: { username, name, password }
router.post('/', async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ error: 'Username, name, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await CuttingMaster.findOne({ username, shop: req.shopId });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    const cm = new CuttingMaster({ username, name, passwordHash, shop: req.shopId });
    await cm.save();

    res.status(201).json({ cuttingMaster: { id: cm._id, username: cm.username, name: cm.name } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    console.error('API create cutting master error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/cutting-masters/:id
router.delete('/:id', async (req, res) => {
  try {
    const cm = await CuttingMaster.findOneAndDelete({ _id: req.params.id, shop: req.shopId });
    if (!cm) return res.status(404).json({ error: 'Cutting Master not found' });
    res.json({ message: `Cutting Master "${cm.name}" deleted` });
  } catch (err) {
    console.error('API delete cutting master error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
