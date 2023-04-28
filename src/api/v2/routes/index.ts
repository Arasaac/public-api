import { Router } from 'express';
import keywords from './keywords'

export const router = Router();

router.use('/keywords', keywords)

export default router
