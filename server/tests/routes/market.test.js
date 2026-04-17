jest.mock('../../models/Market', () => {
  const Market = function(data) {
    Object.assign(this, data);
    this.save = jest.fn();
  };
  Market.findOne = jest.fn();
  return Market;
});

jest.mock('../../models/SimulationState', () => {
  const SimulationState = function(data) {
    Object.assign(this, data);
    this.save = jest.fn();
  };
  SimulationState.findOne = jest.fn();
  return SimulationState;
});

jest.mock('../../models/Order', () => {
  const Order = function(data) {
    Object.assign(this, data);
    this.save = jest.fn();
  };
  Order.find = jest.fn();
  Order.findById = jest.fn();
  return Order;
});

jest.mock('../../services/rankingEngine', () => ({
  getLeaderboard: jest.fn(() => [
    { userId: 'user1', score: 100, tier: 'gold' },
  ]),
}));
jest.mock('../../services/coachingEngine', () => ({
  generateCoachingAdvice: jest.fn(() => ({ advice: 'test advice' })),
}));
jest.mock('../../services/insightEngine', () => ({
  generateInsights: jest.fn(() => ({
    systemInsight: { message: 'Market analysis', eventType: 'neutral' },
    playerInsight: { message: 'Player analysis' },
  })),
}));
jest.mock('../../services/voiceEngine', () => ({
  triggerVoice: jest.fn(() => 'test voice output'),
}));

const request = require('supertest');
const app = require('../../src/index');
const Market = require('../../models/Market');
const SimulationState = require('../../models/SimulationState');
const Order = require('../../models/Order');

describe('Market Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/market', () => {
    test('should return market data successfully', async () => {
      const mockMarket = {
        _id: 'market1',
        currentPrice: 150,
        state: 'active',
        phase: 'stable',
        volatility: 0.05,
        riskLevel: 'LOW',
        equilibriumState: 'stable',
        explanation: 'Market is stable',
        priceChange: 5,
      };

      const mockState = {
        _id: 'state1',
        currentStep: 10,
        priceHistory: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150],
        isRunning: true,
      };

      Market.findOne.mockResolvedValue(mockMarket);
      SimulationState.findOne.mockResolvedValue(mockState);
      Order.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/market')
        .expect(200);

      expect(response.body.currentPrice).toBe(150);
      expect(response.body.state).toBe('active');
      expect(response.body.leaderboard).toBeDefined();
      expect(response.body.systemInsight).toBeDefined();
    });

    test('should return 404 if market data not found', async () => {
      Market.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/market')
        .expect(404);

      expect(response.body.message).toBe('Market data not found');
    });

    test('should return 404 if simulation state not found', async () => {
      const mockMarket = { _id: 'market1', currentPrice: 100 };
      Market.findOne.mockResolvedValue(mockMarket);
      SimulationState.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/market')
        .expect(404);

      expect(response.body.message).toBe('Market data not found');
    });

    test('should handle server error', async () => {
      Market.findOne.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/market')
        .expect(500);

      expect(response.body.message).toBe('Server error');
      expect(response.body.currentPrice).toBe(1);
    });

    test('should return default price history if empty', async () => {
      const mockMarket = {
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0.05,
      };

      const mockState = {
        _id: 'state1',
        currentStep: 0,
        priceHistory: [],
        isRunning: true,
      };

      Market.findOne.mockResolvedValue(mockMarket);
      SimulationState.findOne.mockResolvedValue(mockState);

      const response = await request(app)
        .get('/api/market')
        .expect(200);

      expect(response.body.priceHistory).toContain(100);
    });

    test('should slice price history to last 50 items', async () => {
      const mockMarket = {
        currentPrice: 200,
        state: 'active',
      };

      const priceHistory = Array.from({ length: 100 }, (_, i) => 100 + i);
      const mockState = {
        priceHistory,
        isRunning: true,
      };

      Market.findOne.mockResolvedValue(mockMarket);
      SimulationState.findOne.mockResolvedValue(mockState);

      const response = await request(app)
        .get('/api/market')
        .expect(200);

      expect(response.body.priceHistory.length).toBe(50);
      expect(response.body.priceHistory[0]).toBe(150);
    });
  });

  describe('GET /api/history', () => {
    test('should return order history successfully', async () => {
      const mockOrders = [
  { _id: 'order1', type: 'buy', quantity: 10, createdAt: '2026-04-17T10:35:10.382Z', agentId: 'agent1' },
  { _id: 'order2', type: 'sell', quantity: 5, createdAt: '2026-04-17T10:35:10.382Z', agentId: 'agent2' },
];

      const populateMock = jest.fn().mockResolvedValue(mockOrders);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      Order.find.mockReturnValue({ sort: sortMock });

      const response = await request(app)
        .get('/api/history')
        .expect(200);

      expect(response.body).toEqual(mockOrders);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limitMock).toHaveBeenCalledWith(50);
      expect(populateMock).toHaveBeenCalledWith('agentId', 'type');
    });

    test('should handle error fetching history', async () => {
      const populateMock = jest.fn().mockRejectedValue(new Error('DB Error'));
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      Order.find.mockReturnValue({ sort: sortMock });

      const response = await request(app)
        .get('/api/history')
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    test('should return empty array if no orders', async () => {
      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      Order.find.mockReturnValue({ sort: sortMock });

      const response = await request(app)
        .get('/api/history')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
