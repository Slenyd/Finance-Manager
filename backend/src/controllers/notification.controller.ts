import { Response, NextFunction } from 'express';
import { NotificationService } from '../services';
import { AuthenticatedRequest } from '../interfaces';

const notificationService = new NotificationService();

export class NotificationController {
  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.findAll(req.user!.id);
      const unreadCount = await notificationService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: notifications, meta: { unreadCount } });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.delete(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }
}
