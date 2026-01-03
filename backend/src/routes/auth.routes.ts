import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshTokenController,
  getCurrentUserController,
  logoutController,
} from '../controllers/auth.controller.js';
import { registerValidator, loginValidator, refreshTokenValidator } from '../validators/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { sessionMiddleware } from '../middleware/session.middleware.js';
const router = Router();

router.post('/register', registerValidator, registerController);
router.post('/login', loginValidator, loginController);
router.post('/refresh', refreshTokenValidator, refreshTokenController);
router.get('/me', requireAuth, getCurrentUserController);
router.post('/logout', requireAuth, sessionMiddleware, logoutController);
export default router;
