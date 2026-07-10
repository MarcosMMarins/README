import { Usuario } from '@/types';

const TOKEN_KEY   = 'token';
const USUARIO_KEY = 'usuario';

export function salvarSessao(token: string, usuario: Usuario): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  // Cookie para o middleware Next.js conseguir ler server-side (24h)
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function limparSessao(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
  document.cookie = 'token=; path=/; max-age=0';
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
