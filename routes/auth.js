const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { redirectIfLoggedIn } = require('../middleware/auth');

// GET /admin/login - Show login form
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('auth/login', { title: 'Admin Login' });
});

// POST /admin/login - Process login
router.post('/login', redirectIfLoggedIn, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error', 'Username and password are required');
      return res.redirect('/admin/login');
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });

    if (!admin) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/admin/login');
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/admin/login');
    }

    // Create session
    req.session.adminId = admin._id;
    req.session.adminUsername = admin.username;

    req.flash('success', `Welcome back, ${admin.username}!`);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Server error during login');
    res.redirect('/admin/login');
  }
});

// POST /admin/logout - Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

module.exports = router;
