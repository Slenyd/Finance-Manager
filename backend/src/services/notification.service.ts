import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { Notification } from '../interfaces';

export class NotificationService {
  async findAll(userId: string, limit = 50): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const [notifications, unreadResult] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.aggregate({
        where: { userId, isRead: false },
        _count: true,
      }),
    ]);
    return { notifications, unreadCount: unreadResult._count };
  }

  async markAsRead(userId: string, id: string): Promise<{ count: number }> {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(userId: string, title: string, message: string, type: NotificationType = 'INFO'): Promise<Notification> {
    return prisma.notification.create({
      data: { userId, title, message, type },
    });
  }

  async delete(userId: string, id: string): Promise<{ count: number }> {
    return prisma.notification.deleteMany({ where: { id, userId } });
  }
}