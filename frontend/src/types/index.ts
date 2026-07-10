// ── Entidades ──────────────────────────────────────────────────────────

export interface Usuario {
  _id: string;
  nome: string;
  email: string;
  departamento: string;
  cargo: string;
  role: 'admin' | 'usuario';
  ativo: boolean;
  createdAt: string;
}

export type CategoriaAtivo = 'hardware' | 'software' | 'mobiliario' | 'veiculo' | 'outros';
export type StatusAtivo    = 'ativo' | 'manutencao' | 'inativo' | 'baixado';
export type TipoMovimentacao =
  | 'cadastro' | 'transferencia' | 'manutencao' | 'baixa' | 'recuperacao' | 'atualizacao';
export type TipoContrato  = 'garantia' | 'manutencao' | 'seguro' | 'suporte';

export interface Ativo {
  _id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: CategoriaAtivo;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valorAquisicao?: number;
  dataAquisicao?: string;
  status: StatusAtivo;
  foto?: string;
  custodiaAtual?: Usuario;
  localizacao?: { unidade: string; sala: string };
  createdAt: string;
  updatedAt: string;
}

export interface Movimentacao {
  _id: string;
  ativo: Ativo;
  tipo: TipoMovimentacao;
  descricao: string;
  responsavelAnterior?: Usuario;
  responsavelNovo?: Usuario;
  realizadoPor: Usuario;
  observacao?: string;
  createdAt: string;
}

export type StatusVencimento = 'normal' | 'atencao' | 'alerta' | 'critico' | 'vencido';

export interface Contrato {
  _id: string;
  ativo: Ativo;
  tipo: TipoContrato;
  fornecedor: string;
  numeroContrato?: string;
  dataInicio: string;
  dataVencimento: string;
  valorMensal?: number;
  observacoes?: string;
  createdAt: string;
  // Campos calculados pela API
  diasParaVencer: number;
  status: StatusVencimento;
}

// ── Respostas da API ───────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Dashboard ──────────────────────────────────────────────────────────

export interface DashboardData {
  totalAtivos: number;
  valorTotalParque: number;
  ativosSemCustodia: number;
  totalUsuarios: number;
  ativosPorCategoria: Record<string, number>;
  ativosPorStatus: Record<string, number>;
  contratos: {
    total: number;
    vencidos: number;
    criticos: number;
    atencao: number;
    alertas: Contrato[];
  };
  movimentacoesRecentes: Movimentacao[];
}

// ── Auth ──────────────────────────────────────────────────────────────

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  autenticado: boolean;
}
