import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services';
import { AuthenticatedRequest } from '../interfaces';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboard(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlySpending(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await analyticsService.getMonthlySpending(req.user!.id, months);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await analyticsService.getCategoryBreakdown(req.user!.id, startDate, endDate);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCashFlow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const data = await analyticsService.getCashFlow(req.user!.id, months);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getNetWorth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getNetWorth(req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
