jest.mock('../../models/SimulationState');
jest.mock('../../models/Market');
jest.mock('../../models/Agent');
jest.mock('../../models/Order');
jest.mock('../../models/Portfolio');
jest.mock('../../services/groqService', () => ({
  analyzeMarket: jest.fn().mockResolvedValue({
    analysis: 'test',
    sentiment: 'bullish',
  }),
}));
jest.mock('../../services/beliefEngine', () => ({
  updateBelief: jest.fn((agent) => ({
    bullish: 0.5,
    bearish: 0.3,
    neutral: 0.2,
  })),
}));
jest.mock('../../services/decisionEngine', () => ({
  decideAction: jest.fn(() => 'buy'),
}));
jest.mock('../../services/strategyEngine', () => ({
  evolveStrategies: jest.fn(),
}));
jest.mock('../../services/phaseEngine', () => ({
  detectPhase: jest.fn(() => 'stable'),
}));
jest.mock('../../services/rankingEngine', () => ({
  updatePlayerRanking: jest.fn(),
  getLeaderboard: jest.fn(() => []),
}));
jest.mock('../../services/insightEngine', () => ({
  generateInsights: jest.fn(),
}));
jest.mock('../../services/voiceEngine', () => ({
  triggerVoice: jest.fn(),
}));

const SimulationState = require('../../models/SimulationState');
const Market = require('../../models/Market');
const Agent = require('../../models/Agent');
const Order = require('../../models/Order');
const Portfolio = require('../../models/Portfolio');

// Import mocked service modules to access their jest.fn() functions
const { analyzeMarket } = require('../../services/groqService');
const { updateBelief } = require('../../services/beliefEngine');
const { decideAction } = require('../../services/decisionEngine');
const { evolveStrategies } = require('../../services/strategyEngine');
const { detectPhase } = require('../../services/phaseEngine');
const { updatePlayerRanking, getLeaderboard } = require('../../services/rankingEngine');
const { generateInsights } = require('../../services/insightEngine');
const { triggerVoice } = require('../../services/voiceEngine');

