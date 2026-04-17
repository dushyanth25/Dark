const adviceCache = new Map();

function generateCoachingAdvice(playerData, marketData) {
  const safePlayerData = playerData || {};
  const userId = safePlayerData.userId || "anonymous";
  const score = Number(safePlayerData.score) || 0;
  const riskEfficiency = Number(safePlayerData.riskEfficiency) || 0;
  const timingScore = Number(safePlayerData.timingScore) || 0;
  const tier = safePlayerData.tier || "Bronze";
  const rank = safePlayerData.rank || 999;

  let adviceType = "strategy";
  let message = "";
  let confidence = 0.5;

  if (tier === "Elite Trader") {
    adviceType = "strategy";
    message = "Elite tier protocols active. Maintain equilibrium adjustments.";
    confidence = 0.9;
  } else if (riskEfficiency < 0.5 && score > 0) {
    adviceType = "risk";
    message = "Risk efficiency suboptimal. Reassess stop-loss limits.";
    confidence = Math.max(0, Math.min(1, 1 - riskEfficiency));
  } else if (timingScore < 0) {
    adviceType = "timing";
    message = "Directional timing is negative. Wait for stable market entry points.";
    confidence = 0.8;
  } else if (score < 50 || rank > 10) {
    adviceType = "strategy";
    message = "Strategic baseline low. Consider momentum synchronization.";
    confidence = 0.7;
  } else {
    adviceType = "strategy";
    message = "Current market exposure validated.";
    confidence = 0.6;
  }

  const lastAdvice = adviceCache.get(userId);
  if (lastAdvice === message) {
    return { adviceType: "neutral", message: "", confidence: 0 };
  }

  adviceCache.set(userId, message);

  return {
    adviceType,
    message,
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2))
  };
}

module.exports = { generateCoachingAdvice };
