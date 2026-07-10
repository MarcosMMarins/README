import { Router } from 'express';
import { autenticar, apenasAdmin } from '../middleware/auth.middleware';
import {
  listar, buscarPorId, criar, atualizar, trocarSenha, alterarStatus,
} from '../controllers/usuarios.controller';

const router = Router();

router.use(autenticar);

router.get('/',               listar);
router.get('/:id',            buscarPorId);
router.post('/',   apenasAdmin, criar);
router.put('/:id', apenasAdmin, atualizar);
router.patch('/:id/senha',    trocarSenha);       // próprio usuário ou admin
router.patch('/:id/status', apenasAdmin, alterarStatus);

export default router;
