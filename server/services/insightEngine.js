const { getLeaderboard, getPlayerTrend } = require('./rankingEngine');
const { generateCoachingAdvice } = require('./coachingEngine');

function generateInsights(marketData, playerData) {
  const { equilibriumState, phase } = marketData || {};
  const { userId, rank } = playerData || {};

  let eventType = "neutral";
  let message = "";
  let priority = 1;

  // EVENT RULES
  if (phase === 'panic') {
    eventType = "warning";
    message = "Market panic detected. High supply volume overriding baseline.";
    priority = 5;
  } else if (phase === 'bubble') {
    eventType = "caution";
    message = "Bubble formation in progress. Unsustainable growth metrics observed.";
    priority = 4;
  } else if (equilibriumState === 'shift') {
    eventType = "opportunity";
    message = "Equilibrium shift detected. Favorable growth vector.";
    priority = 3;
  } else if (phase === 'stable') {
    eventType = "neutral";
    message = "Market standing at stable equilibrium.";
    priority = 1;
  } else {
    eventType = "neutral";
    message = "Market trend analysis ongoing.";
    priority = 1;
  }

  const systemInsight = { eventType, message, priority };

  // PLAYER-AWARE INSIGHTS
  let playerMessage = "";
  let playerPriority = 0;
  let rankImproved = false;
  
  if (userId) {
    const rankTrend = getPlayerTrend(userId);
    const leaderboard = getLeaderboard();
    const totalPlayers = leaderboard.length;
    
    if (rankTrend > 0) {
      playerMessage = "Your strategy is outperforming others.";
      playerPriority += 1;
      if (rankTrend >= 2) rankImproved = true;
    } else if (rankTrend < 0) {
      playerMessage = "Performance declining. Adjust strategy.";
      playerPriority += 1;
    }

    if (rank && totalPlayers > 0 && rank <= Math.max(1, Math.ceil(totalPlayers * 0.1))) {
      playerMessage += (playerMessage ? " " : "") + "You are influencing market dynamics.";
      playerPriority += 2;
    }
  }

  const playerInsight = {
    message: playerMessage,
    priority: playerPriority,
    rankImproved
  };

  const coachingAdvice = generateCoachingAdvice(playerData, marketData);

  return { 
    systemInsight, 
    playerInsight, 
    coachingAdvice 
  };
}

module.exports = { generateInsights };
