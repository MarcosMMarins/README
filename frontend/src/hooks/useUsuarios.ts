'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Usuario, ApiResponse } from '@/types';

interface ListaUsuariosResponse {
  success: boolean;
  data: Usuario[];
  total: number;
}

interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  departamento: string;
  cargo: string;
  role?: 'admin' | 'usuario';
}

// Lista todos os usuários ativos
export function useUsuarios(busca?: string, incluirInativos = false) {
  return useQuery({
    queryKey: ['usuarios', busca, incluirInativos],
    queryFn: () =>
      api.get<ListaUsuariosResponse>('/api/usuarios', {
        params: { busca: busca || undefined, incluirInativos: incluirInativos ? 'true' : undefined },
      }).then(r => r.data),
  });
}

// Único usuário por ID
export function useUsuario(id: string | null) {
  return useQuery({
    queryKey: ['usuarios', id],
    queryFn: () =>
      api.get<ApiResponse<Usuario>>(`/api/usuarios/${id}`).then(r => r.data.data!),
    enabled: !!id,
  });
}

// Criar usuário
export function useCriarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarUsuarioDTO) =>
      api.post<ApiResponse<Usuario>>('/api/usuarios', dados).then(r => r.data.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

// Atualizar usuário
export function useAtualizarUsuario(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: Partial<CriarUsuarioDTO>) =>
      api.put<ApiResponse<Usuario>>(`/api/usuarios/${id}`, dados).then(r => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['usuarios', id] });
    },
  });
}

// Ativar / desativar
export function useAlterarStatusUsuario(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ativo: boolean) =>
      api.patch(`/api/usuarios/${id}/status`, { ativo }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

// Atribuir / transferir custódia de um ativo
export function useCustodiar(ativoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, observacao }: { usuarioId: string | null; observacao?: string }) =>
      api.put(`/api/ativos/${ativoId}/custodiar`, { usuarioId, observacao }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ativos'] });
      qc.invalidateQueries({ queryKey: ['ativos', ativoId] });
      qc.invalidateQueries({ queryKey: ['custodias'] });
    },
  });
}
