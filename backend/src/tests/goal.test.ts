import request from 'supertest';
import app from '../app';
import { registerTestUser, cleanupUser } from './helpers';

describe('Goals API', () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const user = await registerTestUser();
    userId = user.userId;
    accessToken = user.accessToken;
  });

  afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  const auth = () => ({ 'Authorization': `Bearer ${accessToken}` });

  it('should create a savings goal', async () => {
    const res = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({
        name: 'Emergency Fund',
        targetAmount: 10000.00,
        currentAmount: 0,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Emergency Fund');
    expect(Number(res.body.data.targetAmount)).toBe(10000);
  });

  it('should list goals with progress', async () => {
    const res = await request(app)
      .get('/api/v1/goals')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('progress');
  });

  it('should reject invalid goal data', async () => {
    const res = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({ name: '', targetAmount: -100 });
    expect(res.status).toBe(400);
  });

  it('should update a goal', async () => {
    const created = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({
        name: 'Vacation',
        targetAmount: 5000.00,
      });

    const res = await request(app)
      .put(`/api/v1/goals/${created.body.data.id}`)
      .set(auth())
      .send({ name: 'Big Vacation', targetAmount: 8000.00 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Big Vacation');
    expect(Number(res.body.data.targetAmount)).toBe(8000);
  });

  it('should contribute to a goal', async () => {
    const created = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({
        name: 'New Car',
        targetAmount: 20000.00,
      });

    const res = await request(app)
      .post(`/api/v1/goals/${created.body.data.id}/contribute`)
      .set(auth())
      .send({ amount: 500.00 });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.currentAmount)).toBe(500);
  });

  it('should find goal by id', async () => {
    const created = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({
        name: 'Findable',
        targetAmount: 5000.00,
      });

    const res = await request(app)
      .get(`/api/v1/goals/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Findable');
  });

  it('should reject negative contribution', async () => {
    const created = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({
        name: 'Neg Test',
        targetAmount: 1000.00,
      });

    const res = await request(app)
      .post(`/api/v1/goals/${created.body.data.id}/contribute`)
      .set(auth())
      .send({ amount: -50 });
    expect(res.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/goals');
    expect(res.status).toBe(401);
  });

  it('should delete a goal', async () => {
    const created = await request(app)
      .post('/api/v1/goals')
      .set(auth())
      .send({
        name: 'Delete Goal',
        targetAmount: 1000.00,
      });

    const res = await request(app)
      .delete(`/api/v1/goals/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
  });
});
