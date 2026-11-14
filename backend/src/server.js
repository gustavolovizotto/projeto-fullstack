import './config/env.js';
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';

const app = express();

app.use(cors({ origin: process.env.FRONT_URL }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

const porta = process.env.PORT ?? 3000;

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`);
});
