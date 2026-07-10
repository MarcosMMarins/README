'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Ativo, PaginatedResponse, ApiResponse } from '@/types';

export interface FiltrosAtivo {
  page?: number;
  limit?: number;
  busca?: string;
  categoria?: string;
  status?: string;
}

export interface CriarAtivoDTO {
  nome: string;
  descricao?: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valorAquisicao?: number;
  dataAquisicao?: string;
  status: string;
  localizacao?: { unidade?: string; sala?: string };
}

// Lista paginada com filtros
export function useAtivos(filtros: FiltrosAtivo = {}) {
  return useQuery({
    queryKey: ['ativos', filtros],
    queryFn: () =>
      api.get<PaginatedResponse<Ativo>>('/api/ativos', { params: filtros })
        .then(r => r.data),
  });
}

// Único ativo por ID
export function useAtivo(id: string | null) {
  return useQuery({
    queryKey: ['ativos', id],
    queryFn: () =>
      api.get<ApiResponse<Ativo>>(`/api/ativos/${id}`).then(r => r.data.data!),
    enabled: !!id,
  });
}

// Criar ativo
export function useCriarAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarAtivoDTO) =>
      api.post<ApiResponse<Ativo>>('/api/ativos', dados).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ativos'] }),
  });
}

// Atualizar ativo
export function useAtualizarAtivo(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: Partial<CriarAtivoDTO>) =>
      api.put<ApiResponse<Ativo>>(`/api/ativos/${id}`, dados).then(r => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ativos'] });
      qc.invalidateQueries({ queryKey: ['ativos', id] });
    },
  });
}

// Dar baixa no ativo
export function useDarBaixa(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (motivo?: string) =>
      api.delete<ApiResponse<Ativo>>(`/api/ativos/${id}`, { data: { motivo } })
        .then(r => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ativos'] });
      qc.invalidateQueries({ queryKey: ['ativos', id] });
    },
  });
}
