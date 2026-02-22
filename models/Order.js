const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'Order Placed',
  'Cutting',
  'In Stitching',
  'Final Touches',
  'Ready for Pickup',
];

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    garmentType: {
      type: String,
      enum: ['Suit', 'Shirt', 'Kurta', 'Other'],
      required: [true, 'Garment type is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Order Placed',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    advancePaid: {
      type: Number,
      default: 0,
      min: [0, 'Advance paid cannot be negative'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    readyPhotoUrl: {
      type: String,
      default: null,
    },
    pendingReadyPhoto: {
      type: String,
      default: null,
    },
    pendingApproval: {
      type: Boolean,
      default: false,
    },
    assignedTailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tailor',
      default: null,
    },
    assignedCuttingMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CuttingMaster',
      default: null,
    },
    cuttingStatus: {
      type: String,
      enum: ['Pending', 'Done'],
      default: 'Pending',
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Generates the next order number for a shop.
 * Sequence: 1A, 2A, ... 1000A, 1B, 2B, ... 1000B, ... 1Z, ... 1000Z, then restart 1A.
 */
orderSchema.statics.generateNextOrderNumber = async function (shopId) {
  // Find the latest order for this shop that has valid format (numberLetter)
  const lastOrder = await this.findOne(
    { shop: shopId, orderNumber: { $regex: /^\d+[A-Z]$/ } }
  )
    .sort({ createdAt: -1 })
    .select('orderNumber')
    .lean();

  if (!lastOrder || !lastOrder.orderNumber) return '1A';

  const match = lastOrder.orderNumber.match(/^(\d+)([A-Z])$/);
  if (!match) return '1A';

  const number = parseInt(match[1], 10);
  const letter = match[2];

  if (number < 1000) {
    return `${number + 1}${letter}`;
  }

  // number === 1000, move to next letter
  if (letter === 'Z') {
    return '1A'; // restart cycle
  }

  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
  return `1${nextLetter}`;
};

// Virtual: balance due
orderSchema.virtual('balanceDue').get(function () {
  return this.price - this.advancePaid;
});

// Virtual: current status index (for stepper UI)
orderSchema.virtual('statusIndex').get(function () {
  return ORDER_STATUSES.indexOf(this.status);
});

// Static method to get all statuses
orderSchema.statics.STATUSES = ORDER_STATUSES;

// Static method to get status colors
orderSchema.statics.STATUS_COLORS = {
  'Order Placed': 'gray',
  'Cutting': 'yellow',
  'In Stitching': 'blue',
  'Final Touches': 'orange',
  'Ready for Pickup': 'green',
};

// Indexes for better query performance
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ orderNumber: 1, shop: 1 }, { unique: true, sparse: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ shop: 1 });
orderSchema.index({ assignedTailor: 1, shop: 1 });

module.exports = mongoose.model('Order', orderSchema);
