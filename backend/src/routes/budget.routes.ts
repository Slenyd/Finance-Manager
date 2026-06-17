import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget';

const router: Router = Router();
const controller = new BudgetController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', validate(createBudgetSchema), controller.create);
router.put('/:id', validate(updateBudgetSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
