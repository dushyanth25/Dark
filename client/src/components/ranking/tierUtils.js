// Tier progression thresholds (based on score)
const TIER_THRESHOLDS = {
  'Bronze': 0,
  'Silver': 50,
  'Gold': 150,
  'Platinum': 300,
  'Elite Trader': 600,
};

const TIER_LEVELS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Elite Trader'];

/**
 * Calculate tier progress based on user score
 * @param {number} score - User's current score
 * @returns {object} - { currentTier, nextTier, progressPercentage, score }
 */
export const getTierProgress = (score = 0) => {
  let currentTier = 'Bronze';
  let nextTier = 'Silver';
  let progressPercentage = 0;

  // Find current tier
  for (let i = TIER_LEVELS.length - 1; i >= 0; i--) {
    if (score >= TIER_THRESHOLDS[TIER_LEVELS[i]]) {
      currentTier = TIER_LEVELS[i];
      nextTier = i < TIER_LEVELS.length - 1 ? TIER_LEVELS[i + 1] : TIER_LEVELS[i];
      break;
    }
  }

  // Calculate progress to next tier
  const currentTierIndex = TIER_LEVELS.indexOf(currentTier);
  if (currentTierIndex < TIER_LEVELS.length - 1) {
    const currentThreshold = TIER_THRESHOLDS[currentTier];
    const nextThreshold = TIER_THRESHOLDS[nextTier];
    const rangeSize = nextThreshold - currentThreshold;
    const currentProgress = Math.max(0, score - currentThreshold);
    progressPercentage = (currentProgress / rangeSize) * 100;
  } else {
    // Max tier
    progressPercentage = 100;
  }

  return {
    currentTier,
    nextTier,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    score,
  };
};

/**
 * Get tier color based on tier name
 * @param {string} tier - Tier name
 * @returns {string} - Tailwind color classes
 */
export const getTierColor = (tier) => {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return 'text-orange-600 bg-orange-600/10 border-orange-600/50';
    case 'silver':
      return 'text-gray-300 bg-gray-300/10 border-gray-300/50';
    case 'gold':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/50';
    case 'platinum':
      return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/50 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]';
    case 'elite trader':
      return 'text-purple-400 bg-purple-500/20 border-purple-500/80 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]';
    default:
      return 'text-batman-muted bg-gray-900 border-gray-700';
  }
};
