import { Response } from 'express';
import { NotificationService } from '../services';
import { AuthorizedRequest, ApiResponse, Notification } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/errors';

const notificationService = new NotificationService();

export class NotificationController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=15');
    const limit = (req.query as { limit?: number }).limit ?? 50;
    const { notifications, unreadCount } = await notificationService.findAll(req.user.id, limit);
    res.json({ success: true, data: notifications, meta: { unreadCount } } satisfies ApiResponse<Notification[]>);
  });

  markAsRead = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    if (result.count === 0) {
      throw new NotFoundError('Notification');
    }
    res.json({ success: true, data: null, message: 'Notification marked as read' } satisfies ApiResponse<null>);
  });

  markAllAsRead = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, data: null, message: 'All notifications marked as read' } satisfies ApiResponse<null>);
  });

  delete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const result = await notificationService.delete(req.user.id, req.params.id);
    if (result.count === 0) {
      throw new NotFoundError('Notification');
    }
    res.json({ success: true, data: null, message: 'Notification deleted' } satisfies ApiResponse<null>);
  });
}