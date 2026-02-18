require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const Admin = require('./models/Admin');
const Inventory = require('./models/Inventory');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Delete existing admin documents
    await Admin.deleteMany({});
    console.log('✓ Cleared existing admins');

    // Create new admin
    const hashedPassword = await bcryptjs.hash(process.env.ADMIN_PASSWORD, 12);
    const admin = await Admin.create({
      username: process.env.ADMIN_USERNAME,
      passwordHash: hashedPassword,
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
        { itemName: item.itemName },
        {
          $setOnInsert: {
            unit: item.unit,
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`✓ Inventory item: ${item.itemName}`);
    }

    console.log('\n✓ Database seeded successfully!');
    console.log(`\nYou can now login with:`);
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
