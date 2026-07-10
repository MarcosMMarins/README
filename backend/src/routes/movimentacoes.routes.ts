import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { listar } from '../controllers/movimentacoes.controller';

const router = Router();

router.use(autenticar);
router.get('/', listar);

export default router;
