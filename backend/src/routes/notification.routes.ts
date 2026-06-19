import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { getNotificationsSchema } from '../validators/notification';

const router: Router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', validate(getNotificationsSchema), controller.findAll);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);
router.delete('/:id', controller.delete);

export default router;
