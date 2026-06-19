import { Response } from 'express';
import { AnalyticsService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=60');
    const data = await analyticsService.getDashboard(req.user!.id);
    res.json({ success: true, data });
  });

  getMonthlySpending = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=120');
    const months = req.query.months as unknown as number;
    const data = await analyticsService.getMonthlySpending(req.user!.id, months);
    res.json({ success: true, data });
  });

  getCategoryBreakdown = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=120');
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await analyticsService.getCategoryBreakdown(req.user!.id, startDate, endDate);
    res.json({ success: true, data });
  });

  getCashFlow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=300');
    const months = req.query.months as unknown as number;
    const data = await analyticsService.getCashFlow(req.user!.id, months);
    res.json({ success: true, data });
  });

  getNetWorth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=60');
    const data = await analyticsService.getNetWorth(req.user!.id);
    res.json({ success: true, data });
  });

  getOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=60');
    const data = await analyticsService.getOverview(req.user!.id);
    res.json({ success: true, data });
  });
}
