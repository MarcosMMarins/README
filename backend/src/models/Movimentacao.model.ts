import mongoose, { Document, Schema } from 'mongoose';

export type TipoMovimentacao =
  | 'cadastro'
  | 'transferencia'
  | 'manutencao'
  | 'baixa'
  | 'recuperacao'
  | 'atualizacao';

export interface IMovimentacao extends Document {
  ativo: mongoose.Types.ObjectId;
  tipo: TipoMovimentacao;
  descricao: string;
  responsavelAnterior?: mongoose.Types.ObjectId;
  responsavelNovo?: mongoose.Types.ObjectId;
  realizadoPor: mongoose.Types.ObjectId;
  observacao?: string;
  createdAt: Date;
}

const MovimentacaoSchema = new Schema<IMovimentacao>(
  {
    ativo: { type: Schema.Types.ObjectId, ref: 'Ativo', required: true },
    tipo: {
      type: String,
      enum: ['cadastro', 'transferencia', 'manutencao', 'baixa', 'recuperacao', 'atualizacao'],
      required: true,
    },
    descricao:            { type: String, required: true },
    responsavelAnterior:  { type: Schema.Types.ObjectId, ref: 'Usuario' },
    responsavelNovo:      { type: Schema.Types.ObjectId, ref: 'Usuario' },
    realizadoPor:         { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    observacao:           { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Movimentacao = mongoose.model<IMovimentacao>('Movimentacao', MovimentacaoSchema);
