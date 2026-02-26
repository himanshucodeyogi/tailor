// Fix Orders Shop Reference
// Run: node fix-orders-shop.js

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Customer = require('./models/Customer');

async function fixOrdersShop() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all orders without shop field
    const ordersWithoutShop = await Order.find({
      $or: [{ shop: null }, { shop: { $exists: false } }]
    });

    console.log(`Found ${ordersWithoutShop.length} orders without shop reference`);

    for (const order of ordersWithoutShop) {
      // Get customer's shop
      const customer = await Customer.findById(order.customer);
      if (customer && customer.shop) {
        order.shop = customer.shop;
        await order.save();
        console.log(`Fixed order ${order.orderNumber} - added shop ${customer.shop}`);
      } else {
        console.log(`Cannot fix order ${order.orderNumber} - customer has no shop`);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixOrdersShop();
