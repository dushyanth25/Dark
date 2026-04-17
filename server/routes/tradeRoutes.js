const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Portfolio = require('../models/Portfolio');
const Market = require('../models/Market');

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// POST /api/trade
router.post('/trade', authenticateToken, async (req, res) => {
  const { type, quantity } = req.body;

  if (!type || !['buy', 'sell'].includes(type) || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid trade parameters.' });
  }

  try {
    const userId = req.user.userId || req.user.id; // handle different token payload structures

    // Load or create Portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId });
    }

    // Get latest market price
    const market = await Market.findOne();
    if (!market) {
      return res.status(500).json({ message: 'Market data is unavailable.' });
    }

    const currentPrice = market.currentPrice;

    if (type === 'buy') {
      const totalCost = currentPrice * quantity;
      if (portfolio.cash < totalCost) {
        return res.status(400).json({ message: 'Insufficient cash.' });
      }
      portfolio.cash -= totalCost;
      portfolio.assets += quantity;
    } else if (type === 'sell') {
      if (portfolio.assets < quantity) {
        return res.status(400).json({ message: 'Insufficient assets.' });
      }
      portfolio.assets -= quantity;
      portfolio.cash += (currentPrice * quantity);
    }

    // Save trade using parsed type and quantity
    portfolio.tradeHistory.push({
      type,
      quantity,
      price: currentPrice
    });

    await portfolio.save();

    res.json({ message: 'Trade executed successfully', portfolio });
  } catch (err) {
    console.error('Trade error:', err);
    res.status(500).json({ message: 'Server error during trade processing.' });
  }
});

module.exports = router;
