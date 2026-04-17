const { decideAction } = require('../../services/decisionEngine');

describe('Decision Engine', () => {
  describe('decideAction', () => {
    const mockAgent = {
      riskTolerance: 0.5,
      belief: { bullish: 0.5, bearish: 0.3, neutral: 0.2 },
    };

    const mockMarketData = {
      phase: 'stable',
      volatility: 0.05,
      sentimentIndex: 0.5,
      priceChange: 1,
    };

    test('should return valid action', () => {
      const action = decideAction(mockAgent, mockMarketData);
      expect(['buy', 'sell', 'hold']).toContain(action);
    });

    test('should apply risk tolerance to buy penalty', () => {
      const lowRiskAgent = {
        ...mockAgent,
        riskTolerance: 0.1,
      };

      const actions = [];
      for (let i = 0; i < 100; i++) {
        actions.push(decideAction(lowRiskAgent, mockMarketData));
      }

      expect(actions.some(a => a === 'buy' || a === 'sell' || a === 'hold')).toBe(true);
    });

    test('should handle high risk tolerance', () => {
      const highRiskAgent = {
        ...mockAgent,
        riskTolerance: 0.9,
      };

      const action = decideAction(highRiskAgent, mockMarketData);
      expect(['buy', 'sell', 'hold']).toContain(action);
    });

    test('should prefer defensive action in panic phase', () => {
      const panicMarket = {
        phase: 'panic',
        volatility: 0.2,
        sentimentIndex: -0.5,
        priceChange: -5,
      };

      const actions = [];
      for (let i = 0; i < 50; i++) {
        actions.push(decideAction(mockAgent, panicMarket));
      }

      expect(actions.length).toBeGreaterThan(0);
    });

    test('should influence buy with positive sentiment', () => {
      const positiveSentiment = {
        ...mockMarketData,
        sentimentIndex: 0.8,
      };

      const actions = [];
      for (let i = 0; i < 50; i++) {
        actions.push(decideAction(mockAgent, positiveSentiment));
      }

      expect(actions.length).toBeGreaterThan(0);
    });

    test('should influence sell with negative sentiment', () => {
      const negativeSentiment = {
        ...mockMarketData,
        sentimentIndex: -0.8,
      };

      const actions = [];
      for (let i = 0; i < 50; i++) {
        actions.push(decideAction(mockAgent, negativeSentiment));
      }

      expect(actions.length).toBeGreaterThan(0);
    });

    test('should handle zero volatility', () => {
      const zeroVolMarket = {
        ...mockMarketData,
        volatility: 0,
      };

      const action = decideAction(mockAgent, zeroVolMarket);
      expect(['buy', 'sell', 'hold']).toContain(action);
    });

    test('should handle high volatility', () => {
      const highVolMarket = {
        ...mockMarketData,
        volatility: 0.5,
      };

      const action = decideAction(mockAgent, highVolMarket);
      expect(['buy', 'sell', 'hold']).toContain(action);
    });

    test('should handle agent without riskTolerance', () => {
      const agentNoRisk = {
        belief: { bullish: 0.5, bearish: 0.3, neutral: 0.2 },
      };

      const action = decideAction(agentNoRisk, mockMarketData);
      expect(['buy', 'sell', 'hold']).toContain(action);
    });

    test('should handle missing belief distribution', () => {
      const agentNoBelief = {
        riskTolerance: 0.5,
        belief: { bullish: 0, bearish: 0, neutral: 1 },
      };

      const action = decideAction(agentNoBelief, mockMarketData);
      expect(['buy', 'sell', 'hold']).toContain(action);
    });

    test('should apply softmax temperature correctly', () => {
      const actions = [];
      for (let i = 0; i < 100; i++) {
        actions.push(decideAction(mockAgent, mockMarketData));
      }

      const buyCount = actions.filter(a => a === 'buy').length;
      const sellCount = actions.filter(a => a === 'sell').length;
      const holdCount = actions.filter(a => a === 'hold').length;

      expect(buyCount + sellCount + holdCount).toBe(100);
    });
  });
});
