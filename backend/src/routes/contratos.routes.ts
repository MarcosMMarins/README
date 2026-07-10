import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import {
  listar, resumo, buscarPorId, criar, atualizar, remover,
} from '../controllers/contratos.controller';

const router = Router();

router.use(autenticar);

router.get('/resumo', resumo);       // antes de /:id para não conflitar
router.get('/',       listar);
router.get('/:id',    buscarPorId);
router.post('/',      criar);
router.put('/:id',    atualizar);
router.delete('/:id', remover);

export default router;
