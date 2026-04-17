/**
 * MONGOOSE MODEL MOCKING PATTERNS FOR JEST
 * 
 * This file demonstrates reusable mocking patterns for all models.
 * Copy and adapt these patterns for your tests.
 */

// ============================================================================
// IMPORT MOCKING SETUP
// ============================================================================

const User = require('../../src/models/User');
const Portfolio = require('../../models/Portfolio');
const Market = require('../../models/Market');
const Order = require('../../models/Order');
const Agent = require('../../models/Agent');

jest.mock('../../src/models/User');
jest.mock('../../models/Portfolio');
jest.mock('../../models/Market');
jest.mock('../../models/Order');
jest.mock('../../models/Agent');

// ============================================================================
// USER MODEL MOCKS
// ============================================================================

/**
 * Mock User.findOne() - Success case
 */
User.findOne.mockResolvedValue({
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  password: '$2a$12$hashedpassword',
  isAdmin: false,
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    isAdmin: false,
  }),
});

/**
 * Mock User.findOne() - Not found case
 */
User.findOne.mockResolvedValueOnce(null);

/**
 * Mock User.findById()
 */
User.findById.mockResolvedValue({
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  isAdmin: false,
});

/**
 * Mock User.find() - Get all users
 */
User.find.mockResolvedValue([
  {
    _id: '507f1f77bcf86cd799439011',
    email: 'user1@example.com',
    isAdmin: false,
  },
  {
    _id: '507f1f77bcf86cd799439012',
    email: 'admin@example.com',
    isAdmin: true,
  },
]);

/**
 * Mock User instance save()
 */
const mockUserInstance = new User({
  email: 'newuser@example.com',
  password: 'password123',
});

mockUserInstance.save.mockResolvedValue({
  _id: '507f1f77bcf86cd799439013',
  email: 'newuser@example.com',
  isAdmin: false,
});

/**
 * Mock User.countDocuments()
 */
User.countDocuments.mockResolvedValue(5);

/**
 * Mock User.findOneAndUpdate() - With new: true option
 */
User.findOneAndUpdate.mockResolvedValue({
  _id: '507f1f77bcf86cd799439011',
  email: 'updated@example.com',
  isAdmin: true,
});

// ============================================================================
// PORTFOLIO MODEL MOCKS
// ============================================================================

/**
 * Mock Portfolio.findOne() - Success
 */
Portfolio.findOne.mockResolvedValue({
  _id: 'portfolio1',
  userId: 'user123',
  cash: 5000,
  assets: 100,
  tradeHistory: [
    { type: 'buy', quantity: 10, price: 100 },
    { type: 'sell', quantity: 5, price: 105 },
  ],
  save: jest.fn().mockResolvedValue({
    userId: 'user123',
    cash: 4950,
    assets: 105,
  }),
});

/**
 * Mock Portfolio.find() - Query multiple
 */
Portfolio.find.mockResolvedValue([
  {
    userId: 'user1',
    cash: 5000,
    assets: 100,
  },
  {
    userId: 'user2',
    cash: 3000,
    assets: 50,
  },
]);

/**
 * Mock Portfolio.updateOne()
 */
Portfolio.updateOne.mockResolvedValue({
  acknowledged: true,
  modifiedCount: 1,
});

// ============================================================================
// MARKET MODEL MOCKS
// ============================================================================

/**
 * Mock Market.findOne()
 */
Market.findOne.mockResolvedValue({
  _id: 'market1',
  currentPrice: 150,
  state: 'active',
  phase: 'stable',
  volatility: 0.05,
  riskLevel: 'LOW',
  equilibriumState: 'stable',
  priceChange: 5,
  explanation: 'Market analysis in progress',
  save: jest.fn().mockResolvedValue({
    currentPrice: 150,
    volatility: 0.05,
  }),
});

/**
 * Mock Market.create()
 */
Market.create.mockResolvedValue({
  _id: 'market_new',
  currentPrice: 100,
  state: 'stable',
  phase: 'stable',
  volatility: 0,
});

/**
 * Mock Market.updateOne()
 */
Market.updateOne.mockResolvedValue({
  acknowledged: true,
  modifiedCount: 1,
});

// ============================================================================
// ORDER MODEL MOCKS
// ============================================================================

/**
 * Mock Order.find() with chainable methods
 */
