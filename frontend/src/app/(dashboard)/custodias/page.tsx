'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users, Package, AlertCircle, ChevronDown,
  ChevronRight, ArrowRight, Loader2, UserX
} from 'lucide-react';
import api from '@/lib/api';
import { StatusBadge, CategoriaBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUsuarios, useCustodiar } from '@/hooks/useUsuarios';
import { Ativo, Usuario } from '@/types';

interface EntradaCustodia {
  usuario: Usuario;
  ativos: Ativo[];
  total: number;
  valorTotal: number;
}

interface ResumoCustodias {
  custodias: EntradaCustodia[];
  semCustodia: { ativos: Ativo[]; total: number; valorTotal: number };
  totais: { responsaveis: number; comCustodia: number; semCustodia: number; total: number };
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Modal de atribuição rápida de custódia a partir da lista de "sem custódia"
function ModalAtribuir({ ativo, onFechar }: { ativo: Ativo; onFechar: () => void }) {
  const [usuarioId, setUsuarioId] = useState('');
  const [obs, setObs] = useState('');
  const { data: usuarios } = useUsuarios();
  const custodiar = useCustodiar(ativo._id);

  async function salvar() {
    if (!usuarioId) { toast.error('Selecione um responsável.'); return; }
    try {
      await custodiar.mutateAsync({ usuarioId, observacao: obs || undefined });
      toast.success(`Custódia de ${ativo.codigo} atribuída com sucesso.`);
      onFechar();
    } catch {
      toast.error('Erro ao atribuir custódia.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Atribuir Custódia</h3>
        <p className="text-sm text-gray-500 mb-5">
          Ativo: <strong className="text-gray-700">{ativo.codigo} — {ativo.nome}</strong>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável *</label>
            <select
              value={usuarioId}
              onChange={e => setUsuarioId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecionar...</option>
              {usuarios?.data.map(u => (
                <option key={u._id} value={u._id}>{u.nome} — {u.cargo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
            <input
              value={obs}
              onChange={e => setObs(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Entregue presencialmente"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={onFechar}>Cancelar</Button>
          <Button loading={custodiar.isPending} onClick={salvar}>Atribuir</Button>
        </div>
      </div>
    </div>
  );
}

// Linha de ativo na tabela compacta
function LinhaAtivo({ ativo }: { ativo: Ativo }) {
  return (
    <Link href={`/ativos/${ativo._id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
      <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-20 text-center flex-shrink-0">
        {ativo.codigo}
      </span>
      <span className="flex-1 text-sm text-gray-800 truncate">{ativo.nome}</span>
      <CategoriaBadge categoria={ativo.categoria} />
      <StatusBadge status={ativo.status} />
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors ml-1 flex-shrink-0" />
    </Link>
  );
}

// Card expansível por responsável
function CardResponsavel({ entrada }: { entrada: EntradaCustodia }) {
  const [aberto, setAberto] = useState(false);
  const u = entrada.usuario;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-700">
            {u.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{u.nome}</p>
          <p className="text-xs text-gray-500 truncate">
            {[u.cargo, u.departamento].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="text-right mr-4 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">
            {entrada.total} {entrada.total === 1 ? 'ativo' : 'ativos'}
          </p>
          <p className="text-xs text-gray-400">{formatBRL(entrada.valorTotal)}</p>
        </div>
        {aberto
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>

      {aberto && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {entrada.ativos.map(a => <LinhaAtivo key={a._id} ativo={a} />)}
        </div>
      )}
    </div>
  );
}

export default function CustodiasPage() {
  const [atribuindo, setAtribuindo] = useState<Ativo | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['custodias'],
    queryFn: () => api.get<{ success: boolean; data: ResumoCustodias }>('/api/custodias/resumo')
      .then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando custódias...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
        <AlertCircle className="w-6 h-6" />
        <p className="text-sm">Erro ao carregar dados de custódia.</p>
      </div>
    );
  }

  const { custodias, semCustodia, totais } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Custódias</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rastreamento de responsáveis por ativo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users}   label="Responsáveis"   value={totais.responsaveis} />
        <StatCard icon={Package} label="Com custódia"   value={totais.comCustodia} />
        <StatCard
          icon={AlertCircle}
          label="Sem custódia"
          value={totais.semCustodia}
          sub={totais.semCustodia > 0 ? 'Requer atenção' : 'Tudo alocado'}
        />
      </div>

      {/* Lista de responsáveis */}
      {custodias.length === 0 && semCustodia.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Package className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum ativo cadastrado ainda.</p>
          <Link href="/ativos/novo">
            <Button size="sm" variant="outline">Cadastrar ativo</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Responsáveis ({custodias.length})
          </h2>

          {custodias.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4">Nenhum ativo alocado a responsáveis.</p>
          ) : (
            custodias.map(entrada => (
              <CardResponsavel key={(entrada.usuario as any)._id} entrada={entrada} />
            ))
          )}
        </div>
      )}

      {/* Ativos sem custódia */}
      {semCustodia.total > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-500" />
            Sem custódia ({semCustodia.total})
          </h2>
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {semCustodia.ativos.map(a => (
                <div key={a._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors group">
                  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-20 text-center flex-shrink-0">
                    {a.codigo}
                  </span>
                  <span className="flex-1 text-sm text-gray-800 truncate">{a.nome}</span>
                  <CategoriaBadge categoria={a.categoria} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAtribuindo(a)}
                    className="flex-shrink-0"
                  >
                    Atribuir
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de atribuição */}
      {atribuindo && (
        <ModalAtribuir ativo={atribuindo} onFechar={() => setAtribuindo(null)} />
      )}
    </div>
  );
}
