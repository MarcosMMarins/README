import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public mensagem: string,
    public statusCode: number = 400
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}

// Handler global de erros — deve ser o último middleware registrado no app.ts
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.mensagem });
    return;
  }

  // Erro de duplicata do MongoDB (ex: e-mail ou código já existem)
  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' && (err as any).code === 11000) {
    const campo = Object.keys((err as any).keyValue)[0];
    res.status(409).json({ success: false, error: `O campo "${campo}" já está em uso.` });
    return;
  }

  console.error('[ERRO]', err);
  res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
}
