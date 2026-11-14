import './config/env.js';
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import fontesDestinosRoutes from './routes/fontesDestinos.routes.js';
import lancamentosRoutes from './routes/lancamentos.routes.js';
import relatoriosRoutes from './routes/relatorios.routes.js';
import { autenticar } from './middlewares/autenticar.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';

const app = express();

app.use(cors({ origin: process.env.FRONT_URL }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Daqui para baixo, todas as rotas exigem token.
app.use('/api/categorias', autenticar, categoriasRoutes);
app.use('/api/fontes-destinos', autenticar, fontesDestinosRoutes);
app.use('/api/lancamentos', autenticar, lancamentosRoutes);
app.use('/api/relatorios', autenticar, relatoriosRoutes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

const porta = process.env.PORT ?? 3000;

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`);
});
