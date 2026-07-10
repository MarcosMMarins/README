import { Response, NextFunction } from 'express';
import { Ativo } from '../models/Ativo.model';
import { AuthRequest } from '../types';

// GET /api/custodias/resumo
// Retorna todos os ativos (não baixados) agrupados por responsável.
export async function resumo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ativos = await Ativo.find({ status: { $ne: 'baixado' } })
      .populate('custodiaAtual', 'nome email departamento cargo')
      .sort({ nome: 1 });

    type EntradaCustodia = {
      usuario: Record<string, unknown>;
      ativos: typeof ativos;
      total: number;
      valorTotal: number;
    };

    const mapa = new Map<string, EntradaCustodia>();
    const semCustodia: typeof ativos = [];

    for (const a of ativos) {
      if (!a.custodiaAtual) {
        semCustodia.push(a);
      } else {
        const uid = (a.custodiaAtual as any)._id.toString();
        if (!mapa.has(uid)) {
          mapa.set(uid, {
            usuario: a.custodiaAtual as any,
            ativos: [],
            total: 0,
            valorTotal: 0,
          });
        }
        const entry = mapa.get(uid)!;
        entry.ativos.push(a);
        entry.total++;
        entry.valorTotal += a.valorAquisicao ?? 0;
      }
    }

    const custodias = Array.from(mapa.values())
      .sort((a, b) =>
        (a.usuario.nome as string).localeCompare(b.usuario.nome as string, 'pt-BR')
      );

    res.json({
      success: true,
      data: {
        custodias,
        semCustodia: {
          ativos: semCustodia,
          total: semCustodia.length,
          valorTotal: semCustodia.reduce((s, a) => s + (a.valorAquisicao ?? 0), 0),
        },
        totais: {
          responsaveis: custodias.length,
          comCustodia: ativos.length - semCustodia.length,
          semCustodia: semCustodia.length,
          total: ativos.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
