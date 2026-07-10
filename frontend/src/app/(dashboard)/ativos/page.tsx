'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Search, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, Package, Loader2
} from 'lucide-react';
import { useAtivos, useDarBaixa } from '@/hooks/useAtivos';
import { StatusBadge, CategoriaBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Ativo, CategoriaAtivo, StatusAtivo } from '@/types';

const CATEGORIAS: { value: CategoriaAtivo | ''; label: string }[] = [
  { value: '', label: 'Todas as categorias' },
  { value: 'hardware',   label: 'Hardware' },
  { value: 'software',   label: 'Software' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'veiculo',    label: 'Veículo' },
  { value: 'outros',     label: 'Outros' },
];

const STATUS_LIST: { value: StatusAtivo | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo',      label: 'Ativo' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'inativo',    label: 'Inativo' },
  { value: 'baixado',    label: 'Baixado' },
];

function formatBRL(valor?: number) {
  if (valor == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function ConfirmarBaixa({ ativo, onConfirmar, onCancelar }: {
  ativo: Ativo;
  onConfirmar: (motivo: string) => void;
  onCancelar: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Confirmar Baixa</h3>
            <p className="mt-1 text-sm text-gray-500">
              O ativo <strong className="text-gray-700">{ativo.codigo} — {ativo.nome}</strong> será
              marcado como <em>Baixado</em> e removido do inventário ativo. Essa ação pode ser
              revertida manualmente.
            </p>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
          <input
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Ex: Equipamento danificado, obsoleto..."
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancelar}>Cancelar</Button>
          <Button variant="danger" onClick={() => onConfirmar(motivo)}>Confirmar Baixa</Button>
        </div>
      </div>
    </div>
  );
}

export default function AtivosPage() {
  const router = useRouter();
  const [busca,     setBusca]     = useState('');
  const [categoria, setCategoria] = useState<string>('');
  const [status,    setStatus]    = useState<string>('');
  const [page,      setPage]      = useState(1);
  const [baixando,  setBaixando]  = useState<Ativo | null>(null);

  const { data, isLoading, isError } = useAtivos({
    page, limit: 15, busca: busca || undefined,
    categoria: categoria || undefined,
    status: status || undefined,
  });

  const darBaixa = useDarBaixa(baixando?._id ?? '');

  const handleBusca = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value);
    setPage(1);
  }, []);

  const handleFiltro = useCallback((setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    }, []);

  async function confirmarBaixa(motivo: string) {
    if (!baixando) return;
    try {
      await darBaixa.mutateAsync(motivo || undefined);
      toast.success(`Ativo ${baixando.codigo} baixado com sucesso.`);
      setBaixando(null);
    } catch {
      toast.error('Erro ao dar baixa no ativo.');
    }
  }

  const ativos = data?.data ?? [];
  const total  = data?.total ?? 0;
  const pages  = data?.pages ?? 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ativos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Inventário completo de ativos da Moby Tecnologia</p>
        </div>
        <Link href="/ativos/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo Ativo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={busca}
              onChange={handleBusca}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Buscar por nome, código, marca, modelo..."
            />
          </div>
          <select
            value={categoria}
            onChange={handleFiltro(setCategoria)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {CATEGORIAS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={handleFiltro(setStatus)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {STATUS_LIST.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando ativos...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm">Erro ao carregar ativos. Tente novamente.</p>
          </div>
        ) : ativos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Package className="w-10 h-10 opacity-30" />
            <p className="text-sm">Nenhum ativo encontrado.</p>
            {!busca && !categoria && !status && (
              <Link href="/ativos/novo">
                <Button size="sm" variant="outline">
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar primeiro ativo
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsável</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ativos.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {a.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{a.nome}</div>
                      {(a.marca || a.modelo) && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {[a.marca, a.modelo].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CategoriaBadge categoria={a.categoria} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.custodiaAtual ? (
                        <div>
                          <div className="font-medium text-gray-800">{a.custodiaAtual.nome}</div>
                          <div className="text-xs text-gray-400">{a.custodiaAtual.departamento}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Sem custódia</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-700 tabular-nums">
                      {formatBRL(a.valorAquisicao)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/ativos/${a._id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/ativos/${a._id}?edit=1`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {a.status !== 'baixado' && (
                          <button
                            onClick={() => setBaixando(a)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Dar baixa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && !isError && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Exibindo{' '}
              <span className="font-medium text-gray-700">
                {(page - 1) * 15 + 1}–{Math.min(page * 15, total)}
              </span>{' '}
              de <span className="font-medium text-gray-700">{total}</span> ativos
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const n = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                      n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de baixa */}
      {baixando && (
        <ConfirmarBaixa
          ativo={baixando}
          onConfirmar={confirmarBaixa}
          onCancelar={() => setBaixando(null)}
        />
      )}
    </div>
  );
}
