import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario.model';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      throw new AppError('E-mail e senha são obrigatórios.', 400);
    }

    // Busca usuário incluindo a senha (select: false no schema)
    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+senha');

    if (!usuario || !(await usuario.compararSenha(senha))) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    if (!usuario.ativo) {
      throw new AppError('Usuário inativo. Contate o administrador.', 403);
    }

    const token = jwt.sign(
      { id: usuario._id.toString(), role: usuario.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Remove senha do objeto retornado
    const { senha: _, ...dadosUsuario } = usuario.toObject();

    res.json({
      success: true,
      data: { token, usuario: dadosUsuario },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await Usuario.findById(req.user!.id);
    if (!usuario) throw new AppError('Usuário não encontrado.', 404);

    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
}
