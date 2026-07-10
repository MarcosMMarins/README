'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Movimentacao, PaginatedResponse } from '@/types';

export interface FiltrosMovimentacao {
  page?: number;
  limit?: number;
  tipo?: string;
  ativoId?: string;
  de?: string;
  ate?: string;
}

interface ListaSimples {
  success: boolean;
  data: Movimentacao[];
  total: number;
}

// Lista global com filtros e paginação
export function useMovimentacoes(filtros: FiltrosMovimentacao = {}) {
  return useQuery({
    queryKey: ['movimentacoes', filtros],
    queryFn: () =>
      api.get<PaginatedResponse<Movimentacao>>('/api/movimentacoes', { params: filtros })
        .then(r => r.data),
  });
}

// Movimentações de um ativo específico
export function useMovimentacoesAtivo(ativoId: string | null, limit = 20) {
  return useQuery({
    queryKey: ['movimentacoes', 'ativo', ativoId, limit],
    queryFn: () =>
      api.get<ListaSimples>(`/api/ativos/${ativoId}/movimentacoes`, { params: { limit } })
        .then(r => r.data),
    enabled: !!ativoId,
  });
}
