import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types';

// Verifica o JWT no header Authorization: Bearer <token>
export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Acesso negado: token não fornecido.' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
  }
}

// Exige role de administrador
export function apenasAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acesso restrito a administradores.' });
    return;
  }
  next();
}
