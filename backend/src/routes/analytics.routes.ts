import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';
import { cacheMiddleware } from '../middlewares/cache';
import { validate } from '../middlewares/validate';
import { monthlySpendingSchema, categoryBreakdownSchema, cashFlowSchema } from '../validators/analytics';

const router: Router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/dashboard', cacheMiddleware(60), controller.getDashboard);
router.get('/monthly-spending', cacheMiddleware(60), validate(monthlySpendingSchema), controller.getMonthlySpending);
router.get('/category-breakdown', cacheMiddleware(60), validate(categoryBreakdownSchema), controller.getCategoryBreakdown);
router.get('/cash-flow', cacheMiddleware(60), validate(cashFlowSchema), controller.getCashFlow);
router.get('/net-worth', cacheMiddleware(60), controller.getNetWorth);
router.get('/overview', cacheMiddleware(60), controller.getOverview);

export default router;
