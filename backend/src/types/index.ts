import { Request } from 'express';

// Payload do JWT
export interface TokenPayload {
  id: string;
  role: 'admin' | 'usuario';
  iat?: number;
  exp?: number;
}

// Request com usuário autenticado
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Resposta padrão da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Filtros de busca para ativos
export interface AtivosQuery {
  page?: string;
  limit?: string;
  busca?: string;
  categoria?: string;
  status?: string;
  custodiaAtual?: string;
}
