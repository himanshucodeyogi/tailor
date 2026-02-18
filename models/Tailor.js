const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const tailorSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true }
);

// Instance method to compare password
tailorSchema.methods.comparePassword = async function (plainText) {
  return await bcryptjs.compare(plainText, this.passwordHash);
};

module.exports = mongoose.model('Tailor', tailorSchema);
