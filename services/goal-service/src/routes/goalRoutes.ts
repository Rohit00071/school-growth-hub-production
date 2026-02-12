import { Router } from 'express';
import { goalController } from '../controllers/goalController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/teacher/:teacherId', goalController.getByTeacher);
router.get('/:id', goalController.getById);
router.post('/', goalController.create);
router.patch('/:id', goalController.update);
router.delete('/:id', goalController.delete);

export default router;
