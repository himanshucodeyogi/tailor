const express = require('express');
const router = express.Router();
const CuttingMaster = require('../models/CuttingMaster');
const bcryptjs = require('bcryptjs');

// GET /admin/cutting-masters - List all cutting masters
router.get('/', async (req, res) => {
  try {
    const cmFilter = req.session.shopId ? { shop: req.session.shopId } : {};
    const cuttingMasters = await CuttingMaster.find(cmFilter).sort({ createdAt: -1 });

    res.render('admin/cutting-masters/index', {
      title: 'Manage Cutting Masters',
      cuttingMasters,
    });
  } catch (error) {
    console.error('List cutting masters error:', error);
    req.flash('error', 'Error loading cutting masters');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/cutting-masters/new - Show create cutting master form
router.get('/new', (req, res) => {
  res.render('admin/cutting-masters/new', { title: 'Create Cutting Master' });
});

// POST /admin/cutting-masters - Create a new cutting master
router.post('/', async (req, res) => {
  try {
    const { username, name, password, confirmPassword } = req.body;

    // Validation
    if (!username || !name || !password || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/admin/cutting-masters/new');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/admin/cutting-masters/new');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/admin/cutting-masters/new');
    }

    // Check if username already exists in this shop
    const existFilter = { username };
    if (req.session.shopId) existFilter.shop = req.session.shopId;
    const existing = await CuttingMaster.findOne(existFilter);
    if (existing) {
      req.flash('error', 'Username already exists');
      return res.redirect('/admin/cutting-masters/new');
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create new cutting master
    const cm = new CuttingMaster({
      username,
      name,
      passwordHash,
      shop: req.session.shopId,
    });

    await cm.save();

    req.flash('success', `Cutting Master "${name}" created successfully with username "${username}"`);
    res.redirect('/admin/cutting-masters');
  } catch (error) {
    console.error('Create cutting master error:', error);

    if (error.code === 11000) {
      req.flash('error', 'Username already exists');
      return res.redirect('/admin/cutting-masters/new');
    }

    req.flash('error', 'Error creating cutting master');
    res.redirect('/admin/cutting-masters/new');
  }
});

// DELETE /admin/cutting-masters/:id - Delete a cutting master
router.delete('/:id', async (req, res) => {
  try {
    const delFilter = { _id: req.params.id };
    if (req.session.shopId) delFilter.shop = req.session.shopId;
    const cm = await CuttingMaster.findOneAndDelete(delFilter);

    if (!cm) {
      req.flash('error', 'Cutting Master not found');
      return res.redirect('/admin/cutting-masters');
    }

    req.flash('success', `Cutting Master "${cm.name}" deleted successfully`);
    res.redirect('/admin/cutting-masters');
  } catch (error) {
    console.error('Delete cutting master error:', error);
    req.flash('error', 'Error deleting cutting master');
    res.redirect('/admin/cutting-masters');
  }
});

module.exports = router;
