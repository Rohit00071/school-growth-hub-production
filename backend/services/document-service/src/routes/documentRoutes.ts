import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', documentController.list);
router.get('/:id', documentController.getById);
router.post('/', restrictTo('ADMIN', 'SUPERADMIN', 'MANAGEMENT'), documentController.create);
router.post('/:id/acknowledge', documentController.acknowledge);
router.get('/teacher/:teacherId', documentController.getTeacherAcks);

export default router;
