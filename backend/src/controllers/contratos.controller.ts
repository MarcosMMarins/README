import { Response, NextFunction } from 'express';
import { Contrato } from '../models/Contrato.model';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

// Calcula dias até o vencimento e classifica o status
function statusVencimento(dataVencimento: Date) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.floor(
    (new Date(dataVencimento).setHours(0, 0, 0, 0) - hoje.getTime()) / 86_400_000
  );
  if (dias < 0)  return { status: 'vencido',  diasParaVencer: dias };
  if (dias <= 7)  return { status: 'critico',  diasParaVencer: dias };
  if (dias <= 15) return { status: 'alerta',   diasParaVencer: dias };
  if (dias <= 30) return { status: 'atencao',  diasParaVencer: dias };
  return              { status: 'normal',   diasParaVencer: dias };
}

function enriquecerContrato(c: any) {
  const sv = statusVencimento(c.dataVencimento);
  return { ...c.toObject(), ...sv };
}

// GET /api/contratos
export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '20', tipo, ativoId, vencimento } = req.query as Record<string, string>;

    const filtro: Record<string, unknown> = {};
    if (tipo)    filtro.tipo  = tipo;
    if (ativoId) filtro.ativo = ativoId;

    if (vencimento) {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      if (vencimento === 'vencido') {
        filtro.dataVencimento = { $lt: hoje };
      } else {
        const dias = parseInt(vencimento);
        const limite = new Date(hoje);
        limite.setDate(limite.getDate() + dias);
        filtro.dataVencimento = { $gte: hoje, $lte: limite };
      }
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [contratos, total] = await Promise.all([
      Contrato.find(filtro)
        .populate('ativo', 'codigo nome categoria status')
        .sort({ dataVencimento: 1 })
        .skip(skip)
        .limit(limitNum),
      Contrato.countDocuments(filtro),
    ]);

    res.json({
      success: true,
      data: contratos.map(enriquecerContrato),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/contratos/resumo  — contagens por status (para dashboard e alertas)
export async function resumo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const d7   = new Date(hoje); d7.setDate(d7.getDate() + 7);
    const d30  = new Date(hoje); d30.setDate(d30.getDate() + 30);

    const [total, vencidos, criticos, atencao] = await Promise.all([
      Contrato.countDocuments(),
      Contrato.countDocuments({ dataVencimento: { $lt: hoje } }),
      Contrato.countDocuments({ dataVencimento: { $gte: hoje, $lte: d7 } }),
      Contrato.countDocuments({ dataVencimento: { $gte: hoje, $lte: d30 } }),
    ]);

    res.json({ success: true, data: { total, vencidos, criticos, atencao } });
  } catch (err) {
    next(err);
  }
}

// GET /api/contratos/:id
export async function buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const contrato = await Contrato.findById(req.params.id)
      .populate('ativo', 'codigo nome categoria status');

    if (!contrato) throw new AppError('Contrato não encontrado.', 404);
    res.json({ success: true, data: enriquecerContrato(contrato) });
  } catch (err) {
    next(err);
  }
}

// GET /api/ativos/:id/contratos  (chamado via ativos.routes)
export async function porAtivo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const contratos = await Contrato.find({ ativo: req.params.id })
      .sort({ dataVencimento: 1 });

    res.json({
      success: true,
      data: contratos.map(enriquecerContrato),
      total: contratos.length,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/contratos
export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const contrato = await Contrato.create(req.body);
    await contrato.populate('ativo', 'codigo nome');
    res.status(201).json({ success: true, data: enriquecerContrato(contrato) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/contratos/:id
export async function atualizar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const contrato = await Contrato.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('ativo', 'codigo nome');

    if (!contrato) throw new AppError('Contrato não encontrado.', 404);
    res.json({ success: true, data: enriquecerContrato(contrato) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/contratos/:id
export async function remover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const contrato = await Contrato.findByIdAndDelete(req.params.id);
    if (!contrato) throw new AppError('Contrato não encontrado.', 404);
    res.json({ success: true, message: 'Contrato removido com sucesso.' });
  } catch (err) {
    next(err);
  }
}
