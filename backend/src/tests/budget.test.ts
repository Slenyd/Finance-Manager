import request from 'supertest';
import app from '../app';
import { registerTestUser, cleanupUser, getDefaultCategory } from './helpers';

describe('Budgets API', () => {
  let userId: string;
  let accessToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const user = await registerTestUser();
    userId = user.userId;
    accessToken = user.accessToken;

    const cat = await getDefaultCategory(userId, 'EXPENSE');
    categoryId = cat.id;
  });

  afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  const auth = () => ({ 'Authorization': `Bearer ${accessToken}` });

  it('should create a budget', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set(auth())
      .send({
        categoryId,
        limit: 500.00,
        period: 'MONTHLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.limit)).toBe(500);
  });

  it('should list budgets with spent calculation', async () => {
    const res = await request(app)
      .get('/api/v1/budgets')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('spent');
    expect(res.body.data[0]).toHaveProperty('percentage');
  });

  it('should reject invalid budget data', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set(auth())
      .send({ limit: -100, period: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('should update a budget', async () => {
    const created = await request(app)
      .post('/api/v1/budgets')
      .set(auth())
      .send({
        categoryId,
        limit: 300.00,
        period: 'WEEKLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    const res = await request(app)
      .put(`/api/v1/budgets/${created.body.data.id}`)
      .set(auth())
      .send({ limit: 400.00 });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.limit)).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/budgets');
    expect(res.status).toBe(401);
  });

  it('should find budget by id', async () => {
    const created = await request(app)
      .post('/api/v1/budgets')
      .set(auth())
      .send({
        categoryId,
        limit: 250.00,
        period: 'MONTHLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    const res = await request(app)
      .get(`/api/v1/budgets/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('spent');
    expect(res.body.data).toHaveProperty('percentage');
  });

  it('should return 404 for nonexistent budget', async () => {
    const res = await request(app)
      .get('/api/v1/budgets/00000000-0000-0000-0000-000000000000')
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('should delete a budget', async () => {
    const created = await request(app)
      .post('/api/v1/budgets')
      .set(auth())
      .send({
        categoryId,
        limit: 100.00,
        period: 'MONTHLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    const res = await request(app)
      .delete(`/api/v1/budgets/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
  });
});
