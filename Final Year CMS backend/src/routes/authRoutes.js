import express from 'express';
import { loginUser, forgotPassword, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
export default router;