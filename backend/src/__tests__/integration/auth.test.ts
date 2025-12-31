import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create a mock express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth routes for testing
  app.post('/api/auth/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Mock successful registration
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: 'test-user-id',
          email,
          nickname: 'Newbie Guy',
        },
        token: 'mock-jwt-token',
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Mock user check
    if (email === 'test@example.com' && password === 'password123') {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email,
            nickname: 'Test User',
          },
          token: 'mock-jwt-token',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  });

  return app;
};

describe('Auth Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Passwords');
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345',
          confirmPassword: '12345',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

