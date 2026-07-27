import { Router } from 'express';
import { CronController } from '../controllers/cron.controller';
import { cronLimiter } from '../middlewares/rateLimiter';

const router: Router = Router();
const controller = new CronController();

router.post('/recurring', cronLimiter, controller.processRecurring);

export default router;