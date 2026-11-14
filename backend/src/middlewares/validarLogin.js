import { ErroHttp } from './erros.js';
import { texto } from '../models/validacao.js';

// Valida o corpo do POST /api/auth/login e normaliza o e-mail.
export function validarLogin(req, res, next) {
  const corpo = req.body ?? {};
  const email = texto(corpo.email).toLowerCase();
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';

  const campos = {};
  if (!email) campos.email = 'Informe o e-mail.';
  if (!senha) campos.senha = 'Informe a senha.';

  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Dados inválidos.', campos);
  }

  req.body = { email, senha };
  next();
}
