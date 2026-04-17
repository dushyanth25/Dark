const express = require('express');
const router = express.Router();
const Market = require('../models/Market');
const SimulationState = require('../models/SimulationState');
const Order = require('../models/Order');
const { getLeaderboard } = require('../services/rankingEngine');
const { generateCoachingAdvice } = require('../services/coachingEngine');
const { generateInsights } = require('../services/insightEngine');
const { triggerVoice } = require('../services/voiceEngine');

// GET /api/market
router.get('/market', async (req, res) => {
  try {
    const market = await Market.findOne();
    const state = await SimulationState.findOne();
    
    if (!market || !state) {
      return res.status(404).json({ message: 'Market data not found' });
    }

    // Get last 50 price points for the graph
    const priceHistory = state.priceHistory && state.priceHistory.length > 0 
      ? state.priceHistory.slice(-50) 
      : [market.currentPrice];
    
    const leaderboard = getLeaderboard();
    
    // Get current user stats (from auth or query param)
    const userEmail = req.user?.email || req.query.userId || 'anonymous';
    const myStats = leaderboard.find(p => p.userId === userEmail) || {};
    
    // Generate insights for market
    const insights = generateInsights(market, myStats);
    const coachingAdvice = generateCoachingAdvice(myStats, market);
    const voiceInsight = triggerVoice(insights, myStats);

    res.json({
      currentPrice: market.currentPrice,
      state: market.state,
      priceHistory: priceHistory,
      priceChange: market.priceChange || 0,
      volatility: market.volatility || 0.05,
      riskLevel: market.riskLevel || 'LOW',
      equilibriumState: market.equilibriumState || 'stable',
      portfolio: {
        cash: req.user?.portfolio?.cash || 1000,
        assets: req.user?.portfolio?.assets || 0
      },
      leaderboard: leaderboard,
      systemInsight: insights?.systemInsight || { message: 'Market analysis in progress', eventType: 'neutral', priority: 1 },
      playerInsight: insights?.playerInsight,
      coachingAdvice: coachingAdvice,
      voiceInsight: voiceInsight,
      explanation: market.explanation || 'Market analysis in progress...'
    });
  } catch (err) {
    console.error('Error fetching market:', err);
    res.status(500).json({ 
      message: 'Server error',
      currentPrice: 1,
      priceHistory: [1],
      leaderboard: [],
      systemInsight: { message: 'Error fetching data', eventType: 'neutral', priority: 1 }
    });
  }
});

// GET /api/history
router.get('/history', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('agentId', 'type');
      
    res.json(orders);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
