import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';
import { seedDatabase } from './config/seed';
import authRoutes from './routes/auth.routes';
import ativosRoutes from './routes/ativos.routes';
import usuariosRoutes from './routes/usuarios.routes';
import custodiasRoutes from './routes/custodias.routes';
import movimentacoesRoutes from './routes/movimentacoes.routes';
import contratosRoutes from './routes/contratos.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// ── Middlewares globais ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Conecta ao banco antes de qualquer rota (serverless-safe) ──────────
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ── Rotas ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API Controle de Ativos — Moby Tecnologia', version: '1.0.0' });
});

app.use('/api/auth',      authRoutes);
app.use('/api/ativos',    ativosRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/custodias',       custodiasRoutes);
app.use('/api/movimentacoes',   movimentacoesRoutes);
app.use('/api/contratos',       contratosRoutes);
app.use('/api/dashboard',       dashboardRoutes);

// ── Handler de erros (sempre por último) ──────────────────────────────
app.use(errorHandler);

// ── Seed no start (cria admin se banco vazio) ─────────────────────────
connectDB()
  .then(seedDatabase)
  .catch(console.error);

export default app;
