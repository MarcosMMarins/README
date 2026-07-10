'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { salvarSessao, limparSessao, getToken, getUsuario } from '@/lib/auth';
import { Usuario } from '@/types';

interface AuthContextValue {
  usuario: Usuario | null;
  autenticado: boolean;
  carregando: boolean;
  login(email: string, senha: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario]     = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura sessão ao carregar a página
  useEffect(() => {
    const token   = getToken();
    const cached  = getUsuario();
    if (token && cached) setUsuario(cached);
    setCarregando(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post('/api/auth/login', { email, senha });
    salvarSessao(data.data.token, data.data.usuario);
    setUsuario(data.data.usuario);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    limparSessao();
    setUsuario(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ usuario, autenticado: !!usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
