import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';

const router: Router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/dashboard', controller.getDashboard);
router.get('/monthly-spending', controller.getMonthlySpending);
router.get('/category-breakdown', controller.getCategoryBreakdown);
router.get('/cash-flow', controller.getCashFlow);
router.get('/net-worth', controller.getNetWorth);
router.get('/overview', controller.getOverview);

export default router;
