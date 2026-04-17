const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  currentPrice: { type: Number, required: true },
  state: { type: String, enum: ['bull', 'stable', 'panic'] },
  sentimentScore: { type: Number, default: 50 },
  riskLevel: { type: String, default: 'Low' },
  explanation: { type: String, default: 'Systems nominal.' },
  phase: { type: String, default: 'stable' },
  volatility: { type: Number, default: 0 },
  sentimentIndex: { type: Number, default: 0 },
  orderBook: {
    buyVolume: { type: Number, default: 0 },
    sellVolume: { type: Number, default: 0 }
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Market', marketSchema);
