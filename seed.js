require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const Admin = require('./models/Admin');
const Inventory = require('./models/Inventory');
const Shop = require('./models/Shop');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Delete existing admin documents
    await Admin.deleteMany({});
    console.log('✓ Cleared existing admins');

    // Create default shop (or find existing)
    let shop = await Shop.findOne({ shopCode: 'DEFAULT' });
    if (!shop) {
      shop = await Shop.create({
        shopName: 'Default Shop',
        shopCode: 'DEFAULT',
        phone: '',
        address: '',
      });
      console.log(`✓ Default shop created: ${shop.shopName} (code: ${shop.shopCode})`);
    } else {
      console.log(`✓ Default shop exists: ${shop.shopName} (code: ${shop.shopCode})`);
    }

    // Create new admin associated with default shop
    const hashedPassword = await bcryptjs.hash(process.env.ADMIN_PASSWORD, 12);
    const admin = await Admin.create({
      username: process.env.ADMIN_USERNAME,
      passwordHash: hashedPassword,
      shop: shop._id,
    });
    console.log(`✓ Admin created: ${admin.username}`);

    // Seed inventory items (upsert to preserve existing quantities)
    const inventoryItems = [
      {
        itemName: 'Buttons',
        unit: 'pieces',
        quantity: 100,
        lowStockThreshold: 20,
      },
      {
        itemName: 'Thread Boxes',
        unit: 'boxes',
        quantity: 10,
        lowStockThreshold: 3,
      },
      {
        itemName: 'Lining/Asttar',
        unit: 'meters',
        quantity: 50,
        lowStockThreshold: 10,
      },
    ];

    for (const item of inventoryItems) {
      await Inventory.findOneAndUpdate(
        { itemName: item.itemName, shop: shop._id },
        {
          $setOnInsert: {
            unit: item.unit,
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
            shop: shop._id,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`✓ Inventory item: ${item.itemName}`);
    }

    console.log('\n✓ Database seeded successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`  Shop Code: ${shop.shopCode}`);
    console.log(`  Username: ${process.env.ADMIN_USERNAME}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
