import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createTransactionSchema, updateTransactionSchema, bulkDeleteSchema, transactionQuerySchema } from '../validators/transaction';

const router: Router = Router();
const controller = new TransactionController();

router.use(authenticate);

router.get('/', validate(transactionQuerySchema), controller.findAll);
router.get('/summary', controller.getSummary);
router.get('/:id', controller.findById);
router.post('/', validate(createTransactionSchema), controller.create);
router.put('/:id', validate(updateTransactionSchema), controller.update);
router.post('/bulk-delete', validate(bulkDeleteSchema), controller.bulkDelete);
router.delete('/:id', controller.delete);

export default router;
