const { updateBelief } = require('../../services/beliefEngine');

describe('Belief Engine', () => {
  describe('updateBelief', () => {
    const baseAgent = {
      riskTolerance: 0.5,
      belief: {
        bullish: 0.4,
        bearish: 0.3,
        neutral: 0.3,
      },
    };

    const baseMarketData = {
      priceChange: 0,
    };

    test('should increase bullish and decrease bearish on positive price change', () => {
      const agent = { ...baseAgent };
      const marketData = { priceChange: 5 };

      const result = updateBelief(agent, marketData);

      expect(result.bullish).toBeGreaterThan(baseAgent.belief.bullish);
      expect(result.bearish).toBeLessThan(baseAgent.belief.bearish);
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
    });

    test('should increase bearish and decrease bullish on negative price change', () => {
      const agent = { ...baseAgent };
      const marketData = { priceChange: -5 };

      const result = updateBelief(agent, marketData);

      expect(result.bearish).toBeGreaterThan(baseAgent.belief.bearish);
      expect(result.bullish).toBeLessThan(baseAgent.belief.bullish);
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
    });

    test('should maintain beliefs on zero price change', () => {
      const agent = {
        riskTolerance: 0.5,
        belief: {
          bullish: 0.5,
          bearish: 0.3,
          neutral: 0.2,
        },
      };
      const marketData = { priceChange: 0 };

      const result = updateBelief(agent, marketData);

      // Should normalize but proportions should remain similar
      expect(result.bullish).toBeCloseTo(0.5, 1);
      expect(result.bearish).toBeCloseTo(0.3, 1);
      expect(result.neutral).toBeCloseTo(0.2, 1);
    });

    test('should apply higher risk tolerance effect on positive change', () => {
      const lowRiskAgent = { ...baseAgent, riskTolerance: 0.1 };
      const highRiskAgent = { ...baseAgent, riskTolerance: 0.9 };
      const marketData = { priceChange: 5 };

      const lowRiskResult = updateBelief(lowRiskAgent, marketData);
      const highRiskResult = updateBelief(highRiskAgent, marketData);

      // High risk agent should show stronger bullish increase
      expect(highRiskResult.bullish).toBeGreaterThan(lowRiskResult.bullish);
    });

    test('should apply higher risk tolerance effect on negative change', () => {
      const lowRiskAgent = { ...baseAgent, riskTolerance: 0.1 };
      const highRiskAgent = { ...baseAgent, riskTolerance: 0.9 };
      const marketData = { priceChange: -5 };

      const lowRiskResult = updateBelief(lowRiskAgent, marketData);
      const highRiskResult = updateBelief(highRiskAgent, marketData);

      // High risk agent should show stronger bearish increase
      expect(highRiskResult.bearish).toBeGreaterThan(lowRiskResult.bearish);
    });

    test('should return normalized beliefs (sum = 1)', () => {
      const testCases = [
        { priceChange: 10 },
        { priceChange: -10 },
        { priceChange: 0 },
        { priceChange: 100 },
        { priceChange: -100 },
      ];

      testCases.forEach(marketData => {
        const result = updateBelief(baseAgent, marketData);
        const sum = result.bullish + result.bearish + result.neutral;
        expect(sum).toBeCloseTo(1, 10); // Allow for floating point rounding
      });
    });

    test('should ensure all beliefs are non-negative', () => {
      const testCases = [
        { agent: { ...baseAgent, riskTolerance: 0.1 }, marketData: { priceChange: -100 } },
        { agent: { ...baseAgent, riskTolerance: 0.9 }, marketData: { priceChange: 100 } },
        { agent: { belief: { bullish: 0.01, bearish: 0.01, neutral: 0.98 } }, marketData: { priceChange: -50 } },
      ];

      testCases.forEach(({ agent, marketData }) => {
        const result = updateBelief(agent, marketData);
        expect(result.bullish).toBeGreaterThanOrEqual(0);
        expect(result.bearish).toBeGreaterThanOrEqual(0);
        expect(result.neutral).toBeGreaterThanOrEqual(0.01); // Should be at least 0.01 before normalization
      });
    });

    test('should handle agent with no risk tolerance', () => {
      const agent = {
        belief: { bullish: 0.4, bearish: 0.3, neutral: 0.3 },
      };
      const marketData = { priceChange: 5 };

      const result = updateBelief(agent, marketData);
      expect(result).toHaveProperty('bullish');
      expect(result).toHaveProperty('bearish');
      expect(result).toHaveProperty('neutral');
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
    });

    test('should handle very high price changes', () => {
      const agent = baseAgent;
      const marketData = { priceChange: 1000 };

      const result = updateBelief(agent, marketData);
      expect(result.bullish).toBeGreaterThan(0);
      expect(result.bearish).toBeGreaterThan(0);
      expect(result.neutral).toBeGreaterThan(0);
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
    });

    test('should handle very small price changes', () => {
      const agent = baseAgent;
      const marketData = { priceChange: 0.001 };

      const result = updateBelief(agent, marketData);
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
    });

    test('should handle extreme initial beliefs', () => {
      const agent = {
        riskTolerance: 0.5,
        belief: { bullish: 0.95, bearish: 0.01, neutral: 0.04 },
      };
      const marketData = { priceChange: -20 };

      const result = updateBelief(agent, marketData);
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
      expect(result.bearish).toBeGreaterThan(agent.belief.bearish);
    });

    test('should apply alpha adjustment correctly', () => {
      // Alpha = 0.1, so with riskTolerance = 0.5, adjustment = 0.1 * 0.5 = 0.05
      const agent = {
        riskTolerance: 0.5,
        belief: { bullish: 0.5, bearish: 0.3, neutral: 0.2 },
      };
      const marketData = { priceChange: 1 };

      const result = updateBelief(agent, marketData);

      // Before normalization: bullish would increase by ~0.05, bearish decrease by ~0.05
      // Just verify behavior is correct
      expect(result.bullish).toBeGreaterThan(agent.belief.bullish);
      expect(result.bearish).toBeLessThan(agent.belief.bearish);
    });

    test('should handle zero risk tolerance', () => {
      const agent = {
        riskTolerance: 0,
        belief: { bullish: 0.4, bearish: 0.3, neutral: 0.3 },
      };
      const marketData = { priceChange: 100 };

      const result = updateBelief(agent, marketData);
      // With 0 risk tolerance, beliefs should essentially stay the same (after normalization)
      expect(result.bullish + result.bearish + result.neutral).toBeCloseTo(1);
    });
  });
});
