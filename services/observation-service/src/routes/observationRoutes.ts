import { Router } from 'express';
import { observationController } from '../controllers/observationController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

// Stats
router.get('/stats/:teacherId', observationController.getStats);

// List by teacher/observer
router.get('/teacher/:teacherId', observationController.getByTeacher);
router.get('/observer/:observerId', observationController.getByObserver);

// CRUD
router.get('/:id', observationController.getById);
router.post('/', observationController.create);
router.patch('/:id', observationController.update);
router.delete('/:id', observationController.delete);

export default router;
