import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshTokenController,
} from '../controllers/auth.controller.js';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
} from '../validators/auth.js';

const router = Router();

router.post('/register', registerValidator, registerController);
router.post('/login', loginValidator, loginController);
router.post('/refresh', refreshTokenValidator, refreshTokenController);

export default router;

