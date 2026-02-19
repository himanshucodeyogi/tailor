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
      unique: true,
      sparse: true,
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
    assignedTailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tailor',
      default: null,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  { timestamps: true }
);

// Note: orderNumber is generated in the route handler before saving

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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ shop: 1 });
orderSchema.index({ assignedTailor: 1, shop: 1 });

module.exports = mongoose.model('Order', orderSchema);
