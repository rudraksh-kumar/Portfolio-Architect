import { Router } from 'express';
import multer from 'multer';
import { AuthController } from './controllers/auth.js';
import { PortfolioController } from './controllers/portfolio.js';
import { authMiddleware } from './middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit PDF to 5MB
});

const router = Router();

// Authentication Routes
router.post('/auth/signup', AuthController.signup);
router.post('/auth/login', AuthController.login);

// Private Portfolio Configuration Routes
router.post('/portfolio/generate', authMiddleware, upload.single('resume'), PortfolioController.generate);
router.get('/portfolio/me', authMiddleware, PortfolioController.getMe);
router.put('/portfolio/me', authMiddleware, PortfolioController.updateMe);
router.get('/portfolio/analytics', authMiddleware, PortfolioController.getAnalytics);

// Public Portfolio Access Routes
router.get('/portfolio/p/:slug', PortfolioController.getPublic);
router.post('/portfolio/p/:slug/chat', PortfolioController.chatCopilot);

export default router;
