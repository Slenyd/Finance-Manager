import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';

const TEST_PASSWORD = 'TestPass123';

export function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function registerTestUser(email?: string) {
  const e = email || uniqueEmail();
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test User',
      email: e,
      password: TEST_PASSWORD,
      passwordConfirmation: TEST_PASSWORD,
    });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: e, password: TEST_PASSWORD });
  return {
    userId: loginRes.body.data.user.id,
    email: e,
    accessToken: loginRes.body.data.accessToken,
    refreshToken: loginRes.body.data.refreshToken,
  };
}

export async function cleanupUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

export async function getDefaultCategory(userId: string, type: 'INCOME' | 'EXPENSE') {
  const cat = await prisma.category.findFirst({
    where: { userId, type },
  });
  return cat!;
}
