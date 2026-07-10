import { Response, NextFunction } from 'express';
import { Movimentacao } from '../models/Movimentacao.model';
import { AuthRequest } from '../types';

const POPULATE_PADRAO = [
  { path: 'ativo',               select: 'codigo nome categoria' },
  { path: 'realizadoPor',        select: 'nome email' },
  { path: 'responsavelAnterior', select: 'nome' },
  { path: 'responsavelNovo',     select: 'nome' },
];

// GET /api/movimentacoes
export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      page = '1', limit = '25',
      tipo, ativoId, realizadoPorId,
      de, ate,
    } = req.query as Record<string, string | undefined>;

    const filtro: Record<string, unknown> = {};
    if (tipo)          filtro.tipo  = tipo;
    if (ativoId)       filtro.ativo = ativoId;
    if (realizadoPorId) filtro.realizadoPor = realizadoPorId;

    if (de || ate) {
      filtro.createdAt = {
        ...(de  ? { $gte: new Date(de) }                        : {}),
        ...(ate ? { $lte: new Date(`${ate}T23:59:59.999Z`) }    : {}),
      };
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Movimentacao.find(filtro)
        .populate(POPULATE_PADRAO)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Movimentacao.countDocuments(filtro),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/ativos/:id/movimentacoes  (sub-recurso — chamado pelo ativos.routes)
export async function porAtivo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { limit = '20' } = req.query as Record<string, string>;

    const data = await Movimentacao.find({ ativo: req.params.id })
      .populate([
        { path: 'realizadoPor',        select: 'nome email' },
        { path: 'responsavelAnterior', select: 'nome' },
        { path: 'responsavelNovo',     select: 'nome' },
      ])
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    next(err);
  }
}
