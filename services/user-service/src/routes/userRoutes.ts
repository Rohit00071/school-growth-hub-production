import { Router } from 'express';
import * as userController from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

router.use(restrictTo('ADMIN', 'SUPERADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.delete('/:id', userController.deleteUser);
// router.patch('/:id', userController.updateUser); // Admin updating user

export default router;
