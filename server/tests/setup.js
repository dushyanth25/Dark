process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test-db';

// Suppress console logs during tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Set timeout for all tests
jest.setTimeout(10000);
