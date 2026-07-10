import { Usuario } from '@/types';

const TOKEN_KEY   = 'token';
const USUARIO_KEY = 'usuario';

export function salvarSessao(token: string, usuario: Usuario): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function limparSessao(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuario(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USUARIO_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

export function estaAutenticado(): boolean {
  return !!getToken();
}
