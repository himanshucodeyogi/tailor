const express = require('express');
const router = express.Router();
const Tailor = require('../models/Tailor');
const bcryptjs = require('bcryptjs');

// GET /admin/tailors - List all tailors
router.get('/', async (req, res) => {
  try {
    const tailors = await Tailor.find().sort({ createdAt: -1 });

    res.render('admin/tailors/index', {
      title: 'Manage Tailors',
      tailors,
    });
  } catch (error) {
    console.error('List tailors error:', error);
    req.flash('error', 'Error loading tailors');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/tailors/new - Show create tailor form
router.get('/new', (req, res) => {
  res.render('admin/tailors/new', { title: 'Create Tailor' });
});

// POST /admin/tailors - Create a new tailor
router.post('/', async (req, res) => {
  try {
    const { username, name, password, confirmPassword } = req.body;

    // Validation
    if (!username || !name || !password || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/admin/tailors/new');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/admin/tailors/new');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/admin/tailors/new');
    }

    // Check if username already exists
    const existingTailor = await Tailor.findOne({ username });
    if (existingTailor) {
      req.flash('error', 'Username already exists');
      return res.redirect('/admin/tailors/new');
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new tailor
    const tailor = new Tailor({
      username,
      name,
      passwordHash: hashedPassword,
    });

    await tailor.save();

    req.flash('success', `Tailor "${name}" created successfully with username "${username}"`);
    res.redirect('/admin/tailors');
  } catch (error) {
    console.error('Create tailor error:', error);

    if (error.code === 11000) {
      req.flash('error', 'Username already exists');
      return res.redirect('/admin/tailors/new');
    }

    req.flash('error', 'Error creating tailor');
    res.redirect('/admin/tailors/new');
  }
});

// DELETE /admin/tailors/:id - Delete a tailor
router.delete('/:id', async (req, res) => {
  try {
    const tailor = await Tailor.findByIdAndDelete(req.params.id);

    if (!tailor) {
      req.flash('error', 'Tailor not found');
      return res.redirect('/admin/tailors');
    }

    req.flash('success', `Tailor "${tailor.name}" deleted successfully`);
    res.redirect('/admin/tailors');
  } catch (error) {
    console.error('Delete tailor error:', error);
    req.flash('error', 'Error deleting tailor');
    res.redirect('/admin/tailors');
  }
});

module.exports = router;
