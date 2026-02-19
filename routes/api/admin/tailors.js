const express = require('express');
const router = express.Router();
const Tailor = require('../../../models/Tailor');
const bcryptjs = require('bcryptjs');

// GET /api/admin/tailors
router.get('/', async (req, res) => {
  try {
    const tailors = await Tailor.find({ shop: req.shopId }).sort({ createdAt: -1 }).lean();
    res.json({
      tailors: tailors.map((t) => ({
        id: t._id,
        username: t.username,
        name: t.name,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error('API tailors list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/tailors
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

    const existing = await Tailor.findOne({ username, shop: req.shopId });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    const tailor = new Tailor({ username, name, passwordHash, shop: req.shopId });
    await tailor.save();

    res.status(201).json({ tailor: { id: tailor._id, username: tailor.username, name: tailor.name } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    console.error('API create tailor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/tailors/:id
router.delete('/:id', async (req, res) => {
  try {
    const tailor = await Tailor.findOneAndDelete({ _id: req.params.id, shop: req.shopId });
    if (!tailor) return res.status(404).json({ error: 'Tailor not found' });
    res.json({ message: `Tailor "${tailor.name}" deleted` });
  } catch (err) {
    console.error('API delete tailor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
