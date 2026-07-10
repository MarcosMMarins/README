'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Plus, FileText, AlertTriangle, AlertCircle,
  Clock, CheckCircle, ChevronLeft, ChevronRight,
  Loader2, Pencil, Trash2, X
} from 'lucide-react';
import { useContratos, useResumoContratos, useRemoverContrato } from '@/hooks/useContratos';
import { ContratoForm } from '@/components/features/ContratoForm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Contrato, StatusVencimento, TipoContrato } from '@/types';
import clsx from 'clsx';

// ── Helpers ─────────────────────────────────────────────────────────────

const tipoLabel: Record<TipoContrato, string> = {
  garantia:   'Garantia',
  manutencao: 'Manutenção',
  seguro:     'Seguro',
  suporte:    'Suporte',
};

const tipoCls: Record<TipoContrato, string> = {
  garantia:   'bg-blue-50 text-blue-700 border-blue-200',
  manutencao: 'bg-amber-50 text-amber-700 border-amber-200',
  seguro:     'bg-purple-50 text-purple-700 border-purple-200',
  suporte:    'bg-cyan-50 text-cyan-700 border-cyan-200',
};

function VencimentoBadge({ status, dias }: { status: StatusVencimento; dias: number }) {
  if (status === 'vencido') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
      <AlertCircle className="w-3 h-3" />
      Vencido há {Math.abs(dias)}d
    </span>
  );
  if (status === 'critico') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
      <AlertTriangle className="w-3 h-3" />
      {dias === 0 ? 'Vence hoje' : `Vence em ${dias}d`}
    </span>
  );
  if (status === 'alerta') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">
      <Clock className="w-3 h-3" />
      Vence em {dias}d
    </span>
  );
  if (status === 'atencao') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
      <Clock className="w-3 h-3" />
      Vence em {dias}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
      <CheckCircle className="w-3 h-3" />
      {dias}d restantes
    </span>
  );
}

function formatBRL(v?: number) {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const FILTROS_VENC = [
  { value: '',       label: 'Todos' },
  { value: 'vencido',label: 'Vencidos' },
  { value: '7',      label: 'Vence em 7 dias' },
  { value: '30',     label: 'Vence em 30 dias' },
];

const TIPOS_FILTRO = [
  { value: '',          label: 'Todos os tipos' },
  { value: 'garantia',  label: 'Garantia' },
  { value: 'manutencao',label: 'Manutenção' },
  { value: 'seguro',    label: 'Seguro' },
  { value: 'suporte',   label: 'Suporte' },
];

// ── Modal genérico ───────────────────────────────────────────────────────

function ModalWrapper({ titulo, onFechar, children }: {
  titulo: string; onFechar: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <button onClick={onFechar} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────

export default function ContratosPage() {
  const [tipo,       setTipo]       = useState('');
  const [vencimento, setVencimento] = useState('');
  const [page,       setPage]       = useState(1);
  const [modal,      setModal]      = useState<'novo' | Contrato | null>(null);
  const [excluindo,  setExcluindo]  = useState<Contrato | null>(null);

  const { data, isLoading } = useContratos({ page, limit: 15, tipo: tipo || undefined, vencimento: vencimento || undefined });
  const { data: resumo }    = useResumoContratos();
  const remover             = useRemoverContrato();

  async function confirmarExclusao() {
    if (!excluindo) return;
    try {
      await remover.mutateAsync(excluindo._id);
      toast.success('Contrato removido.');
      setExcluindo(null);
    } catch {
      toast.error('Erro ao remover contrato.');
    }
  }

  const contratos = data?.data  ?? [];
  const total     = data?.total ?? 0;
  const pages     = data?.pages ?? 1;

  function filtroBtn(value: string, label: string, count?: number, corAtiva?: string) {
    const ativo = vencimento === value;
    return (
      <button
        onClick={() => { setVencimento(value); setPage(1); }}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
          ativo
            ? (corAtiva ?? 'bg-blue-600 text-white border-blue-600')
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        )}
      >
        {label}
        {count != null && (
          <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-semibold', ativo ? 'bg-white/20' : 'bg-gray-100')}>
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Garantias, manutenções, seguros e suporte</p>
        </div>
        <Button onClick={() => setModal('novo')}>
          <Plus className="w-4 h-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Filtros rápidos de vencimento */}
      {resumo && (
        <div className="flex flex-wrap gap-2">
          {filtroBtn('', 'Todos', resumo.total)}
          {filtroBtn('vencido', 'Vencidos', resumo.vencidos, 'bg-red-600 text-white border-red-600')}
          {filtroBtn('7',      'Vence em 7d', resumo.criticos, 'bg-orange-500 text-white border-orange-500')}
          {filtroBtn('30',     'Vence em 30d', resumo.atencao, 'bg-amber-500 text-white border-amber-500')}
          <select
            value={tipo}
            onChange={e => { setTipo(e.target.value); setPage(1); }}
            className="text-sm rounded-lg border border-gray-200 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIPOS_FILTRO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando contratos...</span>
          </div>
        ) : contratos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <FileText className="w-10 h-10 opacity-30" />
            <p className="text-sm">Nenhum contrato encontrado.</p>
            <Button size="sm" variant="outline" onClick={() => setModal('novo')}>
              <Plus className="w-3.5 h-3.5" />
              Cadastrar contrato
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fornecedor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Contrato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor/mês</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contratos.map(c => {
                  const ativo = c.ativo as any;
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {ativo ? (
                          <Link href={`/ativos/${ativo._id}`} className="group">
                            <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded group-hover:bg-blue-100">
                              {ativo.codigo}
                            </span>
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[140px]">{ativo.nome}</div>
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', tipoCls[c.tipo])}>
                          {tipoLabel[c.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.fornecedor}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.numeroContrato || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(c.dataVencimento)}</td>
                      <td className="px-4 py-3">
                        <VencimentoBadge status={c.status} dias={c.diasParaVencer} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-700 tabular-nums">
                        {formatBRL(c.valorMensal)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExcluindo(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && total > 0 && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} de {total} contratos
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar / editar */}
      {modal !== null && (
        <ModalWrapper
          titulo={modal === 'novo' ? 'Novo Contrato' : 'Editar Contrato'}
          onFechar={() => setModal(null)}
        >
          <ContratoForm
            contrato={modal === 'novo' ? undefined : modal}
            onSucesso={() => setModal(null)}
            onCancelar={() => setModal(null)}
          />
        </ModalWrapper>
      )}

      {/* Confirmar exclusão */}
      {excluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Remover Contrato</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contrato de <strong>{excluindo.tipo}</strong> com{' '}
                  <strong>{excluindo.fornecedor}</strong> será removido permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setExcluindo(null)}>Cancelar</Button>
              <Button variant="danger" loading={remover.isPending} onClick={confirmarExclusao}>
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
