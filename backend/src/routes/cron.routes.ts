import { Router } from 'express';
import { CronController } from '../controllers/cron.controller';

const router: Router = Router();
const controller = new CronController();

router.post('/recurring', controller.processRecurring);

export default router;