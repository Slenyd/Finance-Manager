import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createGoalSchema, updateGoalSchema } from '../validators/goal';

const router: Router = Router();
const controller = new GoalController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', validate(createGoalSchema), controller.create);
router.put('/:id', validate(updateGoalSchema), controller.update);
router.delete('/:id', controller.delete);
router.post('/:id/contribute', controller.contribute);

export default router;
