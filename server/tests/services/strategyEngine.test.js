const { evolveStrategies } = require('../../services/strategyEngine');

describe('Strategy Engine', () => {
  describe('evolveStrategies', () => {
    test('should replace bottom 10% with top 10% strategy', () => {
      const agents = Array.from({ length: 100 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 10 ? 'winner' : 'loser',
        riskTolerance: 0.5,
        performanceScore: i < 10 ? 100 - i : i - 10,
      }));

      evolveStrategies(agents);

      const bottomAgents = agents.slice(-10);
      const bottomStrategies = bottomAgents.map(a => a.strategy);

      expect(bottomStrategies.every(s => s === 'winner')).toBe(true);
    });

    test('should mutate risk tolerance', () => {
      const agents = Array.from({ length: 10 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 1 ? 'winner' : 'loser',
        riskTolerance: 0.5,
        performanceScore: i < 1 ? 100 : 10 - i,
      }));

      const originalRiskTolerance = agents[9].riskTolerance;
      evolveStrategies(agents);

      expect(agents[9].riskTolerance).not.toBe(originalRiskTolerance);
    });

    test('should clamp risk tolerance between 0 and 1', () => {
      const agents = Array.from({ length: 10 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 1 ? 'winner' : 'loser',
        riskTolerance: i < 1 ? 0.95 : 0.5,
        performanceScore: i < 1 ? 100 : 10 - i,
      }));

      evolveStrategies(agents);

      agents.forEach(agent => {
        expect(agent.riskTolerance).toBeGreaterThanOrEqual(0);
        expect(agent.riskTolerance).toBeLessThanOrEqual(1);
      });
    });

    test('should reset performance score to 0 for bottom agents', () => {
      const agents = Array.from({ length: 10 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 1 ? 'winner' : 'loser',
        riskTolerance: 0.5,
        performanceScore: i < 1 ? 100 : 10 - i,
      }));

      evolveStrategies(agents);

      agents.slice(-1).forEach(agent => {
        expect(agent.performanceScore).toBe(0);
      });
    });

    test('should handle single agent gracefully', () => {
      const agents = [
        {
          _id: 'agent1',
          strategy: 'winner',
          riskTolerance: 0.5,
          performanceScore: 100,
        },
      ];

      expect(() => evolveStrategies(agents)).not.toThrow();
    });

    test('should handle empty array', () => {
      const agents = [];

      expect(() => evolveStrategies(agents)).not.toThrow();
    });

    test('should preserve top 10% strategy', () => {
      const agents = Array.from({ length: 100 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 10 ? 'momentum' : 'contrarian',
        riskTolerance: 0.5,
        performanceScore: i < 10 ? 100 - i : i - 10,
      }));

      const topStrategies = agents.slice(0, 10).map(a => a.strategy);
      evolveStrategies(agents);

      expect(agents.slice(0, 10).map(a => a.strategy)).toEqual(topStrategies);
    });

    test('should mutate within 0.05 range', () => {
      const agents = Array.from({ length: 20 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 2 ? 'winner' : 'loser',
        riskTolerance: 0.5,
        performanceScore: i < 2 ? 100 - i : 20 - i,
      }));

      evolveStrategies(agents);

      const bottomAgents = agents.slice(-2);
      bottomAgents.forEach(agent => {
        const diff = Math.abs(agent.riskTolerance - 0.5);
        expect(diff).toBeLessThanOrEqual(0.05);
      });
    });

    test('should handle 10% population correctly', () => {
      const agents = Array.from({ length: 10 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: 'initial',
        riskTolerance: Math.random(),
        performanceScore: i,
      }));

      evolveStrategies(agents);

      expect(agents.length).toBe(10);
    });

    test('should replace exactly bottom 10% on large population', () => {
      const agents = Array.from({ length: 1000 }, (_, i) => ({
        _id: `agent${i}`,
        strategy: i < 100 ? 'winner' : 'loser',
        riskTolerance: 0.5,
        performanceScore: 1000 - i,
      }));

      const originalStrategies = agents.slice(0, 900).map(a => a.strategy);
      evolveStrategies(agents);

      expect(agents.slice(0, 900).map(a => a.strategy)).toEqual(originalStrategies);
    });
  });
});
