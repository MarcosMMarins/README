import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUsuario extends Document {
  nome: string;
  email: string;
  senha: string;
  departamento: string;
  cargo: string;
  role: 'admin' | 'usuario';
  ativo: boolean;
  compararSenha(candidata: string): Promise<boolean>;
}

const UsuarioSchema = new Schema<IUsuario>(
  {
    nome:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha:        { type: String, required: true, select: false },
    departamento: { type: String, required: true, trim: true },
    cargo:        { type: String, required: true, trim: true },
    role:         { type: String, enum: ['admin', 'usuario'], default: 'usuario' },
    ativo:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Faz o hash da senha antes de salvar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

// Método para comparar senha no login
UsuarioSchema.methods.compararSenha = function (candidata: string): Promise<boolean> {
  return bcrypt.compare(candidata, this.senha);
};

export const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);
