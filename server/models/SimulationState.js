const mongoose = require('mongoose');

const simulationStateSchema = new mongoose.Schema({
  currentStep: { type: Number },
  priceHistory: { type: [Number] },
  isRunning: { type: Boolean },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SimulationState', simulationStateSchema);
