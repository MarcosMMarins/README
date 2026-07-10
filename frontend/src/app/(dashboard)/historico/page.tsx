'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, ChevronLeft, ChevronRight, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useMovimentacoes } from '@/hooks/useMovimentacoes';
import { TipoBadge, TIPO_DOT_CLS } from '@/components/ui/Badge';
import { Movimentacao, TipoMovimentacao } from '@/types';
import clsx from 'clsx';

const TIPOS: { value: TipoMovimentacao | ''; label: string }[] = [
  { value: '',             label: 'Todos os tipos'  },
  { value: 'cadastro',     label: 'Cadastro'        },
  { value: 'atualizacao',  label: 'Atualização'     },
  { value: 'transferencia',label: 'Transferência'   },
  { value: 'manutencao',   label: 'Manutenção'      },
  { value: 'baixa',        label: 'Baixa'           },
  { value: 'recuperacao',  label: 'Recuperação'     },
];

function formatDataHora(iso: string) {
  const d = new Date(iso);
  return {
    data: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

// Agrupa movimentações por dia
function agruparPorDia(movs: Movimentacao[]) {
  const grupos = new Map<string, Movimentacao[]>();
  for (const m of movs) {
    const dia = new Date(m.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    if (!grupos.has(dia)) grupos.set(dia, []);
    grupos.get(dia)!.push(m);
  }
  return Array.from(grupos.entries());
}

function ItemMovimentacao({ m }: { m: Movimentacao }) {
  const { hora } = formatDataHora(m.createdAt);
  const ativo = m.ativo as any;
  const dotCls = TIPO_DOT_CLS[m.tipo] ?? 'bg-gray-400';

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Linha vertical */}
      <div className="absolute left-[13px] top-6 bottom-0 w-px bg-gray-100 last:hidden" />
      {/* Dot */}
      <div className={clsx('absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-200', dotCls)} />

      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <TipoBadge tipo={m.tipo} />
            <span className="text-xs text-gray-400">{hora}</span>
          </div>
          {ativo && (
            <Link
              href={`/ativos/${typeof ativo === 'object' ? ativo._id : ativo}`}
              className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              {ativo.codigo}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <p className="mt-2 text-sm text-gray-800">{m.descricao}</p>

        {/* Transferência: mostra de → para */}
        {m.tipo === 'transferencia' && (m.responsavelAnterior || m.responsavelNovo) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded">
              {(m.responsavelAnterior as any)?.nome ?? 'Sem custódia'}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="bg-gray-100 px-2 py-0.5 rounded">
              {(m.responsavelNovo as any)?.nome ?? 'Sem custódia'}
            </span>
          </div>
        )}

        {m.observacao && (
          <p className="mt-1.5 text-xs text-gray-400 italic">"{m.observacao}"</p>
        )}

        <div className="mt-2 text-xs text-gray-400">
          Por <span className="font-medium text-gray-600">{(m.realizadoPor as any)?.nome ?? '—'}</span>
          {ativo?.nome && (
            <> · <span className="text-gray-500">{ativo.nome}</span></>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoricoPage() {
  const [tipo,  setTipo]  = useState('');
  const [de,    setDe]    = useState('');
  const [ate,   setAte]   = useState('');
  const [page,  setPage]  = useState(1);

  const { data, isLoading, isError } = useMovimentacoes({
    page, limit: 25,
    tipo: tipo || undefined,
    de:   de   || undefined,
    ate:  ate  || undefined,
  });

  const movs  = data?.data  ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const grupos = agruparPorDia(movs);

  function aplicarFiltro(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  const inputCls = 'text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
        <p className="text-sm text-gray-500 mt-0.5">Registro completo de movimentações de ativos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select value={tipo} onChange={aplicarFiltro(setTipo)} className={inputCls}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">De</label>
            <input type="date" value={de} onChange={aplicarFiltro(setDe)} className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Até</label>
            <input type="date" value={ate} onChange={aplicarFiltro(setAte)} className={inputCls} />
          </div>
          {(tipo || de || ate) && (
            <button
              onClick={() => { setTipo(''); setDe(''); setAte(''); setPage(1); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando histórico...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
          <AlertCircle className="w-6 h-6" />
          <p className="text-sm">Erro ao carregar histórico.</p>
        </div>
      ) : movs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400 bg-white rounded-xl border border-gray-200">
          <History className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhuma movimentação encontrada.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 font-medium">
            {total} {total === 1 ? 'registro' : 'registros'} encontrados
          </p>

          {/* Timeline agrupada por dia */}
          <div className="space-y-8">
            {grupos.map(([dia, items]) => (
              <div key={dia}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {dia}
                  </span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <div>
                  {items.map(m => <ItemMovimentacao key={m._id} m={m} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500 py-2">
              <span>
                Página <strong className="text-gray-700">{page}</strong> de{' '}
                <strong className="text-gray-700">{pages}</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
