function detectPhase(marketData) {
  const { priceChanges, volatility, buyVolume, sellVolume } = marketData;
  const totalVolume = buyVolume + sellVolume;

  let recentTrend = 0;
  if (priceChanges && priceChanges.length > 0) {
    // Determine trend (positive or negative overall sum over recent memory)
    recentTrend = priceChanges.reduce((a, b) => a + b, 0);
  }
  
  if (recentTrend > 1 && volatility < 0.2) {
    return 'expansion';
  }
  
  if (recentTrend > 2 && volatility >= 0.2) {
    return 'bubble';
  }
  
  if (sellVolume > buyVolume * 1.5 && volatility >= 0.2) {
    return 'panic';
  }
  
  if (recentTrend < -1.5) {
    return 'collapse';
  }
  
  return 'stable';
}

module.exports = { detectPhase };
