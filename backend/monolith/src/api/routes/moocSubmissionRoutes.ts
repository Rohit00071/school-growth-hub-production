import { Router } from 'express';
import {
    createMoocSubmissionEntry,
    getAllMoocSubmissions,
    reviewMoocSubmission,
} from '../controllers/moocSubmissionController';

const router = Router();

router.get('/', getAllMoocSubmissions);
router.post('/', createMoocSubmissionEntry);
router.patch('/:id/review', reviewMoocSubmission);

export default router;
