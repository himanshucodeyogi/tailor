// Debug Orders - Check shop field
// Run: node debug-orders.js

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const Shop = require('./models/Shop');

async function debugOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Count total orders
    const totalOrders = await Order.countDocuments();
    console.log(`Total orders: ${totalOrders}`);

    // Count orders with shop
    const ordersWithShop = await Order.countDocuments({ shop: { $exists: true, $ne: null } });
    console.log(`Orders with shop field: ${ordersWithShop}`);
    console.log(`Orders without shop field: ${totalOrders - ordersWithShop}\n`);

    // Show sample order
    const sampleOrder = await Order.findOne().populate('shop').populate('customer');
    if (sampleOrder) {
      console.log('Sample Order:');
      console.log('  Order Number:', sampleOrder.orderNumber);
      console.log('  Customer:', sampleOrder.customer?.name);
      console.log('  Shop (raw):', sampleOrder.shop);
      console.log('  Has shop?', !!sampleOrder.shop);
      if (sampleOrder.shop) {
        console.log('  Shop Name:', sampleOrder.shop.shopName);
        console.log('  Shop Code:', sampleOrder.shop.shopCode);
      }
    } else {
      console.log('No orders found in database');
    }

    console.log('\n--- All Shops ---');
    const shops = await Shop.find();
    shops.forEach(shop => {
      console.log(`  ${shop.shopName} (${shop.shopCode}) - ID: ${shop._id}`);
    });

    console.log('\n--- All Customers ---');
    const customers = await Customer.find().limit(5);
    customers.forEach(c => {
      console.log(`  ${c.name} (${c.phone}) - Shop: ${c.shop}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

debugOrders();
