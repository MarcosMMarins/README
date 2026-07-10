'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronRight, Pencil, Trash2, ArrowLeft,
  MapPin, Tag, Hash, Calendar, DollarSign,
  User, Loader2, AlertTriangle
} from 'lucide-react';
import { useAtivo, useDarBaixa } from '@/hooks/useAtivos';
import { useUsuarios, useCustodiar } from '@/hooks/useUsuarios';
import { useMovimentacoesAtivo } from '@/hooks/useMovimentacoes';
import { useContratosAtivo } from '@/hooks/useContratos';
import { ContratoForm } from '@/components/features/ContratoForm';
import { AtivoForm } from '@/components/features/AtivoForm';
import { StatusBadge, CategoriaBadge, TipoBadge, TIPO_DOT_CLS } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserCheck, History, ArrowRight as ArrowRightIcon, FileText, Plus, AlertTriangle as AlertTriangleIcon, X as XIcon } from 'lucide-react';
import clsx from 'clsx';

function formatBRL(valor?: number) {
  if (valor == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function InfoItem({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function AtivoDetalhe() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const id           = params.id as string;

  const [editando,       setEditando]       = useState(false);
  const [baixaModal,     setBaixaModal]     = useState(false);
  const [custodiaModal,  setCustodiaModal]  = useState(false);
  const [motivo,         setMotivo]         = useState('');
  const [novoResp,       setNovoResp]       = useState('');
  const [obsTransf,      setObsTransf]      = useState('');

  // Abre em modo edição se chegou via ?edit=1
  useEffect(() => {
    if (searchParams.get('edit') === '1') setEditando(true);
  }, [searchParams]);

  const { data: ativo, isLoading, isError } = useAtivo(id);
  const darBaixa   = useDarBaixa(id);
  const custodiar  = useCustodiar(id);
  const { data: usuarios }   = useUsuarios();
  const { data: historico }  = useMovimentacoesAtivo(id, 10);
  const { data: contratos }  = useContratosAtivo(id);
  const [novoContrato, setNovoContrato] = useState(false);

  async function confirmarCustodia() {
    try {
      await custodiar.mutateAsync({ usuarioId: novoResp || null, observacao: obsTransf || undefined });
      toast.success(novoResp ? 'Custódia atualizada com sucesso.' : 'Custódia liberada.');
      setCustodiaModal(false);
      setNovoResp('');
      setObsTransf('');
    } catch {
      toast.error('Erro ao atualizar custódia.');
    }
  }

  async function confirmarBaixa() {
    try {
      await darBaixa.mutateAsync(motivo || undefined);
      toast.success('Ativo baixado com sucesso.');
      setBaixaModal(false);
      router.push('/ativos');
    } catch {
      toast.error('Erro ao dar baixa no ativo.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  if (isError || !ativo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-sm">Ativo não encontrado.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/ativos')}>
          Voltar para Ativos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/ativos" className="hover:text-blue-600 transition-colors">Ativos</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
          {ativo.codigo}
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium truncate max-w-xs">{ativo.nome}</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Header do ativo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusBadge status={ativo.status} />
                <CategoriaBadge categoria={ativo.categoria} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 truncate">{ativo.nome}</h1>
              {(ativo.marca || ativo.modelo) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[ativo.marca, ativo.modelo].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {!editando && (
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => { setNovoResp(ativo.custodiaAtual?._id ?? ''); setCustodiaModal(true); }}>
                  <UserCheck className="w-3.5 h-3.5" />
                  Custódia
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
                {ativo.status !== 'baixado' && (
                  <Button size="sm" variant="danger" onClick={() => setBaixaModal(true)}>
                    <Trash2 className="w-3.5 h-3.5" />
                    Dar Baixa
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modo edição */}
        {editando ? (
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-900">Editar Ativo</h2>
              <button
                onClick={() => setEditando(false)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancelar edição
              </button>
            </div>
            <AtivoForm ativo={ativo} onSucesso={() => setEditando(false)} />
          </div>
        ) : (
          /* Modo visualização */
          <div className="p-6 space-y-8">

            {/* Identificação */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Identificação
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem icon={Hash}     label="Código"          value={ativo.codigo} />
                <InfoItem icon={Tag}      label="Número de Série" value={ativo.numeroSerie} />
                <InfoItem icon={Tag}      label="Marca"           value={ativo.marca} />
                <InfoItem icon={Tag}      label="Modelo"          value={ativo.modelo} />
              </div>
              {ativo.descricao && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Descrição</p>
                  <p className="text-sm text-gray-700">{ativo.descricao}</p>
                </div>
              )}
            </section>

            {/* Valor e Aquisição */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Valor e Aquisição
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem icon={DollarSign} label="Valor de Aquisição" value={formatBRL(ativo.valorAquisicao)} />
                <InfoItem icon={Calendar}   label="Data de Aquisição"  value={formatDate(ativo.dataAquisicao)} />
              </div>
            </section>

            {/* Localização */}
            {ativo.localizacao && (ativo.localizacao.unidade || ativo.localizacao.sala) && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Localização
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoItem icon={MapPin} label="Unidade / Filial" value={ativo.localizacao.unidade} />
                  <InfoItem icon={MapPin} label="Sala / Setor"     value={ativo.localizacao.sala} />
                </div>
              </section>
            )}

            {/* Custódia */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Custódia Atual
              </h2>
              {ativo.custodiaAtual ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ativo.custodiaAtual.nome}</p>
                    <p className="text-xs text-gray-500">
                      {[ativo.custodiaAtual.cargo, ativo.custodiaAtual.departamento].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nenhum responsável atribuído.</p>
              )}
            </section>

            {/* Contratos */}
            <section className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Contratos ({contratos?.total ?? 0})
                </h2>
                <Button size="sm" variant="ghost" onClick={() => setNovoContrato(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </Button>
              </div>

              {novoContrato && (
                <div className="mb-4 p-4 rounded-xl border border-blue-100 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-blue-700">Novo Contrato</p>
                    <button onClick={() => setNovoContrato(false)} className="text-blue-400 hover:text-blue-600">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <ContratoForm
                    ativoIdFixo={id}
                    onSucesso={() => setNovoContrato(false)}
                    onCancelar={() => setNovoContrato(false)}
                  />
                </div>
              )}

              {!contratos || contratos.data.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum contrato vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {contratos.data.map(c => {
                    const diasCls =
                      c.status === 'vencido' || c.status === 'critico' ? 'text-red-600' :
                      c.status === 'alerta'  || c.status === 'atencao' ? 'text-amber-600' :
                      'text-emerald-600';
                    return (
                      <div key={c._id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)} — {c.fornecedor}
                          </p>
                          <p className="text-xs text-gray-400">
                            Vence em {new Date(c.dataVencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className={clsx('text-xs font-semibold flex items-center gap-1', diasCls)}>
                          {(c.status === 'vencido' || c.status === 'critico') && (
                            <AlertTriangleIcon className="w-3 h-3" />
                          )}
                          {c.status === 'vencido'
                            ? `Vencido há ${Math.abs(c.diasParaVencer)}d`
                            : `${c.diasParaVencer}d restantes`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Histórico de movimentações */}
            {historico && historico.data.length > 0 && (
              <section className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Histórico
                  </h2>
                  <Link href="/historico" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    Ver todos <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-0">
                  {historico.data.map((m, i) => {
                    const dotCls = TIPO_DOT_CLS[m.tipo] ?? 'bg-gray-400';
                    return (
                      <div key={m._id} className="relative pl-6 pb-4 last:pb-0">
                        <div className={clsx('absolute left-0 top-0 bottom-0 w-px bg-gray-100', i === historico.data.length - 1 ? 'hidden' : '')} />
                        <div className={clsx('absolute left-[-4px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white', dotCls)} />
                        <div className="flex items-start gap-2 flex-wrap">
                          <TipoBadge tipo={m.tipo} />
                          <span className="text-xs text-gray-400 mt-0.5">
                            {new Date(m.createdAt).toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{m.descricao}</p>
                        {m.tipo === 'transferencia' && (m.responsavelAnterior || m.responsavelNovo) && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                            <span>{(m.responsavelAnterior as any)?.nome ?? 'Sem custódia'}</span>
                            <ArrowRightIcon className="w-3 h-3" />
                            <span>{(m.responsavelNovo as any)?.nome ?? 'Sem custódia'}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Por <span className="font-medium">{(m.realizadoPor as any)?.nome ?? '—'}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Datas do sistema */}
            <section className="border-t border-gray-100 pt-5">
              <div className="flex flex-wrap gap-6 text-xs text-gray-400">
                <span>Cadastrado em <strong className="text-gray-600">{formatDate(ativo.createdAt)}</strong></span>
                <span>Última atualização <strong className="text-gray-600">{formatDate(ativo.updatedAt)}</strong></span>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Modal de custódia */}
      {custodiaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Custódia do Ativo</h3>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-mono font-semibold text-blue-600">{ativo.codigo}</span> — {ativo.nome}
                </p>
              </div>
            </div>

            {ativo.custodiaAtual && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                <span className="text-gray-500 text-xs uppercase font-medium">Responsável atual:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{ativo.custodiaAtual.nome}</p>
                <p className="text-xs text-gray-400">{ativo.custodiaAtual.cargo}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ativo.custodiaAtual ? 'Transferir para' : 'Atribuir a'}
                </label>
                <select
                  value={novoResp}
                  onChange={e => setNovoResp(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Sem responsável (liberar custódia) —</option>
                  {usuarios?.data.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.nome} — {u.cargo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
                <input
                  value={obsTransf}
                  onChange={e => setObsTransf(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Entregue presencialmente com TI"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setCustodiaModal(false)}>Cancelar</Button>
              <Button loading={custodiar.isPending} onClick={confirmarCustodia}>
                {novoResp ? (ativo.custodiaAtual ? 'Transferir' : 'Atribuir') : 'Liberar Custódia'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de baixa */}
      {baixaModal && (
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
                  marcado como <em>Baixado</em> e removido do inventário ativo.
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
              <Button variant="secondary" onClick={() => setBaixaModal(false)}>Cancelar</Button>
              <Button variant="danger" loading={darBaixa.isPending} onClick={confirmarBaixa}>
                Confirmar Baixa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
