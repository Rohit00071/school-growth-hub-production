import { Router } from 'express';
import observationRoutes from './observationRoutes';
import authRoutes from './authRoutes';
import goalRoutes from './goalRoutes';
import moocSubmissionRoutes from './moocSubmissionRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/observations', observationRoutes);
router.use('/goals', goalRoutes);
router.use('/mooc-submissions', moocSubmissionRoutes);

export default router;
