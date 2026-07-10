'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCriarAtivo, useAtualizarAtivo } from '@/hooks/useAtivos';
import { Button } from '@/components/ui/Button';
import { Ativo } from '@/types';

const schema = z.object({
  nome:            z.string().min(2, 'Mínimo 2 caracteres').max(100),
  descricao:       z.string().max(500).optional(),
  categoria:       z.enum(['hardware', 'software', 'mobiliario', 'veiculo', 'outros'], {
    required_error: 'Selecione uma categoria',
  }),
  marca:           z.string().max(50).optional(),
  modelo:          z.string().max(50).optional(),
  numeroSerie:     z.string().max(100).optional(),
  valorAquisicao:  z.number({ invalid_type_error: 'Digite um valor numérico' }).min(0).optional(),
  dataAquisicao:   z.string().optional(),
  status:          z.enum(['ativo', 'manutencao', 'inativo', 'baixado']),
  localizacao: z.object({
    unidade: z.string().max(50).optional(),
    sala:    z.string().max(50).optional(),
  }).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  ativo?: Ativo;          // Passado em modo edição
  onSucesso?: () => void;
}

export function AtivoForm({ ativo, onSucesso }: Props) {
  const router  = useRouter();
  const criando = !ativo;

  const criar     = useCriarAtivo();
  const atualizar = useAtualizarAtivo(ativo?._id ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: ativo
      ? {
          nome:           ativo.nome,
          descricao:      ativo.descricao ?? '',
          categoria:      ativo.categoria,
          marca:          ativo.marca ?? '',
          modelo:         ativo.modelo ?? '',
          numeroSerie:    ativo.numeroSerie ?? '',
          valorAquisicao: ativo.valorAquisicao,
          dataAquisicao:  ativo.dataAquisicao?.split('T')[0] ?? '',
          status:         ativo.status,
          localizacao: {
            unidade: ativo.localizacao?.unidade ?? '',
            sala:    ativo.localizacao?.sala ?? '',
          },
        }
      : { status: 'ativo' },
  });

  async function onSubmit(valores: FormValues) {
    try {
      // Remove strings vazias antes de enviar
      const payload = JSON.parse(JSON.stringify(valores, (_, v) => (v === '' ? undefined : v)));

      if (criando) {
        await criar.mutateAsync(payload);
        toast.success('Ativo cadastrado com sucesso!');
      } else {
        await atualizar.mutateAsync(payload);
        toast.success('Ativo atualizado com sucesso!');
      }
      onSucesso ? onSucesso() : router.push('/ativos');
    } catch {
      toast.error(criando ? 'Erro ao cadastrar ativo.' : 'Erro ao atualizar ativo.');
    }
  }

  const fieldCls = (err?: { message?: string }) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
      err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );

  const ErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Identificação */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Identificação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <input id="nome" {...register('nome')} className={fieldCls(errors.nome)} placeholder="Ex: MacBook Pro 14&quot;" />
            <ErrorMsg msg={errors.nome?.message} />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria *</Label>
            <select id="categoria" {...register('categoria')} className={fieldCls(errors.categoria)}>
              <option value="">Selecionar...</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="mobiliario">Mobiliário</option>
              <option value="veiculo">Veículo</option>
              <option value="outros">Outros</option>
            </select>
            <ErrorMsg msg={errors.categoria?.message} />
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <select id="status" {...register('status')} className={fieldCls(errors.status)}>
              <option value="ativo">Ativo</option>
              <option value="manutencao">Em Manutenção</option>
              <option value="inativo">Inativo</option>
              <option value="baixado">Baixado</option>
            </select>
            <ErrorMsg msg={errors.status?.message} />
          </div>

          <div>
            <Label htmlFor="marca">Marca</Label>
            <input id="marca" {...register('marca')} className={fieldCls()} placeholder="Ex: Apple" />
          </div>

          <div>
            <Label htmlFor="modelo">Modelo</Label>
            <input id="modelo" {...register('modelo')} className={fieldCls()} placeholder="Ex: MPHF3BZ/A" />
          </div>

          <div>
            <Label htmlFor="numeroSerie">Número de Série</Label>
            <input id="numeroSerie" {...register('numeroSerie')} className={fieldCls()} placeholder="Ex: C02X1234JGH7" />
          </div>

          {ativo && (
            <div>
              <Label htmlFor="codigo">Código</Label>
              <input id="codigo" value={ativo.codigo} readOnly className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-500" />
            </div>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <textarea
              id="descricao"
              rows={3}
              {...register('descricao')}
              className={fieldCls(errors.descricao) + ' resize-none'}
              placeholder="Informações adicionais sobre o ativo..."
            />
            <ErrorMsg msg={errors.descricao?.message} />
          </div>
        </div>
      </section>

      {/* Valor e Datas */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Valor e Aquisição
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="valorAquisicao">Valor de Aquisição (R$)</Label>
            <input
              id="valorAquisicao"
              type="number"
              step="0.01"
              min="0"
              {...register('valorAquisicao', { valueAsNumber: true })}
              className={fieldCls(errors.valorAquisicao)}
              placeholder="0,00"
            />
            <ErrorMsg msg={errors.valorAquisicao?.message} />
          </div>

          <div>
            <Label htmlFor="dataAquisicao">Data de Aquisição</Label>
            <input
              id="dataAquisicao"
              type="date"
              {...register('dataAquisicao')}
              className={fieldCls()}
            />
          </div>
        </div>
      </section>

      {/* Localização */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Localização
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unidade">Unidade / Filial</Label>
            <input id="unidade" {...register('localizacao.unidade')} className={fieldCls()} placeholder="Ex: Matriz São Paulo" />
          </div>
          <div>
            <Label htmlFor="sala">Sala / Setor</Label>
            <input id="sala" {...register('localizacao.sala')} className={fieldCls()} placeholder="Ex: TI — Sala 201" />
          </div>
        </div>
      </section>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSucesso ? onSucesso() : router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {criando ? 'Cadastrar Ativo' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}
