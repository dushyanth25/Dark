const mongoose = require('mongoose');

const tradeHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cash: { type: Number, default: 1000 },
  assets: { type: Number, default: 0 },
  tradeHistory: [tradeHistorySchema]
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
