import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { listar, buscarPorId, criar, atualizar, darBaixa, custodiar } from '../controllers/ativos.controller';
import { porAtivo as movimentacoesDoAtivo } from '../controllers/movimentacoes.controller';
import { porAtivo as contratosDoAtivo } from '../controllers/contratos.controller';

const router = Router();

// Todas as rotas exigem autenticação
router.use(autenticar);

router.get('/',                         listar);
router.get('/:id',                      buscarPorId);
router.get('/:id/movimentacoes',        movimentacoesDoAtivo);
router.get('/:id/contratos',            contratosDoAtivo);
router.post('/',             criar);
router.put('/:id',           atualizar);
router.put('/:id/custodiar', custodiar);
router.delete('/:id',        darBaixa);

export default router;
