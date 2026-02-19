const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    shopCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-generate shopCode before validation
shopSchema.pre('validate', function () {
  if (!this.shopCode) {
    const prefix = this.shopName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
    // Use last 3 digits of timestamp + 2 random digits for uniqueness
    const timePart = (Date.now() % 1000).toString().padStart(3, '0');
    const randPart = Math.floor(10 + Math.random() * 90);
    this.shopCode = prefix + timePart + randPart;
  }
});

module.exports = mongoose.model('Shop', shopSchema);
