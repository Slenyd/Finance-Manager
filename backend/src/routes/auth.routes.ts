import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema, updatePreferencesSchema } from '../validators/auth';

const router: Router = Router();
const controller = new AuthController();

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/logout', authLimiter, controller.logout);
router.post('/refresh', authLimiter, validate(refreshSchema), controller.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);

router.use(authenticate);

router.get('/me', controller.getProfile);
router.put('/profile', validate(updateProfileSchema), controller.updateProfile);
router.put('/password', validate(changePasswordSchema), controller.changePassword);
router.put('/preferences', validate(updatePreferencesSchema), controller.updatePreferences);
router.delete('/account', controller.deleteAccount);

export default router;