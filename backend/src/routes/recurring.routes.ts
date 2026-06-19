import { Router } from 'express';
import { RecurringController } from '../controllers/recurring.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createRecurringSchema, updateRecurringSchema } from '../validators/recurring';

const router: Router = Router();
const controller = new RecurringController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', validate(createRecurringSchema), controller.create);
router.patch('/:id', validate(updateRecurringSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;