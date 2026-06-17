import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router: Router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.findAll);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);
router.delete('/:id', controller.delete);

export default router;
