'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCriarContrato, useAtualizarContrato } from '@/hooks/useContratos';
import { useAtivos } from '@/hooks/useAtivos';
import { Button } from '@/components/ui/Button';
import { Contrato } from '@/types';

const schema = z.object({
  ativo:          z.string().min(1, 'Selecione um ativo'),
  tipo:           z.enum(['garantia', 'manutencao', 'seguro', 'suporte'], {
    required_error: 'Selecione o tipo',
  }),
  fornecedor:     z.string().min(2, 'Informe o fornecedor').max(100),
  numeroContrato: z.string().max(50).optional(),
  dataInicio:     z.string().min(1, 'Informe a data de início'),
  dataVencimento: z.string().min(1, 'Informe a data de vencimento'),
  valorMensal:    z.number().min(0).optional(),
  observacoes:    z.string().max(500).optional(),
}).refine(d => d.dataVencimento >= d.dataInicio, {
  message: 'Vencimento deve ser posterior ao início',
  path: ['dataVencimento'],
});

type FormValues = z.infer<typeof schema>;

interface Props {
  contrato?: Contrato;
  ativoIdFixo?: string;       // Pré-seleciona o ativo (quando criado a partir do detalhe)
  onSucesso?: () => void;
  onCancelar?: () => void;
}

export function ContratoForm({ contrato, ativoIdFixo, onSucesso, onCancelar }: Props) {
  const criando = !contrato;
  const criar     = useCriarContrato();
  const atualizar = useAtualizarContrato(contrato?._id ?? '');
  const { data: ativos } = useAtivos({ limit: 200 });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: contrato
      ? {
          ativo:          (contrato.ativo as any)?._id ?? contrato.ativo as any,
          tipo:           contrato.tipo,
          fornecedor:     contrato.fornecedor,
          numeroContrato: contrato.numeroContrato ?? '',
          dataInicio:     contrato.dataInicio?.split('T')[0] ?? '',
          dataVencimento: contrato.dataVencimento?.split('T')[0] ?? '',
          valorMensal:    contrato.valorMensal,
          observacoes:    contrato.observacoes ?? '',
        }
      : { ativo: ativoIdFixo ?? '' },
  });

  async function onSubmit(valores: FormValues) {
    try {
      const payload = JSON.parse(JSON.stringify(valores, (_, v) => (v === '' ? undefined : v)));
      if (criando) {
        await criar.mutateAsync(payload);
        toast.success('Contrato cadastrado com sucesso!');
      } else {
        await atualizar.mutateAsync(payload);
        toast.success('Contrato atualizado com sucesso!');
      }
      onSucesso?.();
    } catch {
      toast.error(criando ? 'Erro ao cadastrar contrato.' : 'Erro ao atualizar contrato.');
    }
  }

  const fieldCls = (err?: { message?: string }) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
      err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
  );
  const ErrMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Ativo e Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ativo">Ativo *</Label>
          <select
            id="ativo"
            {...register('ativo')}
            disabled={!!ativoIdFixo}
            className={fieldCls(errors.ativo) + (ativoIdFixo ? ' opacity-60' : '')}
          >
            <option value="">Selecionar ativo...</option>
            {ativos?.data.map(a => (
              <option key={a._id} value={a._id}>
                {a.codigo} — {a.nome}
              </option>
            ))}
          </select>
          <ErrMsg msg={errors.ativo?.message} />
        </div>

        <div>
          <Label htmlFor="tipo">Tipo *</Label>
          <select id="tipo" {...register('tipo')} className={fieldCls(errors.tipo)}>
            <option value="">Selecionar...</option>
            <option value="garantia">Garantia</option>
            <option value="manutencao">Manutenção</option>
            <option value="seguro">Seguro</option>
            <option value="suporte">Suporte</option>
          </select>
          <ErrMsg msg={errors.tipo?.message} />
        </div>

        <div>
          <Label htmlFor="fornecedor">Fornecedor *</Label>
          <input id="fornecedor" {...register('fornecedor')} className={fieldCls(errors.fornecedor)} placeholder="Ex: Apple Brasil" />
          <ErrMsg msg={errors.fornecedor?.message} />
        </div>

        <div>
          <Label htmlFor="numeroContrato">Número do Contrato</Label>
          <input id="numeroContrato" {...register('numeroContrato')} className={fieldCls()} placeholder="Ex: CTR-2024-001" />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataInicio">Data de Início *</Label>
          <input id="dataInicio" type="date" {...register('dataInicio')} className={fieldCls(errors.dataInicio)} />
          <ErrMsg msg={errors.dataInicio?.message} />
        </div>

        <div>
          <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
          <input id="dataVencimento" type="date" {...register('dataVencimento')} className={fieldCls(errors.dataVencimento)} />
          <ErrMsg msg={errors.dataVencimento?.message} />
        </div>
      </div>

      {/* Valor e Observações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valorMensal">Valor Mensal (R$)</Label>
          <input
            id="valorMensal"
            type="number"
            step="0.01"
            min="0"
            {...register('valorMensal', { valueAsNumber: true })}
            className={fieldCls()}
            placeholder="0,00"
          />
        </div>

        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <textarea
            id="observacoes"
            rows={2}
            {...register('observacoes')}
            className={fieldCls() + ' resize-none'}
            placeholder="Informações adicionais..."
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        {onCancelar && (
          <Button type="button" variant="secondary" onClick={onCancelar}>Cancelar</Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {criando ? 'Cadastrar Contrato' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}
