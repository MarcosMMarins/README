import clsx from 'clsx';
import { CategoriaAtivo, StatusAtivo, TipoMovimentacao } from '@/types';

// ── Tipo de Movimentação ───────────────────────────────────────────────

const tipoConfig: Record<TipoMovimentacao, { label: string; cls: string; dot: string }> = {
  cadastro:      { label: 'Cadastro',       cls: 'bg-blue-50    text-blue-700    border-blue-200',    dot: 'bg-blue-500'    },
  atualizacao:   { label: 'Atualização',    cls: 'bg-slate-50   text-slate-600   border-slate-200',   dot: 'bg-slate-400'   },
  transferencia: { label: 'Transferência',  cls: 'bg-purple-50  text-purple-700  border-purple-200',  dot: 'bg-purple-500'  },
  manutencao:    { label: 'Manutenção',     cls: 'bg-amber-50   text-amber-700   border-amber-200',   dot: 'bg-amber-500'   },
  baixa:         { label: 'Baixa',          cls: 'bg-red-50     text-red-700     border-red-200',     dot: 'bg-red-500'     },
  recuperacao:   { label: 'Recuperação',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

export function TipoBadge({ tipo }: { tipo: TipoMovimentacao }) {
  const { label, cls, dot } = tipoConfig[tipo] ?? tipoConfig.atualizacao;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dot)} />
      {label}
    </span>
  );
}

export const TIPO_DOT_CLS: Record<TipoMovimentacao, string> = {
  cadastro:      'bg-blue-500',
  atualizacao:   'bg-slate-400',
  transferencia: 'bg-purple-500',
  manutencao:    'bg-amber-500',
  baixa:         'bg-red-500',
  recuperacao:   'bg-emerald-500',
};

// ── Status ─────────────────────────────────────────────────────────────

const statusConfig: Record<StatusAtivo, { label: string; cls: string; dot: string }> = {
  ativo:      { label: 'Ativo',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  manutencao: { label: 'Manutenção',  cls: 'bg-amber-50  text-amber-700  border-amber-200',    dot: 'bg-amber-500'   },
  inativo:    { label: 'Inativo',     cls: 'bg-gray-100   text-gray-600   border-gray-200',     dot: 'bg-gray-400'    },
  baixado:    { label: 'Baixado',     cls: 'bg-red-50    text-red-700    border-red-200',       dot: 'bg-red-500'     },
};

export function StatusBadge({ status }: { status: StatusAtivo }) {
  const { label, cls, dot } = statusConfig[status] ?? statusConfig.inativo;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}

// ── Categoria ──────────────────────────────────────────────────────────

const categoriaConfig: Record<CategoriaAtivo, { label: string; cls: string }> = {
  hardware:   { label: 'Hardware',   cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  software:   { label: 'Software',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  mobiliario: { label: 'Mobiliário', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  veiculo:    { label: 'Veículo',    cls: 'bg-cyan-50   text-cyan-700   border-cyan-200'   },
  outros:     { label: 'Outros',     cls: 'bg-gray-100  text-gray-600   border-gray-200'   },
};

export function CategoriaBadge({ categoria }: { categoria: CategoriaAtivo }) {
  const { label, cls } = categoriaConfig[categoria] ?? categoriaConfig.outros;
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

// ── Genérico ──────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantCls = {
  default: 'bg-gray-100 text-gray-600 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      variantCls[variant], className
    )}>
      {children}
    </span>
  );
}
