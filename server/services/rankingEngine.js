const { assignTier } = require('./tierEngine');

const playerStats = new Map();

function updatePlayerRanking(userId, tradeData, marketData) {
  if (!playerStats.has(userId)) {
    playerStats.set(userId, {
      profit: 0,
      riskEfficiency: 0,
      timingScore: 0,
      consistency: 0,
      score: 0,
      returns: [],
      pastRanks: [],
      tier: "Bronze",
      tierChanged: false
    });
  }

  const stats = playerStats.get(userId);
  const oldTier = stats.tier;
  
  // 1. Profit: (current portfolio value - initial capital)
  const initialCapital = 1000;
  const portfolioValue = tradeData.cash + (tradeData.assets * marketData.currentPrice);
  stats.profit = portfolioValue - initialCapital;

  stats.returns.push(stats.profit);
  if (stats.returns.length > 20) stats.returns.shift();

  // 2. Risk Efficiency: profit / volatility (avoid division by zero)
  const vol = Math.max(0.001, marketData.volatility || 0.1); 
  stats.riskEfficiency = stats.profit / vol;

  // 3. Timing Score: +1 right directional trade, -1 wrong directional trade
  if (tradeData.lastAction) {
    if (tradeData.lastAction === 'buy' && marketData.priceChange > 0) stats.timingScore += 1;
    if (tradeData.lastAction === 'sell' && marketData.priceChange < 0) stats.timingScore += 1;
    if (tradeData.lastAction === 'buy' && marketData.priceChange < 0) stats.timingScore -= 1;
    if (tradeData.lastAction === 'sell' && marketData.priceChange > 0) stats.timingScore -= 1;
  }

  // 4. Consistency: based on variance of returns (lower variance = higher score)
  let variance = 0;
  if (stats.returns.length > 1) {
    const mean = stats.returns.reduce((a, b) => a + b, 0) / stats.returns.length;
    variance = stats.returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / stats.returns.length;
  }
  stats.consistency = 1000 / (1 + variance);

  // Normalization: Clamp to safe ranges to avoid any metric dominating
  const normProfit = Math.min(Math.max(stats.profit, -1000), 1000);
  const normRisk = Math.min(Math.max(stats.riskEfficiency, -100), 100);
  const normTiming = Math.min(Math.max(stats.timingScore, -50), 50);
  const normConsis = Math.min(Math.max(stats.consistency, 0), 1000);

  // Apply weights
  const w1 = 0.25, w2 = 0.25, w3 = 0.25, w4 = 0.25;

  stats.score = 
    (w1 * normProfit) + 
    (w2 * normRisk) + 
    (w3 * normTiming) + 
    (w4 * normConsis);
    
  // Tier Assignment Logic
  stats.tier = assignTier(stats.score);
  stats.tierChanged = (oldTier !== stats.tier);
}

function getLeaderboard() {
  const sorted = Array.from(playerStats.entries())
    .map(([userId, stats]) => ({
      userId,
      score: stats.score,
      profit: stats.profit,
      riskEfficiency: stats.riskEfficiency,
      timingScore: stats.timingScore,
      tier: stats.tier,
      tierChanged: stats.tierChanged
    }))
    .sort((a, b) => b.score - a.score);

  // Assign ranks
  const ranked = sorted.map((p, index) => {
    const rank = index + 1;
    const stats = playerStats.get(p.userId);
    stats.pastRanks.push(rank);
    // keep recent rank history
    if (stats.pastRanks.length > 5) stats.pastRanks.shift();
    return { ...p, rank };
  });

  return ranked;
}

function getPlayerTrend(userId) {
  const stats = playerStats.get(userId);
  if (!stats || stats.pastRanks.length < 2) return 0;
  // Positive means rank decreased numerically (e.g. 5 to 2), which is an improvement in performance
  return stats.pastRanks[stats.pastRanks.length - 2] - stats.pastRanks[stats.pastRanks.length - 1];
}

module.exports = { updatePlayerRanking, getLeaderboard, getPlayerTrend };
