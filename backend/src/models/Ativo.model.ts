import mongoose, { Document, Schema } from 'mongoose';

export type CategoriaAtivo = 'hardware' | 'software' | 'mobiliario' | 'veiculo' | 'outros';
export type StatusAtivo = 'ativo' | 'manutencao' | 'inativo' | 'baixado';

export interface IAtivo extends Document {
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: CategoriaAtivo;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valorAquisicao?: number;
  dataAquisicao?: Date;
  status: StatusAtivo;
  foto?: string;
  custodiaAtual?: mongoose.Types.ObjectId;
  localizacao?: { unidade: string; sala: string };
}

const AtivoSchema = new Schema<IAtivo>(
  {
    codigo:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    nome:            { type: String, required: true, trim: true },
    descricao:       { type: String, trim: true },
    categoria:       { type: String, enum: ['hardware', 'software', 'mobiliario', 'veiculo', 'outros'], required: true },
    marca:           { type: String, trim: true },
    modelo:          { type: String, trim: true },
    numeroSerie:     { type: String, trim: true },
    valorAquisicao:  { type: Number, min: 0 },
    dataAquisicao:   { type: Date },
    status:          { type: String, enum: ['ativo', 'manutencao', 'inativo', 'baixado'], default: 'ativo' },
    foto:            { type: String },
    custodiaAtual:   { type: Schema.Types.ObjectId, ref: 'Usuario' },
    localizacao: {
      unidade: { type: String, trim: true },
      sala:    { type: String, trim: true },
    },
  },
  { timestamps: true }
);

// Índice de texto completo para busca
AtivoSchema.index({ nome: 'text', codigo: 'text', numeroSerie: 'text', marca: 'text', modelo: 'text' });

export const Ativo = mongoose.model<IAtivo>('Ativo', AtivoSchema);
