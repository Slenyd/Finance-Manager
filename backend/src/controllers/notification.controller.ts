import { Response } from 'express';
import { NotificationService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/errors';

const notificationService = new NotificationService();

export class NotificationController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = req.query.limit as unknown as number;
    const { notifications, unreadCount } = await notificationService.findAll(req.user!.id, limit);
    res.json({ success: true, data: notifications, meta: { unreadCount } });
  });

  markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.markAsRead(req.user!.id, req.params.id);
    if (result.count === 0) {
      throw new NotFoundError('Notification');
    }
    res.json({ success: true, data: null, message: 'Notification marked as read' });
  });

  markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, data: null, message: 'All notifications marked as read' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.delete(req.user!.id, req.params.id);
    if (result.count === 0) {
      throw new NotFoundError('Notification');
    }
    res.json({ success: true, data: null, message: 'Notification deleted' });
  });
}
