const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['greedy', 'fearful', 'rational'],
      required: true,
    },
    cash: {
      type: Number,
      default: 10000,
    },
    assets: {
      type: Number,
      default: 50,
    },
    fearLevel: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },
    greedLevel: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Agent', agentSchema);
