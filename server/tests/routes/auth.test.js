jest.mock('../../src/models/User', () => {
  const mockSave = jest.fn();
  const User = function(data) {
    Object.assign(this, data);
    this.save = mockSave;
  };
  User.findOne = jest.fn();
  User.findById = jest.fn();
  User.prototype.save = mockSave;
  User.prototype.comparePassword = jest.fn();
  return User;
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/index');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('POST /api/auth/register', () => {
    test('should register user successfully with 201', async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isAdmin: false,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);

      expect(response.body.message).toBe('Registration successful. Welcome to Gotham.');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.id).toBe('507f1f77bcf86cd799439011');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });

    test('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });

    test('should return 400 if password is less than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'pass' })
        .expect(400);

      expect(response.body.message).toBe('Password must be at least 6 characters');
    });

    test('should return 409 if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(409);

      expect(response.body.message).toBe('User already exists with this email');
    });

    test('should return 409 on duplicate key error', async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save.mockRejectedValue({ code: 11000 });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(409);

      expect(response.body.message).toBe('User already exists with this email');
    });

    test('should return 500 on other errors', async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(500);

      expect(response.body.message).toBe('Server error during registration');
    });

    test('should lowercase email on registration', async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save.mockResolvedValue({
        _id: '123',
        email: 'test@example.com',
        isAdmin: false,
      });

      await request(app)
        .post('/api/auth/register')
        .send({ email: 'TEST@EXAMPLE.COM', password: 'password123' })
        .expect(201);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login user successfully with 200', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        isAdmin: false,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('token123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBe('token123');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.id).toBe('507f1f77bcf86cd799439011');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });

    test('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });

    test('should return 401 if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return 401 if password is incorrect', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return 500 on database error', async () => {
      User.findOne.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(500);

      expect(response.body.message).toBe('Server error during login');
    });

    test('should sign JWT with correct payload', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isAdmin: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('token123');

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', isAdmin: true },
        'test-secret',
        { expiresIn: '7d' }
      );
    });

    test('should lowercase email on login', async () => {
      User.findOne.mockResolvedValue(null);

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'TEST@EXAMPLE.COM', password: 'password123' })
        .expect(401);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('GET /api/health', () => {
    test('should return health check with 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('Gotham server is online');
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.message).toBe('Route not found');
    });
  });
});
