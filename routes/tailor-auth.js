const express = require('express');
const router = express.Router();
const Tailor = require('../models/Tailor');
const { redirectTailorIfLoggedIn } = require('../middleware/auth');

// GET /tailor/login - Show login form
router.get('/login', redirectTailorIfLoggedIn, (req, res) => {
  res.render('tailor/login', { title: 'Tailor Login' });
});

// POST /tailor/login - Process login
router.post('/login', redirectTailorIfLoggedIn, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error', 'Username and password are required');
      return res.redirect('/tailor/login');
    }

    // Find tailor by username
    const tailor = await Tailor.findOne({ username });

    if (!tailor) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/tailor/login');
    }

    // Compare password
    const isPasswordValid = await tailor.comparePassword(password);

    if (!isPasswordValid) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/tailor/login');
    }

    // Create session
    req.session.tailorId = tailor._id;
    req.session.tailorName = tailor.name;

    req.flash('success', `Welcome, ${tailor.name}!`);
    res.redirect('/tailor/dashboard');
  } catch (error) {
    console.error('Tailor login error:', error);
    req.flash('error', 'Server error during login');
    res.redirect('/tailor/login');
  }
});

// POST /tailor/logout - Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/tailor/login');
  });
});

module.exports = router;
