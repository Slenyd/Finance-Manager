import request from 'supertest';
import app from '../app';
import { registerTestUser, cleanupUser } from './helpers';
import { prisma } from '../config/database';

describe('Notifications API', () => {
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

  it('should list notifications (empty for new user)', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.unreadCount).toBe(0);
  });

  it('should mark a notification as read', async () => {
    const notif = await prisma.notification.create({
      data: { userId, title: 'Test', message: 'Test message' },
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notif.id}/read`)
      .set(auth());
    expect(res.status).toBe(200);

    const updated = await prisma.notification.findUnique({ where: { id: notif.id } });
    expect(updated!.isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    await prisma.notification.createMany({
      data: [
        { userId, title: 'A', message: 'Msg A', isRead: false },
        { userId, title: 'B', message: 'Msg B', isRead: false },
      ],
    });

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set(auth());
    expect(res.status).toBe(200);

    const unread = await prisma.notification.count({ where: { userId, isRead: false } });
    expect(unread).toBe(0);
  });

  it('should delete a notification', async () => {
    const notif = await prisma.notification.create({
      data: { userId, title: 'Delete Me', message: 'Bye' },
    });

    const res = await request(app)
      .delete(`/api/v1/notifications/${notif.id}`)
      .set(auth());
    expect(res.status).toBe(200);

    const deleted = await prisma.notification.findUnique({ where: { id: notif.id } });
    expect(deleted).toBeNull();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});
