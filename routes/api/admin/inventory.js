const express = require('express');
const router = express.Router();
const Inventory = require('../../../models/Inventory');

function formatItem(i) {
  return {
    id: i._id,
    itemName: i.itemName,
    quantity: i.quantity,
    unit: i.unit,
    lowStockThreshold: i.lowStockThreshold,
    isLowStock: i.quantity <= i.lowStockThreshold,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

// GET /api/admin/inventory
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find({ shop: req.shopId }).sort({ itemName: 1 }).lean();
    res.json({ items: items.map(formatItem) });
  } catch (err) {
    console.error('API inventory list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/inventory/:id/increment
// Body: { amount } -- defaults to 1
router.post('/:id/increment', async (req, res) => {
  try {
    const incrementBy = req.body.amount ? parseInt(req.body.amount) : 1;
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId },
      { $inc: { quantity: incrementBy } },
      { new: true }
    ).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: formatItem(item) });
  } catch (err) {
    console.error('API inventory increment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/inventory/:id/decrement
// Body: { amount } -- defaults to 1, floors at 0
router.post('/:id/decrement', async (req, res) => {
  try {
    const decrementBy = req.body.amount ? parseInt(req.body.amount) : 1;
    const item = await Inventory.findOne({ _id: req.params.id, shop: req.shopId });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.quantity = Math.max(0, item.quantity - decrementBy);
    await item.save();
    res.json({ item: formatItem(item.toObject()) });
  } catch (err) {
    console.error('API inventory decrement error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
