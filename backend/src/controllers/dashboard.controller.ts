import { Response, NextFunction } from 'express';
import { Ativo } from '../models/Ativo.model';
import { Contrato } from '../models/Contrato.model';
import { Movimentacao } from '../models/Movimentacao.model';
import { Usuario } from '../models/Usuario.model';
import { AuthRequest } from '../types';

export async function obterDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const d7   = new Date(hoje); d7.setDate(d7.getDate() + 7);
    const d30  = new Date(hoje); d30.setDate(d30.getDate() + 30);

    const [
      totalAtivos,
      ativosSemCustodia,
      porStatus,
      porCategoria,
      valorAggreg,
      movimentacoes,
      totalUsuarios,
      totalContratos,
      contratosVencidos,
      contratosCriticos,
      contratosAtencao,
      contratosAlerta,
    ] = await Promise.all([
      // Ativos não baixados
      Ativo.countDocuments({ status: { $ne: 'baixado' } }),
      // Sem custódia (excluindo baixados)
      Ativo.countDocuments({ status: { $ne: 'baixado' }, custodiaAtual: { $exists: false } }),
      // Agrupamento por status (todos os ativos)
      Ativo.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
      // Agrupamento por categoria (excluindo baixados)
      Ativo.aggregate([
        { $match: { status: { $ne: 'baixado' } } },
        { $group: { _id: '$categoria', total: { $sum: 1 } } },
      ]),
      // Valor total do parque (excluindo baixados)
      Ativo.aggregate([
        { $match: { status: { $ne: 'baixado' }, valorAquisicao: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$valorAquisicao' } } },
      ]),
      // Últimas 8 movimentações
      Movimentacao.find()
        .populate('ativo',        'codigo nome')
        .populate('realizadoPor', 'nome')
        .sort({ createdAt: -1 })
        .limit(8),
      // Usuários ativos
      Usuario.countDocuments({ ativo: true }),
      // Contratos
      Contrato.countDocuments(),
      Contrato.countDocuments({ dataVencimento: { $lt: hoje } }),
      Contrato.countDocuments({ dataVencimento: { $gte: hoje, $lte: d7 } }),
      Contrato.countDocuments({ dataVencimento: { $gte: hoje, $lte: d30 } }),
      // Contratos vencendo em 15 dias
      Contrato.find({ dataVencimento: { $gte: hoje, $lte: new Date(hoje.getTime() + 15 * 86_400_000) } })
        .populate('ativo', 'codigo nome')
        .sort({ dataVencimento: 1 })
        .limit(5),
    ]);

    const ativosPorStatus    = porStatus.reduce((acc: Record<string, number>, v) => ({ ...acc, [v._id]: v.total }), {});
    const ativosPorCategoria = porCategoria.reduce((acc: Record<string, number>, v) => ({ ...acc, [v._id]: v.total }), {});

    res.json({
      success: true,
      data: {
        totalAtivos,
        ativosSemCustodia,
        valorTotalParque: valorAggreg[0]?.total ?? 0,
        totalUsuarios,
        ativosPorStatus,
        ativosPorCategoria,
        contratos: {
          total:    totalContratos,
          vencidos: contratosVencidos,
          criticos: contratosCriticos,
          atencao:  contratosAtencao,
          alertas:  contratosAlerta,
        },
        movimentacoesRecentes: movimentacoes,
      },
    });
  } catch (err) {
    next(err);
  }
}
