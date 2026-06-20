import { Response } from 'express';
import { NotificationService } from '../services';
import { AuthorizedRequest, ApiResponse, Notification, NotificationQuery } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/errors';

const notificationService = new NotificationService();

export class NotificationController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=15');
    const result = await notificationService.findAll(req.user.id, req.query as unknown as NotificationQuery);
    res.json({ success: true, data: result.data, meta: result.meta } satisfies ApiResponse<Notification[]>);
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