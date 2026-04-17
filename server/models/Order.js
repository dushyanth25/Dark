const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  type: { type: String, enum: ['buy', 'sell', 'hold'] },
  quantity: { type: Number },
  price: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
