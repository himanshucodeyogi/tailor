const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET /admin/inventory - Show inventory list
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find().sort({ itemName: 1 });

    res.render('inventory/index', {
      title: 'Inventory',
      items,
    });
  } catch (error) {
    console.error('Inventory list error:', error);
    req.flash('error', 'Failed to load inventory');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/inventory/:id/increment - Increment item quantity
router.post('/:id/increment', async (req, res) => {
  try {
    const { amount } = req.body;
    const incrementBy = amount ? parseInt(amount) : 1;

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: incrementBy } },
      { new: true }
    );

    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/admin/inventory');
    }

    req.flash('success', `${item.itemName} quantity increased by ${incrementBy}`);
    res.redirect('/admin/inventory');
  } catch (error) {
    console.error('Increment error:', error);
    req.flash('error', 'Failed to update inventory');
    res.redirect('/admin/inventory');
  }
});

// POST /admin/inventory/:id/decrement - Decrement item quantity
router.post('/:id/decrement', async (req, res) => {
  try {
    const { amount } = req.body;
    const decrementBy = amount ? parseInt(amount) : 1;

    // Update with floor at 0
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/admin/inventory');
    }

    item.quantity = Math.max(0, item.quantity - decrementBy);
    await item.save();

    req.flash('success', `${item.itemName} quantity decreased by ${decrementBy}`);
    res.redirect('/admin/inventory');
  } catch (error) {
    console.error('Decrement error:', error);
    req.flash('error', 'Failed to update inventory');
    res.redirect('/admin/inventory');
  }
});

module.exports = router;