Order.find.mockReturnValue({
  sort: jest.fn().mockReturnValue({
    limit: jest.fn().mockResolvedValue([
      {
        _id: 'order1',
        agentId: 'agent1',
        type: 'buy',
        quantity: 10,
        price: 100,
        createdAt: new Date(),
      },
      {
        _id: 'order2',
        agentId: 'agent2',
        type: 'sell',
        quantity: 5,
        price: 105,
        createdAt: new Date(),
      },
    ]),
  }),
  populate: jest.fn().mockReturnValue({
    limit: jest.fn().mockResolvedValue([]),
  }),
});

/**
 * Mock Order.create()
 */
Order.create.mockResolvedValue({
  _id: 'order_new',
  type: 'buy',
  quantity: 10,
  price: 100,
});

/**
 * Mock Order.insertMany()
 */
Order.insertMany.mockResolvedValue([
  { _id: 'order1', type: 'buy' },
  { _id: 'order2', type: 'sell' },
]);

// ============================================================================
// AGENT MODEL MOCKS
// ============================================================================

/**
 * Mock Agent.find()
 */
Agent.find.mockResolvedValue([
  {
    _id: 'agent1',
    type: 'bot',
    strategy: 'momentum',
    riskTolerance: 0.5,
    cash: 1000,
    assets: 10,
    performanceScore: 100,
    belief: { bullish: 0.5, bearish: 0.3, neutral: 0.2 },
  },
  {
    _id: 'agent2',
    type: 'human',
    strategy: 'contrarian',
    riskTolerance: 0.7,
    cash: 1500,
    assets: 20,
    performanceScore: 150,
    belief: { bullish: 0.4, bearish: 0.4, neutral: 0.2 },
  },
]);

/**
 * Mock Agent.countDocuments()
 */
Agent.countDocuments.mockResolvedValue(10);

/**
 * Mock Agent.insertMany()
 */
Agent.insertMany.mockResolvedValue([
  {
    _id: 'agent_new1',
    type: 'bot',
    strategy: 'momentum',
  },
  {
    _id: 'agent_new2',
    type: 'bot',
    strategy: 'panic',
  },
]);

/**
 * Mock Agent.findByIdAndUpdate()
 */
Agent.findByIdAndUpdate.mockResolvedValue({
  _id: 'agent1',
  performanceScore: 200,
  strategy: 'momentum',
});

// ============================================================================
// CLEARING MOCKS IN beforeEach
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset all mocks to default working state
  User.findOne.mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    isAdmin: false,
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      isAdmin: false,
    }),
  });

  Portfolio.findOne.mockResolvedValue({
    _id: 'portfolio1',
    userId: 'user123',
    cash: 5000,
    assets: 100,
    tradeHistory: [],
    save: jest.fn().mockResolvedValue({}),
  });

  Market.findOne.mockResolvedValue({
    _id: 'market1',
    currentPrice: 150,
    state: 'active',
    save: jest.fn().mockResolvedValue({}),
  });

  Order.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([]),
    }),
  });

  Agent.find.mockResolvedValue([]);
  Agent.countDocuments.mockResolvedValue(0);
});

// ============================================================================
// PATTERNS FOR COMMON TEST SCENARIOS
// ============================================================================

/**
 * Pattern: Mock successful database operation
 */
function mockSuccessfulOperation(model, method, returnValue) {
  model[method].mockResolvedValue(returnValue);
}

/**
 * Pattern: Mock failed database operation
 */
function mockFailedOperation(model, method, error = new Error('DB Error')) {
  model[method].mockRejectedValue(error);
}

/**
 * Pattern: Mock chainable methods (find().sort().limit())
 */
function mockChainableQuery(model, method, finalValue) {
  model[method].mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(finalValue),
    }),
    populate: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(finalValue),
    }),
  });
}

/**
 * Pattern: Mock instance method
 */
function mockInstanceMethod(model, methodName, returnValue) {
  model.prototype[methodName] = jest.fn().mockResolvedValue(returnValue);
}

/**
 * Pattern: Reset all model mocks
 */
function resetAllMocks() {
  jest.clearAllMocks();
}

module.exports = {
  mockSuccessfulOperation,
  mockFailedOperation,
  mockChainableQuery,
  mockInstanceMethod,
  resetAllMocks,
};
