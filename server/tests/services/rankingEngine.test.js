const { updatePlayerRanking, getLeaderboard } = require('../../services/rankingEngine');

jest.mock('../../services/tierEngine', () => ({
  assignTier: jest.fn((score) => {
    if (score > 500) return 'Platinum';
    if (score > 300) return 'Gold';
    if (score > 100) return 'Silver';
    return 'Bronze';
  }),
}));

describe('Ranking Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePlayerRanking', () => {
    test('should create new player stats on first update', () => {
      const tradeData = {
        cash: 1200,
        assets: 10,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 5,
      };

      updatePlayerRanking('player1', tradeData, marketData);
      const leaderboard = getLeaderboard();

      expect(leaderboard.some(p => p.userId === 'player1')).toBe(true);
    });

    test('should calculate profit correctly', () => {
      const tradeData = {
        cash: 1500,
        assets: 0,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 0,
      };

      updatePlayerRanking('player2', tradeData, marketData);
      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player2');

      expect(player.profit).toBe(500);
    });

    test('should calculate negative profit on loss', () => {
      const tradeData = {
        cash: 800,
        assets: 0,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 0,
      };

      updatePlayerRanking('player3', tradeData, marketData);
      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player3');

      expect(player.profit).toBe(-200);
    });

    test('should calculate risk efficiency', () => {
      const tradeData = {
        cash: 1200,
        assets: 10,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.1,
        priceChange: 5,
      };

      updatePlayerRanking('player4', tradeData, marketData);
      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player4');

      expect(player.riskEfficiency).toBeDefined();
    });

    test('should handle zero volatility', () => {
      const tradeData = {
        cash: 1200,
        assets: 10,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0,
        priceChange: 5,
      };

      expect(() =>
        updatePlayerRanking('player5', tradeData, marketData)
      ).not.toThrow();
    });

    test('should increment timing score on correct buy', () => {
      const tradeData = {
        cash: 1000,
        assets: 10,
        lastAction: 'buy',
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 5,
      };

      updatePlayerRanking('player6', tradeData, marketData);
      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player6');

      expect(player.timingScore).toBeGreaterThan(0);
    });

    test('should decrement timing score on wrong buy', () => {
      const tradeData = {
        cash: 1000,
        assets: 10,
        lastAction: 'buy',
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: -5,
      };

      updatePlayerRanking('player7', tradeData, marketData);
      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player7');

      expect(player.timingScore).toBeLessThan(0);
    });

    test('should calculate consistency score', () => {
      const tradeData = {
        cash: 1100,
        assets: 10,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 0,
      };

      updatePlayerRanking('player8', tradeData, marketData);
      updatePlayerRanking('player8', tradeData, marketData);

      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player8');

      expect(player).toBeDefined();
    });

    test('should assign tier based on score', () => {
      const tradeData = {
        cash: 2000,
        assets: 50,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 10,
      };

      updatePlayerRanking('player9', tradeData, marketData);
      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player9');

      expect(player.tier).toBeDefined();
      expect(['Bronze', 'Silver', 'Gold', 'Platinum', 'Elite Trader']).toContain(player.tier);
    });

    test('should detect tier change', () => {
      const lowTradeData = {
        cash: 900,
        assets: 0,
      };

      const highTradeData = {
        cash: 2000,
        assets: 100,
      };

      const marketData = {
        currentPrice: 100,
        volatility: 0.05,
        priceChange: 0,
      };

      updatePlayerRanking('player10', lowTradeData, marketData);
      updatePlayerRanking('player10', highTradeData, marketData);

      const leaderboard = getLeaderboard();
      const player = leaderboard.find(p => p.userId === 'player10');

      expect(player.tierChanged).toBeDefined();
    });
  });

  describe('getLeaderboard', () => {
    test('should return sorted leaderboard by score', () => {
      const player1Data = { cash: 1500, assets: 10 };
      const player2Data = { cash: 1100, assets: 10 };
      const marketData = { currentPrice: 100, volatility: 0.05, priceChange: 0 };

      updatePlayerRanking('top-player', player1Data, marketData);
      updatePlayerRanking('low-player', player2Data, marketData);

      const leaderboard = getLeaderboard();

      expect(leaderboard[0].score).toBeGreaterThanOrEqual(leaderboard[1].score);
    });

    test('should assign ranks correctly', () => {
      const marketData = { currentPrice: 100, volatility: 0.05, priceChange: 0 };

      for (let i = 1; i <= 5; i++) {
        updatePlayerRanking(`player${i}`, { cash: 1000 + i * 100, assets: 10 }, marketData);
      }

      const leaderboard = getLeaderboard();

      leaderboard.forEach((player, index) => {
        expect(player.rank).toBe(index + 1);
      });
    });

    test('should return empty leaderboard initially', () => {
      const leaderboard = getLeaderboard();
      expect(Array.isArray(leaderboard)).toBe(true);
    });

    test('should include all player stats in leaderboard', () => {
      const marketData = { currentPrice: 100, volatility: 0.05, priceChange: 0 };

      updatePlayerRanking('player_a', { cash: 1200, assets: 10 }, marketData);
      updatePlayerRanking('player_b', { cash: 1300, assets: 10 }, marketData);

      const leaderboard = getLeaderboard();

      expect(leaderboard.some(p => p.userId === 'player_a')).toBe(true);
      expect(leaderboard.some(p => p.userId === 'player_b')).toBe(true);
    });

    test('should include profit in leaderboard', () => {
      const marketData = { currentPrice: 100, volatility: 0.05, priceChange: 0 };

      updatePlayerRanking('profit-player', { cash: 1500, assets: 0 }, marketData);

      const leaderboard = getLeaderboard();
      const player = leaderboard[0];

      expect(player.profit).toBeDefined();
    });
  });
});
