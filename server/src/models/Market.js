const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema(
  {
    currentPrice: {
      type: Number,
      required: true,
    },
    state: {
      type: String,
      enum: ['bull', 'stable', 'panic'],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Market', marketSchema);
