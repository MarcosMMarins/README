'use client';

import Link from 'next/link';
import {
  Package, DollarSign, AlertTriangle, FileText,
  Users, Loader2, ArrowRight, Clock, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { TipoBadge } from '@/components/ui/Badge';
import { Movimentacao } from '@/types';
import clsx from 'clsx';

// ── Helpers ──────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDataHora(iso: string) {
  const d = new Date(iso);
  const agora = new Date();
  const diffMs = agora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)   return 'agora';
  if (diffMin < 60)  return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `${diffH}h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ── Paleta ───────────────────────────────────────────────────────────────

const COR_CATEGORIA: Record<string, string> = {
  hardware:   '#3b82f6',
  software:   '#8b5cf6',
  mobiliario: '#f59e0b',
  veiculo:    '#06b6d4',
  outros:     '#9ca3af',
};

const COR_STATUS: Record<string, string> = {
  ativo:      '#10b981',
  manutencao: '#f59e0b',
  inativo:    '#9ca3af',
  baixado:    '#ef4444',
};

const LABEL_STATUS: Record<string, string> = {
  ativo: 'Ativo', manutencao: 'Manutenção', inativo: 'Inativo', baixado: 'Baixado',
};

const LABEL_CATEGORIA: Record<string, string> = {
  hardware: 'Hardware', software: 'Software', mobiliario: 'Mobiliário',
  veiculo: 'Veículo', outros: 'Outros',
};

// ── KPI Card ─────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, iconBg, iconCls, href, alert
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; iconBg: string; iconCls: string;
  href?: string; alert?: boolean;
}) {
  const content = (
    <div className={clsx(
      'bg-white rounded-xl border p-5 flex items-start gap-4 transition-shadow hover:shadow-md',
      alert ? 'border-red-200' : 'border-gray-200'
    )}>
      <div className={clsx('p-2.5 rounded-lg flex-shrink-0', iconBg)}>
        <Icon className={clsx('w-5 h-5', iconCls)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
        {sub && <p className={clsx('text-xs mt-0.5', alert ? 'text-red-500' : 'text-gray-400')}>{sub}</p>}
      </div>
      {href && <ArrowRight className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ── Tooltip customizado para o gráfico de pizza ───────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-gray-500">{value} ativo{value !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando dashboard...</span>
      </div>
    );
  }

  // Prepara dados para gráficos
  const dadosCategoria = Object.entries(data.ativosPorCategoria).map(([key, v]) => ({
    name:  LABEL_CATEGORIA[key] ?? key,
    value: v,
    color: COR_CATEGORIA[key] ?? '#9ca3af',
    key,
  })).sort((a, b) => b.value - a.value);

  const dadosStatus = Object.entries(data.ativosPorStatus).map(([key, v]) => ({
    name:  LABEL_STATUS[key] ?? key,
    value: v,
    color: COR_STATUS[key] ?? '#9ca3af',
    key,
  })).sort((a, b) => b.value - a.value);

  const totalStatus = dadosStatus.reduce((s, d) => s + d.value, 0);

  const alertasContratos = data.contratos.vencidos + data.contratos.criticos;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral dos ativos — Moby Tecnologia</p>
        </div>
        <span className="text-xs text-gray-400 mt-1">
          Atualizado às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Alerta de contratos — aparece só se houver alertas */}
      {alertasContratos > 0 && (
        <Link href="/contratos?vencimento=7">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-red-700">
                {alertasContratos} contrato{alertasContratos > 1 ? 's' : ''} exige{alertasContratos === 1 ? '' : 'm'} atenção:
              </span>
              <span className="text-red-600 ml-1">
                {data.contratos.vencidos > 0 && `${data.contratos.vencidos} vencido${data.contratos.vencidos > 1 ? 's' : ''}`}
                {data.contratos.vencidos > 0 && data.contratos.criticos > 0 && ', '}
                {data.contratos.criticos > 0 && `${data.contratos.criticos} vence${data.contratos.criticos === 1 ? '' : 'm'} em até 7 dias`}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Package} label="Total de Ativos" value={data.totalAtivos}
          sub={`${data.totalAtivos - (data.ativosPorStatus.baixado ?? 0)} ativos no parque`}
          iconBg="bg-blue-50" iconCls="text-blue-600"
          href="/ativos"
        />
        <KpiCard
          icon={DollarSign} label="Valor do Parque" value={formatBRL(data.valorTotalParque)}
          sub="Valor de aquisição (ativos ativos)"
          iconBg="bg-emerald-50" iconCls="text-emerald-600"
        />
        <KpiCard
          icon={AlertTriangle} label="Sem Custódia" value={data.ativosSemCustodia}
          sub={data.ativosSemCustodia > 0 ? 'Ativos sem responsável' : 'Todos alocados ✓'}
          iconBg={data.ativosSemCustodia > 0 ? 'bg-amber-50' : 'bg-gray-50'}
          iconCls={data.ativosSemCustodia > 0 ? 'text-amber-600' : 'text-gray-400'}
          href="/custodias"
          alert={data.ativosSemCustodia > 0}
        />
        <KpiCard
          icon={FileText} label="Contratos Críticos" value={alertasContratos}
          sub={alertasContratos > 0 ? 'Vencidos ou vence em ≤7 dias' : 'Todos em dia ✓'}
          iconBg={alertasContratos > 0 ? 'bg-red-50' : 'bg-gray-50'}
          iconCls={alertasContratos > 0 ? 'text-red-600' : 'text-gray-400'}
          href="/contratos"
          alert={alertasContratos > 0}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Gráfico de categorias — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ativos por Categoria</h2>
          {dadosCategoria.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhum ativo cadastrado
            </div>
          ) : (
            <div className="flex items-center gap-6">
              {/* Donut */}
              <div className="w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosCategoria}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {dadosCategoria.map(entry => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda */}
              <div className="flex-1 space-y-2.5">
                {dadosCategoria.map(d => {
                  const pct = data.totalAtivos > 0
                    ? Math.round((d.value / data.totalAtivos) * 100)
                    : 0;
                  return (
                    <div key={d.key} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-sm text-gray-600 flex-1">{d.name}</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums w-6 text-right">{d.value}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status do parque — 1/3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status do Parque</h2>
          {dadosStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sem dados
            </div>
          ) : (
            <div className="space-y-3">
              {dadosStatus.map(d => {
                const pct = totalStatus > 0 ? (d.value / totalStatus) * 100 : 0;
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-800 tabular-nums">
                        {d.value} <span className="text-gray-400 font-normal">({Math.round(pct)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 mt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Total geral</span>
                  <span className="font-semibold text-gray-800">{totalStatus}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Segunda linha: Movimentações + Contratos alerta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Movimentações recentes — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Movimentações Recentes</h2>
            <Link href="/historico" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.movimentacoesRecentes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Nenhuma movimentação registrada
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.movimentacoesRecentes.map((m: Movimentacao) => {
                const ativo = m.ativo as any;
                return (
                  <div key={m._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <TipoBadge tipo={m.tipo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{m.descricao}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Por <span className="font-medium">{(m.realizadoPor as any)?.nome ?? '—'}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {ativo && (
                        <Link href={`/ativos/${ativo._id}`}>
                          <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100">
                            {ativo.codigo}
                          </span>
                        </Link>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDataHora(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contratos e usuários — 1/3 */}
        <div className="space-y-4">

          {/* Contratos resumo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Contratos</h2>
              <Link href="/contratos" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Total',            value: data.contratos.total,    cls: 'text-gray-700' },
                { label: 'Vencidos',         value: data.contratos.vencidos, cls: data.contratos.vencidos > 0 ? 'text-red-600 font-semibold' : 'text-gray-500' },
                { label: 'Vencem em 7 dias', value: data.contratos.criticos, cls: data.contratos.criticos > 0 ? 'text-orange-600 font-semibold' : 'text-gray-500' },
                { label: 'Vencem em 30 dias',value: data.contratos.atencao,  cls: data.contratos.atencao > 0 ? 'text-amber-600' : 'text-gray-500' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={clsx('text-sm tabular-nums', cls)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini-stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Time</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{data.totalUsuarios}</p>
                <p className="text-xs text-gray-500">Usuários ativos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
