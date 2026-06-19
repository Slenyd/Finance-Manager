import { Response } from 'express';
import { NotificationService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const notificationService = new NotificationService();

export class NotificationController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const { notifications, unreadCount } = await notificationService.findAll(req.user!.id, limit);
    res.json({ success: true, data: notifications, meta: { unreadCount } });
  });

  markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.markAsRead(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  });

  markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.delete(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  });
}
