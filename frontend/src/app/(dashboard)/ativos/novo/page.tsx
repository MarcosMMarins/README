'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AtivoForm } from '@/components/features/AtivoForm';

export default function NovoAtivoPage() {
  return (
    <div className="max-w-3xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/ativos" className="hover:text-blue-600 transition-colors">Ativos</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Novo Ativo</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Cadastrar Ativo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha os dados do novo ativo. Campos marcados com * são obrigatórios.
          </p>
        </div>

        <AtivoForm />
      </div>
    </div>
  );
}
