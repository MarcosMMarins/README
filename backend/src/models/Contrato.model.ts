import mongoose, { Document, Schema } from 'mongoose';

export type TipoContrato = 'garantia' | 'manutencao' | 'seguro' | 'suporte';

export interface IContrato extends Document {
  ativo: mongoose.Types.ObjectId;
  tipo: TipoContrato;
  fornecedor: string;
  numeroContrato?: string;
  dataInicio: Date;
  dataVencimento: Date;
  valorMensal?: number;
  observacoes?: string;
  alertaEnviado30Dias: boolean;
  alertaEnviado15Dias: boolean;
  alertaEnviado7Dias: boolean;
}

const ContratoSchema = new Schema<IContrato>(
  {
    ativo:           { type: Schema.Types.ObjectId, ref: 'Ativo', required: true },
    tipo:            { type: String, enum: ['garantia', 'manutencao', 'seguro', 'suporte'], required: true },
    fornecedor:      { type: String, required: true, trim: true },
    numeroContrato:  { type: String, trim: true },
    dataInicio:      { type: Date, required: true },
    dataVencimento:  { type: Date, required: true },
    valorMensal:     { type: Number, min: 0 },
    observacoes:     { type: String },
    alertaEnviado30Dias: { type: Boolean, default: false },
    alertaEnviado15Dias: { type: Boolean, default: false },
    alertaEnviado7Dias:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Índice para busca eficiente de contratos próximos ao vencimento
ContratoSchema.index({ dataVencimento: 1 });

export const Contrato = mongoose.model<IContrato>('Contrato', ContratoSchema);
