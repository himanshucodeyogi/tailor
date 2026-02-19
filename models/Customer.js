const mongoose = require('mongoose');

const measurementItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['pant', 'shirt', 'coat', 'jacket', 'kurta', 'salwar', 'sherwani', 'lehenga', 'saree', 'other'],
      required: true,
    },
    length: { type: Number, default: null },
    chest: { type: Number, default: null },
    shoulder: { type: Number, default: null },
    waist: { type: Number, default: null },
    arm: { type: Number, default: null },
    neck: { type: Number, default: null },
    hip: { type: Number, default: null },
    thigh: { type: Number, default: null },
    inseam: { type: Number, default: null },
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
