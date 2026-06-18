import request from 'supertest';
import app from '../app';
import { registerTestUser, cleanupUser, getDefaultCategory } from './helpers';

describe('Transactions API', () => {
  let userId: string;
  let accessToken: string;
  let incomeCategoryId: string;
  let expenseCategoryId: string;

  beforeAll(async () => {
    const user = await registerTestUser();
    userId = user.userId;
    accessToken = user.accessToken;

    const incomeCat = await getDefaultCategory(userId, 'INCOME');
    const expenseCat = await getDefaultCategory(userId, 'EXPENSE');
    incomeCategoryId = incomeCat.id;
    expenseCategoryId = expenseCat.id;
  });

  afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  const auth = () => ({ 'Authorization': `Bearer ${accessToken}` });

  it('should create an expense transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 50.00,
        description: 'Test expense',
        type: 'EXPENSE',
        categoryId: expenseCategoryId,
        date: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.amount)).toBe(50);
    expect(res.body.data.description).toBe('Test expense');
  });

  it('should create an income transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 1000.00,
        description: 'Salary',
        type: 'INCOME',
        categoryId: incomeCategoryId,
        date: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
  });

  it('should list transactions', async () => {
    const res = await request(app)
      .get('/api/v1/transactions')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.page).toBe(1);
  });

  it('should filter transactions by type', async () => {
    const res = await request(app)
      .get('/api/v1/transactions?type=INCOME')
      .set(auth());
    expect(res.status).toBe(200);
    for (const t of res.body.data) {
      expect(t.type).toBe('INCOME');
    }
  });

  it('should reject invalid transaction data', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({ amount: -5, description: '', type: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('should update a transaction', async () => {
    const created = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 30.00,
        description: 'To update',
        type: 'EXPENSE',
        categoryId: expenseCategoryId,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .put(`/api/v1/transactions/${created.body.data.id}`)
      .set(auth())
      .send({ description: 'Updated description', amount: 35.00 });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated description');
    expect(Number(res.body.data.amount)).toBe(35);
  });

  it('should get transaction summary', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/summary')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBeGreaterThan(0);
    expect(res.body.data.totalExpenses).toBeGreaterThan(0);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/transactions');
    expect(res.status).toBe(401);
  });

  it('should delete a transaction', async () => {
    const created = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 25.00,
        description: 'To delete',
        type: 'EXPENSE',
        categoryId: expenseCategoryId,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .delete(`/api/v1/transactions/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/transactions/${created.body.data.id}`)
      .set(auth());
    expect(getRes.status).toBe(404);
  });

  it('should find transaction by id', async () => {
    const created = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 75.00,
        description: 'Find me',
        type: 'EXPENSE',
        categoryId: expenseCategoryId,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .get(`/api/v1/transactions/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Find me');
  });

  it('should return 404 for nonexistent transaction', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('should bulk delete transactions', async () => {
    const t1 = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 10.00,
        description: 'Bulk 1',
        type: 'EXPENSE',
        categoryId: expenseCategoryId,
        date: new Date().toISOString(),
      });
    const t2 = await request(app)
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        amount: 20.00,
        description: 'Bulk 2',
        type: 'EXPENSE',
        categoryId: expenseCategoryId,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .delete('/api/v1/transactions/bulk')
      .set(auth())
      .send({ ids: [t1.body.data.id, t2.body.data.id] });
    expect(res.status).toBe(200);
  });
});
