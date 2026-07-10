import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { obterDashboard } from '../controllers/dashboard.controller';

const router = Router();

router.use(autenticar);
router.get('/', obterDashboard);

export default router;
