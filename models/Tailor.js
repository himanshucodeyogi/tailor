const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const tailorSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for multi-tenancy
tailorSchema.index({ username: 1, shop: 1 }, { unique: true });

// Instance method to compare password
tailorSchema.methods.comparePassword = async function (plainText) {
  return await bcryptjs.compare(plainText, this.passwordHash);
};

module.exports = mongoose.model('Tailor', tailorSchema);
