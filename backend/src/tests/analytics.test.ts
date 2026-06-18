import request from 'supertest';
import app from '../app';
import { registerTestUser, cleanupUser, getDefaultCategory } from './helpers';

describe('Analytics API', () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const user = await registerTestUser();
    userId = user.userId;
    accessToken = user.accessToken;

    const expenseCat = await getDefaultCategory(userId, 'EXPENSE');
    const incomeCat = await getDefaultCategory(userId, 'INCOME');

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 3000.00,
        description: 'Salary',
        type: 'INCOME',
        categoryId: incomeCat.id,
        date: new Date().toISOString(),
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 200.00,
        description: 'Groceries',
        type: 'EXPENSE',
        categoryId: expenseCat.id,
        date: new Date().toISOString(),
      });
  });

  afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  const auth = () => ({ 'Authorization': `Bearer ${accessToken}` });

  it('should return dashboard data', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentBalance');
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('totalExpenses');
    expect(res.body.data.totalIncome).toBe(3000);
    expect(res.body.data.totalExpenses).toBe(200);
  });

  it('should return monthly spending', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/monthly-spending?months=3')
      .set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return category breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/category-breakdown')
      .set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return cash flow', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/cash-flow?months=6')
      .set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return net worth', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/net-worth')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentNetWorth');
    expect(res.body.data).toHaveProperty('trend');
  });
});
