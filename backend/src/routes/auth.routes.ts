import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { autenticar } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', autenticar, me);

export default router;
