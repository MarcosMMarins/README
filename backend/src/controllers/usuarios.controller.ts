import { Response, NextFunction } from 'express';
import { Usuario } from '../models/Usuario.model';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

// GET /api/usuarios
export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { busca, incluirInativos } = req.query as { busca?: string; incluirInativos?: string };

    const filtro: Record<string, unknown> = {};
    if (incluirInativos !== 'true') filtro.ativo = true;
    if (busca) {
      const re = new RegExp(busca, 'i');
      filtro.$or = [{ nome: re }, { email: re }, { departamento: re }, { cargo: re }];
    }

    const usuarios = await Usuario.find(filtro)
      .sort({ nome: 1 })
      .select('-senha');

    res.json({ success: true, data: usuarios, total: usuarios.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/usuarios/:id
export async function buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-senha');
    if (!usuario) throw new AppError('Usuário não encontrado.', 404);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
}

// POST /api/usuarios  — somente admin
export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { nome, email, senha, departamento, cargo, role } = req.body;

    if (!nome || !email || !senha || !departamento || !cargo) {
      throw new AppError('Preencha todos os campos obrigatórios: nome, email, senha, departamento, cargo.', 400);
    }

    const usuario = await Usuario.create({ nome, email, senha, departamento, cargo, role: role ?? 'usuario' });

    // Retorna sem o campo senha
    const { senha: _s, ...dados } = usuario.toObject();
    res.status(201).json({ success: true, data: dados });
  } catch (err) {
    next(err);
  }
}

// PUT /api/usuarios/:id  — somente admin
export async function atualizar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Não permite trocar a senha por aqui
    const { senha: _s, ...corpo } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      corpo,
      { new: true, runValidators: true }
    ).select('-senha');

    if (!usuario) throw new AppError('Usuário não encontrado.', 404);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/usuarios/:id/senha  — o próprio usuário ou admin
export async function trocarSenha(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const eAdmin = req.user!.role === 'admin';
    const eProprio = req.user!.id === req.params.id;

    if (!eAdmin && !eProprio) {
      throw new AppError('Sem permissão para alterar a senha deste usuário.', 403);
    }

    const usuario = await Usuario.findById(req.params.id).select('+senha');
    if (!usuario) throw new AppError('Usuário não encontrado.', 404);

    // Admin pode trocar sem confirmar senha atual; o próprio usuário precisa confirmar
    if (!eAdmin) {
      const valido = await usuario.compararSenha(senhaAtual);
      if (!valido) throw new AppError('Senha atual incorreta.', 400);
    }

    if (!novaSenha || novaSenha.length < 6) {
      throw new AppError('A nova senha deve ter no mínimo 6 caracteres.', 400);
    }

    usuario.senha = novaSenha;
    await usuario.save();

    res.json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/usuarios/:id/status  — somente admin
export async function alterarStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ativo } = req.body as { ativo: boolean };

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { ativo },
      { new: true }
    ).select('-senha');

    if (!usuario) throw new AppError('Usuário não encontrado.', 404);

    res.json({
      success: true,
      data: usuario,
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso.`,
    });
  } catch (err) {
    next(err);
  }
}
