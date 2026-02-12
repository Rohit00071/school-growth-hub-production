import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/stats', restrictTo('ADMIN', 'SUPERADMIN'), analyticsController.getStats);
router.get('/:name', analyticsController.getByName);
router.post('/track', analyticsController.track);

export default router;
