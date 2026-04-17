const mongoose = require('mongoose');

const simulationStateSchema = new mongoose.Schema(
  {
    currentStep: {
      type: Number,
      default: 0,
    },
    priceHistory: {
      type: [Number],
      default: [100],
    },
    isRunning: {
      type: Boolean,
      default: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('SimulationState', simulationStateSchema);
