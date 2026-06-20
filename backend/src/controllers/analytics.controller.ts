import { Response } from 'express';
import { AnalyticsService } from '../services';
import { AuthorizedRequest, ApiResponse, DashboardData, MonthlySpendingData, CategoryBreakdownData, NetWorthData, OverviewData } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  getDashboard = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=60');
    const data = await analyticsService.getDashboard(req.user.id);
    res.json({ success: true, data } satisfies ApiResponse<DashboardData>);
  });

  getMonthlySpending = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=120');
    const months = (req.query as { months?: number }).months ?? 6;
    const data = await analyticsService.getMonthlySpending(req.user.id, months);
    res.json({ success: true, data } satisfies ApiResponse<MonthlySpendingData[]>);
  });

  getCategoryBreakdown = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=120');
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await analyticsService.getCategoryBreakdown(req.user.id, startDate, endDate);
    res.json({ success: true, data } satisfies ApiResponse<CategoryBreakdownData[]>);
  });

  getCashFlow = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=300');
    const months = (req.query as { months?: number }).months ?? 12;
    const data = await analyticsService.getCashFlow(req.user.id, months);
    res.json({ success: true, data } satisfies ApiResponse<MonthlySpendingData[]>);
  });

  getNetWorth = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=60');
    const data = await analyticsService.getNetWorth(req.user.id);
    res.json({ success: true, data } satisfies ApiResponse<NetWorthData>);
  });

  getOverview = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=60');
    const data = await analyticsService.getOverview(req.user.id);
    res.json({ success: true, data } satisfies ApiResponse<OverviewData>);
  });
}