import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth';

const router: Router = Router();
const controller = new UploadController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.use(authenticate);

router.get('/receipt', controller.getReceipt);
router.post('/receipt', upload.single('file'), controller.uploadReceipt);
router.post('/receipt/delete', controller.deleteReceipt);

export default router;