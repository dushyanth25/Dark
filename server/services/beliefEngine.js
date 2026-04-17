function updateBelief(agent, marketData) {
  const alpha = 0.1;
  const rt = agent.riskTolerance || 0.5;
  let { bullish, bearish, neutral } = agent.belief;

  if (marketData.priceChange > 0) {
    bullish += alpha * rt;
    bearish -= alpha * rt;
  } else if (marketData.priceChange < 0) {
    bearish += alpha * rt;
    bullish -= alpha * rt;
  }

  // Ensure non-negative beliefs
  bullish = Math.max(0, bullish);
  bearish = Math.max(0, bearish);
  neutral = Math.max(0.01, neutral); // prevent complete zero division

  // Normalize
  const total = bullish + bearish + neutral;
  return {
    bullish: bullish / total,
    bearish: bearish / total,
    neutral: neutral / total
  };
}

module.exports = { updateBelief };
