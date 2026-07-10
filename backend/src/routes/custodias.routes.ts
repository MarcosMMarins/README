import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { resumo } from '../controllers/custodias.controller';

const router = Router();

router.use(autenticar);
router.get('/resumo', resumo);

export default router;
