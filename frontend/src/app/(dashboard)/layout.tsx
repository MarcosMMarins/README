'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Package, Users, History,
  FileText, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/ativos',     label: 'Ativos',       icon: Package },
  { href: '/custodias',  label: 'Custódias',    icon: Users },
  { href: '/historico',  label: 'Histórico',    icon: History },
  { href: '/contratos',  label: 'Contratos',    icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, autenticado, carregando, logout } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (!carregando && !autenticado) router.push('/login');
  }, [carregando, autenticado, router]);

  if (carregando || !autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={clsx(
      'flex flex-col bg-gray-900 text-white',
      mobile
        ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl'
        : 'hidden lg:flex w-60 min-h-screen sticky top-0 h-screen'
    )}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Controle de Ativos</div>
            <div className="text-xs text-gray-400">Moby Tecnologia</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                ativo
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {ativo && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Usuário */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <div className="px-3 py-2 mb-1">
          <div className="text-sm font-medium truncate">{usuario?.nome}</div>
          <div className="text-xs text-gray-400 truncate">{usuario?.email}</div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <Sidebar mobile />
        </>
      )}

      {/* Área de conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700">Controle de Ativos</span>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
