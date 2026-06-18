import request from 'supertest';
import app from '../app';
import { cleanupUser, uniqueEmail } from './helpers';
import { prisma } from '../config/database';

describe('Auth API', () => {
  let userId: string;
  let email: string;
  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  it('should register a new user', async () => {
    email = uniqueEmail();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'TestPass123',
        passwordConfirmation: 'TestPass123',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    userId = res.body.data.user.id;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'TestPass123',
        passwordConfirmation: 'TestPass123',
      });
    expect(res.status).toBe(409);
  });

  it('should reject weak passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: uniqueEmail(),
        password: 'weak',
        passwordConfirmation: 'weak',
      });
    expect(res.status).toBe(400);
  });

  it('should reject mismatched passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: uniqueEmail(),
        password: 'TestPass123',
        passwordConfirmation: 'DifferentPass1',
      });
    expect(res.status).toBe(400);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass123' });
    expect(res.status).toBe(401);
  });

  it('should reject nonexistent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'TestPass123' });
    expect(res.status).toBe(401);
  });

  it('should get profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('should reject unauthenticated profile access', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
  });

  it('should logout and revoke tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });
    expect(res.status).toBe(200);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it('should handle forgot password gracefully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link');
  });

  it('should return same message for nonexistent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link');
  });

  it('should reset password with valid token', async () => {
    const resetEmail = uniqueEmail();
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Reset Test',
        email: resetEmail,
        password: 'TestPass123',
        passwordConfirmation: 'TestPass123',
      });

    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: resetEmail });

    const user = await prisma.user.findUnique({ where: { email: resetEmail } });
    const resetToken = user!.resetToken!;

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        password: 'NewPass456',
        passwordConfirmation: 'NewPass456',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: resetEmail, password: 'NewPass456' });
    expect(loginRes.status).toBe(200);

    await cleanupUser(registerRes.body.data.user.id);
  });

  it('should reject reset with expired token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'invalid-or-expired-token',
        password: 'NewPass456',
        passwordConfirmation: 'NewPass456',
      });
    expect(res.status).toBe(401);
  });

  it('should reject reset with mismatched passwords', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'some-token',
        password: 'NewPass456',
        passwordConfirmation: 'DifferentPass1',
      });
    expect(res.status).toBe(400);
  });

  it('should not allow login after account lockout', async () => {
    const lockEmail = uniqueEmail();
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Lock Test',
        email: lockEmail,
        password: 'TestPass123',
        passwordConfirmation: 'TestPass123',
      });

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockEmail, password: 'WrongPass123' });
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: lockEmail, password: 'TestPass123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('locked');
  });
});

describe('Health API', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Finance Manager API is running');
  });
});
