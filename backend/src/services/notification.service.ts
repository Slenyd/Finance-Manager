import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { Notification, NotificationQuery, NotificationMeta } from '../interfaces';
import { parsePagination } from '../utils/helpers';

export class NotificationService {
  async findAll(userId: string, query: NotificationQuery): Promise<{ data: Notification[]; meta: NotificationMeta }> {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.NotificationWhereInput = { userId };

    const [notifications, unreadResult, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.aggregate({
        where: { userId, isRead: false },
        _count: true,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || (total > 0 ? 1 : 0),
        unreadCount: unreadResult._count,
      },
    };
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