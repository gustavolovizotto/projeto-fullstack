import { ErroHttp } from './erros.js';
import { texto } from '../models/validacao.js';

export const TIPOS_CATEGORIA = ['entrada', 'saida'];

// Corpo do POST e do PUT de categorias: { nome, tipo }.
export function validarCategoria(req, res, next) {
  const corpo = req.body ?? {};
  const nome = texto(corpo.nome);
  const tipo = texto(corpo.tipo);

  const campos = {};
  if (!nome) campos.nome = 'Informe o nome.';
  else if (nome.length > 60) campos.nome = 'O nome deve ter no máximo 60 caracteres.';
  if (!TIPOS_CATEGORIA.includes(tipo)) campos.tipo = 'O tipo deve ser entrada ou saida.';

  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Dados inválidos.', campos);
  }

  req.body = { nome, tipo };
  next();
}
