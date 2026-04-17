const mockPortfolioSave = jest.fn();

jest.mock('../../models/Portfolio', () => {
  const PortfolioMock = jest.fn().mockImplementation(() => ({
    userId: 'user123',
    cash: 1000,
    assets: 0,
    tradeHistory: [],
    save: mockPortfolioSave,
  }));
  PortfolioMock.findOne = jest.fn();
  return PortfolioMock;
});

jest.mock('../../models/Market', () => ({
  findOne: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/index');
const Portfolio = require('../../models/Portfolio');
const Market = require('../../models/Market');
const jwt = require('jsonwebtoken');

describe('Trade Routes', () => {
  const mockToken = 'Bearer test-token';
  const mockDecodedUser = { userId: 'user123', isAdmin: false };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    
    jwt.verify.mockImplementation((token, secret, callback) => {
      if (token === 'test-token') {
        callback(null, mockDecodedUser);
      } else {
        callback(new Error('Invalid token'));
      }
    });
  });

  describe('POST /api/trade', () => {
    test('should execute buy trade successfully', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 5000,
        assets: 100,
        tradeHistory: [],
        save: jest.fn().mockResolvedValue({
          userId: 'user123',
          cash: 4000,
          assets: 110,
        }),
      };

      const mockMarket = {
        _id: 'market1',
        currentPrice: 100,
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);
      Market.findOne.mockResolvedValue(mockMarket);

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 10 })
        .expect(200);

      expect(response.body.message).toBe('Trade executed successfully');
      expect(mockPortfolio.save).toHaveBeenCalled();
    });

    test('should execute sell trade successfully', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 1000,
        assets: 100,
        tradeHistory: [],
        save: jest.fn().mockResolvedValue({
          userId: 'user123',
          cash: 2000,
          assets: 90,
        }),
      };

      const mockMarket = {
        _id: 'market1',
        currentPrice: 100,
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);
      Market.findOne.mockResolvedValue(mockMarket);

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'sell', quantity: 10 })
        .expect(200);

      expect(response.body.message).toBe('Trade executed successfully');
      expect(mockPortfolio.assets).toBe(90);
    });

    test('should create new portfolio if not exists', async () => {
      Portfolio.findOne.mockResolvedValue(null);
      Portfolio.mockImplementation(() => ({
        userId: 'user123',
        cash: 1000,
        assets: 0,
        tradeHistory: [],
        save: jest.fn().mockResolvedValue({}),
      }));

      const mockMarket = {
        currentPrice: 100,
      };

      Market.findOne.mockResolvedValue(mockMarket);

      await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 5 })
        .expect(200);

      expect(Portfolio.findOne).toHaveBeenCalled();
    });

    test('should return 401 if no token provided', async () => {
      const response = await request(app)
        .post('/api/trade')
        .send({ type: 'buy', quantity: 10 })
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    test('should return 403 if token is invalid', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'));
      });

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', 'Bearer invalid-token')
        .send({ type: 'buy', quantity: 10 })
        .expect(403);

      expect(response.body.message).toBe('Invalid or expired token.');
    });

    test('should return 400 if trade type is invalid', async () => {
      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'invalid', quantity: 10 })
        .expect(400);

      expect(response.body.message).toBe('Invalid trade parameters.');
    });

    test('should return 400 if quantity is not provided', async () => {
      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy' })
        .expect(400);

      expect(response.body.message).toBe('Invalid trade parameters.');
    });

    test('should return 400 if quantity is zero', async () => {
      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 0 })
        .expect(400);

      expect(response.body.message).toBe('Invalid trade parameters.');
    });

    test('should return 400 if quantity is negative', async () => {
      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: -5 })
        .expect(400);

      expect(response.body.message).toBe('Invalid trade parameters.');
    });

    test('should return 400 if insufficient cash for buy', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 500,
        assets: 100,
        tradeHistory: [],
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);

      const mockMarket = {
        _id: 'market1',
        currentPrice: 100,
      };

      Market.findOne.mockResolvedValue(mockMarket);

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 10 })
        .expect(400);

      expect(response.body.message).toBe('Insufficient cash.');
    });

    test('should return 400 if insufficient assets for sell', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 5000,
        assets: 5,
        tradeHistory: [],
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);

      const mockMarket = {
        _id: 'market1',
        currentPrice: 100,
      };

      Market.findOne.mockResolvedValue(mockMarket);

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'sell', quantity: 10 })
        .expect(400);

      expect(response.body.message).toBe('Insufficient assets.');
    });

    test('should return 500 if market data is unavailable', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 5000,
        assets: 100,
        tradeHistory: [],
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);
      Market.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 10 })
        .expect(500);

      expect(response.body.message).toBe('Market data is unavailable.');
    });

    test('should handle trade execution error', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 5000,
        assets: 100,
        tradeHistory: [],
        save: jest.fn().mockRejectedValue(new Error('DB Error')),
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);

      const mockMarket = {
        currentPrice: 100,
      };

      Market.findOne.mockResolvedValue(mockMarket);

      const response = await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 10 })
        .expect(500);

      expect(response.body.message).toBe('Server error during trade processing.');
    });

    test('should properly update cash and assets on buy', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 5000,
        assets: 100,
        tradeHistory: [],
        save: jest.fn().mockResolvedValue({}),
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);
      Market.findOne.mockResolvedValue({ currentPrice: 100 });

      await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 10 })
        .expect(200);

      expect(mockPortfolio.cash).toBe(4000);
      expect(mockPortfolio.assets).toBe(110);
    });

    test('should properly update cash and assets on sell', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 1000,
        assets: 100,
        tradeHistory: [],
        save: jest.fn().mockResolvedValue({}),
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);
      Market.findOne.mockResolvedValue({ currentPrice: 100 });

      await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'sell', quantity: 10 })
        .expect(200);

      expect(mockPortfolio.cash).toBe(2000);
      expect(mockPortfolio.assets).toBe(90);
    });

    test('should add trade to history', async () => {
      const mockPortfolio = {
        userId: 'user123',
        cash: 5000,
        assets: 100,
        tradeHistory: [],
        save: jest.fn().mockResolvedValue({}),
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);
      Market.findOne.mockResolvedValue({ currentPrice: 100 });

      await request(app)
        .post('/api/trade')
        .set('Authorization', mockToken)
        .send({ type: 'buy', quantity: 10 })
        .expect(200);

      expect(mockPortfolio.tradeHistory.length).toBe(1);
      expect(mockPortfolio.tradeHistory[0]).toEqual({
        type: 'buy',
        quantity: 10,
        price: 100,
      });
    });
  });
});
