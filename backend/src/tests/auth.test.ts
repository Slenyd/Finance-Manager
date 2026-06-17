import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'Password123',
        passwordConfirmation: 'Password123',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should reject weak passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: 'test@example.com',
        password: 'weak',
        passwordConfirmation: 'weak',
      });
    expect(res.status).toBe(400);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@financemanager.com',
        password: 'Password123',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@financemanager.com',
        password: 'wrongpassword',
      });
    expect(res.status).toBe(401);
  });
});
