import request from 'supertest';
import app from '../app';
import { registerTestUser, cleanupUser } from './helpers';

describe('Categories API', () => {
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

  it('should list default categories on registration', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(12);
  });

  it('should create a custom category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set(auth())
      .send({
        name: 'Custom Cat',
        icon: 'star',
        color: '#ff0000',
        type: 'EXPENSE',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Custom Cat');
  });

  it('should reject invalid category data', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set(auth())
      .send({ name: '', type: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('should update a category', async () => {
    const created = await request(app)
      .post('/api/v1/categories')
      .set(auth())
      .send({
        name: 'Temp Cat',
        type: 'INCOME',
      });

    const res = await request(app)
      .put(`/api/v1/categories/${created.body.data.id}`)
      .set(auth())
      .send({ name: 'Updated Cat' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Cat');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
  });

  it('should find category by id', async () => {
    const created = await request(app)
      .post('/api/v1/categories')
      .set(auth())
      .send({
        name: 'Findable',
        type: 'EXPENSE',
      });

    const res = await request(app)
      .get(`/api/v1/categories/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Findable');
  });

  it('should return 401 without auth for single category', async () => {
    const res = await request(app).get('/api/v1/categories/some-id');
    expect(res.status).toBe(401);
  });

  it('should delete a custom category', async () => {
    const created = await request(app)
      .post('/api/v1/categories')
      .set(auth())
      .send({
        name: 'Delete Me',
        type: 'EXPENSE',
      });

    const res = await request(app)
      .delete(`/api/v1/categories/${created.body.data.id}`)
      .set(auth());
    expect(res.status).toBe(200);
  });
});
