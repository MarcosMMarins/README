'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Contrato, PaginatedResponse, ApiResponse } from '@/types';

export interface FiltrosContrato {
  page?: number;
  limit?: number;
  tipo?: string;
  ativoId?: string;
  vencimento?: string; // 'vencido' | '7' | '30'
}

export interface CriarContratoDTO {
  ativo: string;
  tipo: string;
  fornecedor: string;
  numeroContrato?: string;
  dataInicio: string;
  dataVencimento: string;
  valorMensal?: number;
  observacoes?: string;
}

interface ResumoContratos {
  total: number;
  vencidos: number;
  criticos: number;
  atencao: number;
}

export function useContratos(filtros: FiltrosContrato = {}) {
  return useQuery({
    queryKey: ['contratos', filtros],
    queryFn: () =>
      api.get<PaginatedResponse<Contrato>>('/api/contratos', { params: filtros })
        .then(r => r.data),
  });
}

export function useContrato(id: string | null) {
  return useQuery({
    queryKey: ['contratos', id],
    queryFn: () =>
      api.get<ApiResponse<Contrato>>(`/api/contratos/${id}`).then(r => r.data.data!),
    enabled: !!id,
  });
}

export function useResumoContratos() {
  return useQuery({
    queryKey: ['contratos', 'resumo'],
    queryFn: () =>
      api.get<ApiResponse<ResumoContratos>>('/api/contratos/resumo').then(r => r.data.data!),
  });
}

export function useContratosAtivo(ativoId: string | null) {
  return useQuery({
    queryKey: ['contratos', 'ativo', ativoId],
    queryFn: () =>
      api.get<{ success: boolean; data: Contrato[]; total: number }>(
        `/api/ativos/${ativoId}/contratos`
      ).then(r => r.data),
    enabled: !!ativoId,
  });
}

export function useCriarContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarContratoDTO) =>
      api.post<ApiResponse<Contrato>>('/api/contratos', dados).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  });
}

export function useAtualizarContrato(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: Partial<CriarContratoDTO>) =>
      api.put<ApiResponse<Contrato>>(`/api/contratos/${id}`, dados).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  });
}

export function useRemoverContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/contratos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  });
}
