const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  type: { type: String, enum: ['bot', 'human', 'greedy', 'fearful', 'rational'], default: 'bot' },
  strategy: { type: String, enum: ['momentum', 'contrarian', 'panic', 'liquidity'], default: 'momentum' },
  cash: { type: Number, default: 1000 },
  assets: { type: Number, default: 10 },
  fearLevel: { type: Number, min: 0, max: 1, default: 0.5 },
  greedLevel: { type: Number, min: 0, max: 1, default: 0.5 },
  riskTolerance: { type: Number, min: 0, max: 1, default: 0.5 },
  belief: {
    bullish: { type: Number, default: 0.33 },
    bearish: { type: Number, default: 0.33 },
    neutral: { type: Number, default: 0.34 }
  },
  memory: { type: [Number], default: [] },
  performanceScore: { type: Number, default: 0 }
});

module.exports = mongoose.model('Agent', agentSchema);
