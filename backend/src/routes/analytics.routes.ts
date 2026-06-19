import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { monthlySpendingSchema, categoryBreakdownSchema, cashFlowSchema } from '../validators/analytics';

const router: Router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/dashboard', controller.getDashboard);
router.get('/monthly-spending', validate(monthlySpendingSchema), controller.getMonthlySpending);
router.get('/category-breakdown', validate(categoryBreakdownSchema), controller.getCategoryBreakdown);
router.get('/cash-flow', validate(cashFlowSchema), controller.getCashFlow);
router.get('/net-worth', controller.getNetWorth);
router.get('/overview', controller.getOverview);

export default router;
