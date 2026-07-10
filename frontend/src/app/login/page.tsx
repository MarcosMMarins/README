'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [erro, setErro]       = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginForm) {
    setErro('');
    setLoading(true);
    try {
      await login(values.email, values.senha);
    } catch (err: any) {
      setErro(err?.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Controle de Ativos</h1>
          <p className="text-blue-300/70 text-sm mt-1">Moby Tecnologia</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-blue-100">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-blue-100">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50" />
                <input
                  {...register('senha')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.senha && <span className="text-red-400 text-xs">{errors.senha.message}</span>}
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

          </form>
        </div>

        <p className="text-center text-blue-300/40 text-xs mt-6">
          Primeiro acesso: admin@mobyweb.com.br / admin@123
        </p>
      </div>
    </div>
  );
}
