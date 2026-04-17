function assignTier(score) {
  const safeScore = Math.max(0, Number(score) || 0);
  if (safeScore < 20) return "Bronze";
  if (safeScore < 50) return "Silver";
  if (safeScore < 100) return "Gold";
  if (safeScore < 200) return "Platinum";
  return "Elite Trader";
}

function getTierProgress(score) {
  const safeScore = Math.max(0, Number(score) || 0);
  let currentTier = "Bronze";
  let nextTier = "Silver";
  let minScore = 0;
  let maxScore = 20;

  if (safeScore >= 200) {
    return {
      currentTier: "Elite Trader",
      nextTier: null,
      progressPercentage: 100
    };
  } else if (safeScore >= 100) {
    currentTier = "Platinum";
    nextTier = "Elite Trader";
    minScore = 100;
    maxScore = 200;
  } else if (safeScore >= 50) {
    currentTier = "Gold";
    nextTier = "Platinum";
    minScore = 50;
    maxScore = 100;
  } else if (safeScore >= 20) {
    currentTier = "Silver";
    nextTier = "Gold";
    minScore = 20;
    maxScore = 50;
  }

  const range = maxScore - minScore;
  const progress = safeScore - minScore;
  const progressPercentage = range > 0 ? (progress / range) * 100 : 0;

  return {
    currentTier,
    nextTier,
    progressPercentage: Math.max(0, Math.min(100, progressPercentage))
  };
}

module.exports = { assignTier, getTierProgress };