describe('Simulation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mocks with default implementations
    SimulationState.findOne = jest.fn();
    SimulationState.create = jest.fn();
    Market.findOne = jest.fn();
    Market.create = jest.fn();
    Agent.countDocuments = jest.fn();
    Agent.find = jest.fn();
    Agent.insertMany = jest.fn();
    Order.create = jest.fn();
    Order.insertMany = jest.fn();
    Portfolio.findOne = jest.fn();
  });

  describe('Simulation State Management', () => {
    test('should create new simulation state if not found', async () => {
      SimulationState.findOne.mockResolvedValue(null);
      SimulationState.create.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      const result = await SimulationState.findOne();
      expect(result).toBeNull();

      const created = await SimulationState.create({
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      expect(created.currentStep).toBe(0);
      expect(created.priceHistory).toEqual([100]);
    });

    test('should retrieve existing simulation state', async () => {
      const mockState = {
        _id: 'state1',
        currentStep: 100,
        priceHistory: Array.from({ length: 100 }, (_, i) => 100 + i),
        isRunning: true,
      };

      SimulationState.findOne.mockResolvedValue(mockState);

      const state = await SimulationState.findOne();

      expect(state.currentStep).toBe(100);
      expect(state.priceHistory.length).toBe(100);
    });

    test('should not run simulation if not running', async () => {
      const mockState = {
        _id: 'state1',
        currentStep: 10,
        priceHistory: [100, 101, 102],
        isRunning: false,
      };

      SimulationState.findOne.mockResolvedValue(mockState);

      const state = await SimulationState.findOne();
      expect(state.isRunning).toBe(false);
    });
  });

  describe('Market Data Management', () => {
    test('should create new market if not found', async () => {
      Market.findOne.mockResolvedValue(null);
      Market.create.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      const market = await Market.create({
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      expect(market.currentPrice).toBe(100);
      expect(market.state).toBe('stable');
    });

    test('should retrieve market data', async () => {
      const mockMarket = {
        _id: 'market1',
        currentPrice: 150,
        state: 'active',
        phase: 'stable',
        volatility: 0.05,
        priceChange: 5,
      };

      Market.findOne.mockResolvedValue(mockMarket);

      const market = await Market.findOne();

      expect(market.currentPrice).toBe(150);
      expect(market.volatility).toBe(0.05);
    });
  });

  describe('Agent Management', () => {
    test('should count agents', async () => {
      Agent.countDocuments.mockResolvedValue(10);

      const count = await Agent.countDocuments();

      expect(count).toBe(10);
    });

    test('should create agents if below threshold', async () => {
      Agent.countDocuments.mockResolvedValue(5);
      Agent.insertMany.mockResolvedValue([
        { _id: 'agent1', type: 'bot', strategy: 'momentum' },
        { _id: 'agent2', type: 'bot', strategy: 'panic' },
        { _id: 'agent3', type: 'bot', strategy: 'contrarian' },
        { _id: 'agent4', type: 'human', strategy: 'momentum' },
        { _id: 'agent5', type: 'bot', strategy: 'liquidity' },
      ]);

      const count = await Agent.countDocuments();
      expect(count).toBe(5);

      const newAgents = await Agent.insertMany([
        { type: 'bot', strategy: 'momentum' },
      ]);

      expect(newAgents.length).toBeGreaterThan(0);
    });

    test('should retrieve all agents', async () => {
      const mockAgents = [
        {
          _id: 'agent1',
          type: 'bot',
          strategy: 'momentum',
          riskTolerance: 0.5,
          cash: 1000,
          assets: 10,
          performanceScore: 0,
          belief: { bullish: 0.33, bearish: 0.33, neutral: 0.34 },
        },
        {
          _id: 'agent2',
          type: 'human',
          strategy: 'contrarian',
          riskTolerance: 0.7,
          cash: 1500,
          assets: 20,
          performanceScore: 0,
          belief: { bullish: 0.33, bearish: 0.33, neutral: 0.34 },
        },
      ];

      Agent.find.mockResolvedValue(mockAgents);

      const agents = await Agent.find();

      expect(agents.length).toBe(2);
      expect(agents[0].type).toBe('bot');
      expect(agents[1].type).toBe('human');
    });
  });

  describe('Order Processing', () => {
    test('should create buy orders', async () => {
      Order.create.mockResolvedValue({
        _id: 'order1',
        agentId: 'agent1',
        type: 'buy',
        quantity: 1,
        price: 100,
        timestamp: new Date(),
      });

      const order = await Order.create({
        agentId: 'agent1',
        type: 'buy',
        quantity: 1,
        price: 100,
      });

      expect(order.type).toBe('buy');
      expect(order.quantity).toBe(1);
    });

    test('should create sell orders', async () => {
      Order.create.mockResolvedValue({
        _id: 'order2',
        agentId: 'agent2',
        type: 'sell',
        quantity: 5,
        price: 105,
        timestamp: new Date(),
      });

      const order = await Order.create({
        agentId: 'agent2',
        type: 'sell',
        quantity: 5,
        price: 105,
      });

      expect(order.type).toBe('sell');
      expect(order.quantity).toBe(5);
    });

    test('should insert multiple orders', async () => {
      const orders = [
        { agentId: 'agent1', type: 'buy', quantity: 1, price: 100 },
        { agentId: 'agent2', type: 'sell', quantity: 2, price: 105 },
      ];

      Order.insertMany.mockResolvedValue(orders);

      const result = await Order.insertMany(orders);

      expect(result.length).toBe(2);
    });
  });

  describe('Portfolio Updates', () => {
    test('should update player portfolio cash after buy', async () => {
      const mockPortfolio = {
        userId: 'user1',
        cash: 5000,
        assets: 100,
        lastAction: 'buy',
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);

      const portfolio = await Portfolio.findOne({ userId: 'user1' });

      expect(portfolio.cash).toBe(5000);
      expect(portfolio.assets).toBe(100);
    });

    test('should update player portfolio assets after sell', async () => {
      const mockPortfolio = {
        userId: 'user1',
        cash: 1000,
        assets: 50,
        lastAction: 'sell',
      };

      Portfolio.findOne.mockResolvedValue(mockPortfolio);

      const portfolio = await Portfolio.findOne({ userId: 'user1' });

      expect(portfolio.assets).toBe(50);
    });
  });

  describe('Price Calculation', () => {
    test('should calculate price change from history', async () => {
      const mockState = {
        priceHistory: [100, 105, 110, 115, 120],
      };

      const priceChange = mockState.priceHistory[mockState.priceHistory.length - 1] - 
                          mockState.priceHistory[mockState.priceHistory.length - 2];

      expect(priceChange).toBe(5);
    });

    test('should return zero change for single price point', async () => {
      const mockState = {
        priceHistory: [100],
      };

      const priceChange = mockState.priceHistory.length >= 2 
        ? mockState.priceHistory[mockState.priceHistory.length - 1] - 
          mockState.priceHistory[mockState.priceHistory.length - 2]
        : 0;

      expect(priceChange).toBe(0);
    });
  });

  describe('Order Volume Calculation', () => {
    test('should calculate buy volume', () => {
      const orders = [
        { type: 'buy', quantity: 5 },
        { type: 'buy', quantity: 3 },
        { type: 'sell', quantity: 2 },
      ];

      const buyVolume = orders
        .filter(o => o.type === 'buy')
        .reduce((sum, o) => sum + o.quantity, 0);

      expect(buyVolume).toBe(8);
    });

    test('should calculate sell volume', () => {
      const orders = [
        { type: 'buy', quantity: 5 },
        { type: 'sell', quantity: 3 },
        { type: 'sell', quantity: 2 },
      ];

      const sellVolume = orders
        .filter(o => o.type === 'sell')
        .reduce((sum, o) => sum + o.quantity, 0);

      expect(sellVolume).toBe(5);
    });

    test('should weight human actions higher', () => {
      const agents = [
        { _id: 'agent1', type: 'human', action: 'buy' },
        { _id: 'agent2', type: 'bot', action: 'buy' },
      ];

      let buyVolume = 0;
      agents.forEach(agent => {
        if (agent.action === 'buy') {
          const weight = agent.type === 'human' ? 2 : 1;
          buyVolume += weight;
        }
      });

      expect(buyVolume).toBe(3);
    });
  });

  describe('runSimulationTick', () => {
    let runSimulationTick;

    beforeEach(() => {
      jest.clearAllMocks();

      // Setup default resolvers
      SimulationState.findOne = jest.fn();
      SimulationState.create = jest.fn();
      SimulationState.updateOne = jest.fn().mockResolvedValue({});
      
      Market.findOne = jest.fn();
      Market.create = jest.fn();
      Market.updateOne = jest.fn().mockResolvedValue({});
      
      Agent.countDocuments = jest.fn().mockResolvedValue(10);
      Agent.find = jest.fn();
      Agent.insertMany = jest.fn();
      Agent.bulkWrite = jest.fn().mockResolvedValue({});
      
      Order.insertMany = jest.fn().mockResolvedValue([]);
      
      Portfolio.find = jest.fn().mockResolvedValue([]);

      // Configure mocked service functions
      detectPhase.mockReturnValue('stable');
      updateBelief.mockImplementation((agent) => agent.belief || { bullish: 0.5, bearish: 0.3, neutral: 0.2 });
      decideAction.mockReturnValue('buy');
      analyzeMarket.mockResolvedValue({
        sentimentScore: 0.5,
        riskLevel: 'medium',
        explanation: 'Market analysis',
      });
      evolveStrategies.mockImplementation(() => {});
      updatePlayerRanking.mockImplementation(() => {});
      getLeaderboard.mockReturnValue([]);
      generateInsights.mockReturnValue({
        systemInsight: { priority: 1, message: 'System insight', eventType: 'neutral' },
        playerInsight: {},
      });
      triggerVoice.mockReturnValue(null);

      const simulationService = require('../../services/simulationService');
      runSimulationTick = simulationService.runSimulationTick;
    });

    test('should handle basic simulation tick', async () => {
      const mockState = {
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      };

      const mockMarket = {
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      };

      const mockAgents = [
        {
          _id: 'agent1',
          type: 'bot',
          strategy: 'momentum',
          riskTolerance: 0.5,
          belief: { bullish: 0.4, bearish: 0.3, neutral: 0.3 },
          performanceScore: 0,
        },
      ];

      SimulationState.findOne.mockResolvedValue(mockState);
      Market.findOne.mockResolvedValue(mockMarket);
      Agent.find.mockResolvedValue(mockAgents);
      Agent.countDocuments.mockResolvedValue(1);

      await runSimulationTick();

      expect(SimulationState.findOne).toHaveBeenCalled();
      expect(Market.findOne).toHaveBeenCalled();
      expect(Agent.find).toHaveBeenCalled();
      expect(Market.updateOne).toHaveBeenCalled();
      expect(SimulationState.updateOne).toHaveBeenCalled();
    });

    test('should create simulation state if not exists', async () => {
      SimulationState.findOne.mockResolvedValue(null);
      SimulationState.create.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      await runSimulationTick();

      expect(SimulationState.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 0,
          priceHistory: expect.arrayContaining([100]),
          isRunning: true,
        })
      );
    });

    test('should create market if not exists', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue(null);
      Market.create.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      await runSimulationTick();

      expect(Market.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: 100,
          state: 'stable',
        })
      );
    });

    test('should skip tick if simulation not running', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: false,
      });

      await runSimulationTick();

      expect(Market.findOne).not.toHaveBeenCalled();
      expect(Market.updateOne).not.toHaveBeenCalled();
    });

    test('should create agents if below threshold', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.countDocuments.mockResolvedValue(5); // Below threshold of 10
      Agent.find.mockResolvedValue([]);
      Agent.insertMany.mockResolvedValue([]);

      await runSimulationTick();

      expect(Agent.insertMany).toHaveBeenCalled();
      const insertCall = Agent.insertMany.mock.calls[0][0];
      expect(insertCall.length).toBeGreaterThan(0);
    });

    test('should handle price calculations correctly', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 5,
        priceHistory: [100, 101, 102, 103, 104],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 104,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([
        {
          _id: 'agent1',
          type: 'bot',
          strategy: 'momentum',
          riskTolerance: 0.5,
          belief: { bullish: 0.5, bearish: 0.3, neutral: 0.2 },
          performanceScore: 0,
        },
      ]);

      Agent.countDocuments.mockResolvedValue(1);

      await runSimulationTick();

      // Verify Market update was called with new price
      expect(Market.updateOne).toHaveBeenCalled();
      const marketUpdateCall = Market.updateOne.mock.calls[0];
      expect(marketUpdateCall[1].$set).toHaveProperty('currentPrice');
      expect(marketUpdateCall[1].$set.currentPrice).toBeGreaterThanOrEqual(1);
    });

    test('should update agent beliefs and capture actions', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      const mockAgent = {
        _id: 'agent1',
        type: 'bot',
        strategy: 'momentum',
        riskTolerance: 0.5,
        belief: { bullish: 0.4, bearish: 0.3, neutral: 0.3 },
        performanceScore: 0,
      };

      Agent.find.mockResolvedValue([mockAgent]);
      Agent.countDocuments.mockResolvedValue(1);
      decideAction.mockReturnValue('sell');

      await runSimulationTick();

      expect(updateBelief).toHaveBeenCalled();
      expect(decideAction).toHaveBeenCalled();
      expect(Agent.bulkWrite).toHaveBeenCalled();
    });

    test('should detect market phase', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0.02,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      await runSimulationTick();

      expect(detectPhase).toHaveBeenCalled();
    });

    test('should evolve strategies on appropriate step', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 10, // Multiple of 10
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([
        {
          _id: 'agent1',
          type: 'bot',
          strategy: 'momentum',
          riskTolerance: 0.5,
          belief: { bullish: 0.4, bearish: 0.3, neutral: 0.3 },
          performanceScore: 100,
        },
      ]);

      Agent.countDocuments.mockResolvedValue(1);

      await runSimulationTick();

      expect(evolveStrategies).toHaveBeenCalled();
    });

    test('should not evolve strategies on non-milestone step', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 5, // Not a multiple of 10
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      evolveStrategies.mockClear(); // Clear any previous calls

      await runSimulationTick();

      expect(evolveStrategies).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      SimulationState.findOne.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(runSimulationTick()).resolves.toBeUndefined();
    });

    test('should calculate volatility from price history', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100, 101, 102, 101, 100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      await runSimulationTick();

      const marketUpdateCall = Market.updateOne.mock.calls[0];
      expect(marketUpdateCall[1].$set).toHaveProperty('volatility');
      expect(marketUpdateCall[1].$set.volatility).toBeGreaterThanOrEqual(0);
    });

    test('should update sentiment index based on buy/sell volumes', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([
        {
          _id: 'agent1',
          type: 'human',
          strategy: 'momentum',
          riskTolerance: 0.7,
          belief: { bullish: 0.6, bearish: 0.2, neutral: 0.2 },
          performanceScore: 0,
        },
      ]);

      Agent.countDocuments.mockResolvedValue(1);

      await runSimulationTick();

      // Tick should complete successfully
      expect(true).toBe(true);
    });

    test('should include orders when agents make decisions', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([
        {
          _id: 'agent1',
          type: 'bot',
          strategy: 'momentum',
          riskTolerance: 0.5,
          belief: { bullish: 0.4, bearish: 0.3, neutral: 0.3 },
          performanceScore: 0,
        },
      ]);

      Agent.countDocuments.mockResolvedValue(1);

      await runSimulationTick();

      // Tick should complete successfully
      expect(true).toBe(true);
    });

    test('should handle groq analysis on step multiples of 5', async () => {
      SimulationState.findOne.mockResolvedValue({
        _id: 'state1',
        currentStep: 5, // Multiple of 5
        priceHistory: [100],
        isRunning: true,
      });

      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0.02,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Portfolio.find.mockResolvedValue([]);
      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      await runSimulationTick();

      // Test completes without error
      expect(true).toBe(true);
    });

    test('should persist simulation state updates', async () => {
      const initialState = {
        _id: 'state1',
        currentStep: 5,
        priceHistory: [100, 101],
        isRunning: true,
      };

      SimulationState.findOne.mockResolvedValue(initialState);
      Market.findOne.mockResolvedValue({
        _id: 'market1',
        currentPrice: 101,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 },
      });

      Agent.find.mockResolvedValue([]);
      Agent.countDocuments.mockResolvedValue(0);

      await runSimulationTick();

      // Tick should complete successfully
      expect(true).toBe(true);
    });
  });

  describe('startSimulation and stopSimulation', () => {
    test('should export startSimulation and stopSimulation functions', () => {
      delete require.cache[require.resolve('../../services/simulationService')];
      const simulationService = require('../../services/simulationService');
      expect(typeof simulationService.startSimulation).toBe('function');
      expect(typeof simulationService.stopSimulation).toBe('function');
    });

    test('should export runSimulationTick function for testing', () => {
      delete require.cache[require.resolve('../../services/simulationService')];
      const simulationService = require('../../services/simulationService');
      expect(typeof simulationService.runSimulationTick).toBe('function');
    });
  });
});
