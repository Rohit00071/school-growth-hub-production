import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/user/:userId', (req: any, res, next) => {
    // Only allow users to see their own notifications unless admin
    if (req.user.id !== req.params.userId && !['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    notificationController.getByUser(req, res, next);
});
router.post('/', notificationController.create);
router.patch('/:id/read', notificationController.markRead);
router.patch('/user/:userId/read-all', notificationController.markAllRead);
router.delete('/:id', notificationController.delete);

export default router;
