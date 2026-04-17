function decideAction(agent, marketData) {
  // Step 1: Define Payoff Matrix
  // [rise, fall, stable]
  const payoffs = {
    buy: { bullish: 2, bearish: -2, neutral: 0 },
    sell: { bullish: -1, bearish: 2, neutral: 0 },
    hold: { bullish: -0.5, bearish: -0.5, neutral: 0.5 }
  };

  const { belief } = agent;
  const { phase, volatility, sentimentIndex } = marketData;

  // Step 2 & 3: Expected Payoff & Risk Penalty
  let Q = {
    buy: (belief.bullish * payoffs.buy.bullish) + (belief.bearish * payoffs.buy.bearish) + (belief.neutral * payoffs.buy.neutral),
    sell: (belief.bullish * payoffs.sell.bullish) + (belief.bearish * payoffs.sell.bearish) + (belief.neutral * payoffs.sell.neutral),
    hold: (belief.bullish * payoffs.hold.bullish) + (belief.bearish * payoffs.hold.bearish) + (belief.neutral * payoffs.hold.neutral)
  };

  const riskTolerance = agent.riskTolerance || 0.5;
  const vol = volatility || 0;
  
  const buyPenalty = (1 - riskTolerance) * vol;
  Q.buy -= buyPenalty;

  // Step 4: Strategy Logic
  if (phase === 'panic') {
    // Minimax: best worst-case payoff
    // buy worst case: -2, sell worst case: -1, hold worst case: -0.5
    // Adjusted by risk:
    const worstCases = {
      buy: -2 - buyPenalty,
      sell: -1,
      hold: -0.5
    };
    
    // Choose action with highest worst-case value
    let bestWorst = -Infinity;
    let fallbackAction = 'hold';
    for (const [action, wc] of Object.entries(worstCases)) {
      if (wc > bestWorst) {
        bestWorst = wc;
        fallbackAction = action;
      }
    }
    // Hard override in panic if it forces deterministic choice, or bias Q heavily
    // To keep it softmax compatible, we massively boost the Q of the minimax choice
    Q[fallbackAction] += 10;
  } else {
    // Approximate Nash: bias decision using sentimentIndex
    const sentimentBias = sentimentIndex || 0;
    Q.buy += sentimentBias * 0.5;
    Q.sell -= sentimentBias * 0.5;
  }

  // Step 5: Softmax Selection
  const maxQ = Math.max(Q.buy, Q.sell, Q.hold);
  const tau = Math.max(0.1, vol);

  const expQ = {
    buy: Math.exp((Q.buy - maxQ) / tau),
    sell: Math.exp((Q.sell - maxQ) / tau),
    hold: Math.exp((Q.hold - maxQ) / tau),
  };

  const sumExp = expQ.buy + expQ.sell + expQ.hold;
  
  const probs = {
    buy: expQ.buy / sumExp,
    sell: expQ.sell / sumExp,
    hold: expQ.hold / sumExp
  };

  const rand = Math.random();
  if (rand < probs.buy) return 'buy';
  if (rand < probs.buy + probs.sell) return 'sell';
  return 'hold';
}

module.exports = { decideAction };
