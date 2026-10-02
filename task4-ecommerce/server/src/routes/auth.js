import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, session, me, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateLogin, validatePasswordChange, validateProfile, validateRegister } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.get('/session', session);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validateProfile, updateProfile);
router.post('/change-password', requireAuth, authLimiter, validatePasswordChange, changePassword);

export default router;
