const mongoose = require('mongoose');

const measurementItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['pant', 'shirt', 'coat', 'jacket', 'kurta', 'salwar', 'sherwani', 'lehenga', 'saree', 'other'],
      required: true,
    },
    // Common
    length: { type: Number, default: null },
    shoulder: { type: Number, default: null },
    chest: { type: Number, default: null },
    waist: { type: Number, default: null },
    hip: { type: Number, default: null },
    neck: { type: Number, default: null },
    // Pant / Salwar
    thigh: { type: Number, default: null },
    knee: { type: Number, default: null },
    bottom: { type: Number, default: null },
    crotch: { type: Number, default: null },
    // Shirt / Kurta / Coat / Sherwani
    sleeveLength: { type: Number, default: null },
    bicep: { type: Number, default: null },
    collar: { type: Number, default: null },
    cuff: { type: Number, default: null },
    // Coat / Sherwani
    armhole: { type: Number, default: null },
    crossBack: { type: Number, default: null },
    // Jacket
    sleeve: { type: Number, default: null },
    // Kurta
    slits: { type: Number, default: null },
    // Lehenga
    skirtLength: { type: Number, default: null },
    skirtWaist: { type: Number, default: null },
    skirtHip: { type: Number, default: null },
    // Lehenga / Saree (Blouse)
    blouseLength: { type: Number, default: null },
    blouseChest: { type: Number, default: null },
    blouseUnderbust: { type: Number, default: null },
    blouseShoulder: { type: Number, default: null },
    blouseSleeve: { type: Number, default: null },
    // Saree (Petticoat)
    petticoatLength: { type: Number, default: null },
    petticoatWaist: { type: Number, default: null },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false, timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{10,15}$/, 'Please enter a valid phone number'],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    measurements: [measurementItemSchema],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound indexes for multi-tenancy
customerSchema.index({ phone: 1, shop: 1 }, { unique: true });
customerSchema.index({ shop: 1 });

module.exports = mongoose.model('Customer', customerSchema);
