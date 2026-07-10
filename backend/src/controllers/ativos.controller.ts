import { Response, NextFunction } from 'express';
import { Ativo } from '../models/Ativo.model';
import { Movimentacao } from '../models/Movimentacao.model';
import { Usuario } from '../models/Usuario.model';
import { AuthRequest, AtivosQuery } from '../types';
import { AppError } from '../middleware/error.middleware';

// Gera código sequencial — MOB-001, MOB-002, etc.
async function gerarCodigo(): Promise<string> {
  const ultimo = await Ativo.findOne({}, 'codigo').sort({ createdAt: -1 });
  if (!ultimo?.codigo) return 'MOB-001';
  const num = parseInt(ultimo.codigo.replace(/\D/g, ''), 10);
  return `MOB-${String(num + 1).padStart(3, '0')}`;
}

// GET /api/ativos
export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '20', busca, categoria, status } = req.query as AtivosQuery;

    const filtro: Record<string, unknown> = {};

    if (busca) {
      const re = new RegExp(busca, 'i');
      filtro.$or = [
        { nome: re }, { codigo: re }, { numeroSerie: re }, { marca: re }, { modelo: re },
      ];
    }
    if (categoria) filtro.categoria = categoria;
    if (status) filtro.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Ativo.find(filtro)
        .populate('custodiaAtual', 'nome email departamento cargo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Ativo.countDocuments(filtro),
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

// GET /api/ativos/:id
export async function buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ativo = await Ativo.findById(req.params.id)
      .populate('custodiaAtual', 'nome email departamento cargo');

    if (!ativo) throw new AppError('Ativo não encontrado.', 404);

    res.json({ success: true, data: ativo });
  } catch (err) {
    next(err);
  }
}

// POST /api/ativos
export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const codigo = await gerarCodigo();
    const ativo = await Ativo.create({ ...req.body, codigo });

    await Movimentacao.create({
      ativo: ativo._id,
      tipo: 'cadastro',
      descricao: `Ativo ${ativo.codigo} — "${ativo.nome}" cadastrado no sistema.`,
      realizadoPor: req.user!.id,
    });

    res.status(201).json({ success: true, data: ativo });
  } catch (err) {
    next(err);
  }
}

// PUT /api/ativos/:id
export async function atualizar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Não permite alterar o código via PUT
    const { codigo: _ignorar, ...corpo } = req.body;

    const ativo = await Ativo.findByIdAndUpdate(
      req.params.id,
      corpo,
      { new: true, runValidators: true }
    ).populate('custodiaAtual', 'nome email');

    if (!ativo) throw new AppError('Ativo não encontrado.', 404);

    await Movimentacao.create({
      ativo: ativo._id,
      tipo: 'atualizacao',
      descricao: `Dados do ativo ${ativo.codigo} — "${ativo.nome}" atualizados.`,
      realizadoPor: req.user!.id,
    });

    res.json({ success: true, data: ativo });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/ativos/:id  →  baixa (soft-delete)
export async function darBaixa(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { motivo } = req.body as { motivo?: string };

    const ativo = await Ativo.findByIdAndUpdate(
      req.params.id,
      { status: 'baixado', custodiaAtual: undefined },
      { new: true }
    );

    if (!ativo) throw new AppError('Ativo não encontrado.', 404);

    await Movimentacao.create({
      ativo: ativo._id,
      tipo: 'baixa',
      descricao: `Ativo ${ativo.codigo} — "${ativo.nome}" baixado do inventário.`,
      observacao: motivo,
      realizadoPor: req.user!.id,
    });

    res.json({ success: true, data: ativo, message: 'Ativo baixado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/ativos/:id/custodiar
export async function custodiar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { usuarioId, observacao } = req.body as { usuarioId?: string | null; observacao?: string };

    // Carrega o ativo com custódia atual para gerar o log correto
    const ativoAtual = await Ativo.findById(req.params.id);
    if (!ativoAtual) throw new AppError('Ativo não encontrado.', 404);

    // Valida o usuário destino se fornecido
    if (usuarioId) {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario || !usuario.ativo) {
        throw new AppError('Usuário não encontrado ou inativo.', 400);
      }
    }

    const anteriorId = ativoAtual.custodiaAtual?.toString();

    const ativo = await Ativo.findByIdAndUpdate(
      req.params.id,
      { custodiaAtual: usuarioId || undefined },
      { new: true }
    ).populate('custodiaAtual', 'nome email departamento cargo');

    if (!ativo) throw new AppError('Ativo não encontrado.', 404);

    // Determina o tipo e a descrição do log
    let descricao: string;
    if (!usuarioId) {
      descricao = `Custódia do ativo ${ativo.codigo} liberada.`;
    } else if (anteriorId) {
      descricao = `Custódia do ativo ${ativo.codigo} transferida.`;
    } else {
      descricao = `Custódia do ativo ${ativo.codigo} atribuída.`;
    }

    await Movimentacao.create({
      ativo: ativo._id,
      tipo: anteriorId && usuarioId ? 'transferencia' : 'atualizacao',
      descricao,
      observacao,
      responsavelAnterior: anteriorId || undefined,
      responsavelNovo: usuarioId || undefined,
      realizadoPor: req.user!.id,
    });

    res.json({ success: true, data: ativo });
  } catch (err) {
    next(err);
  }
}
