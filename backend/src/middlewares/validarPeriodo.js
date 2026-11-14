import { ErroHttp } from './erros.js';
import { dataValida } from '../models/validacao.js';
import { mesDe } from '../models/datas.js';

// Lê ?inicio=AAAA-MM-DD&fim=AAAA-MM-DD da URL. Sem eles, usa o mês corrente.
// Deixa o resultado em req.periodo = { inicio, fim }.
export function validarPeriodo(req, res, next) {
  const padrao = mesDe();
  const inicio = req.query.inicio || padrao.inicio;
  const fim = req.query.fim || padrao.fim;

  const campos = {};
  if (!dataValida(inicio)) campos.inicio = 'Data inicial inválida.';
  if (!dataValida(fim)) campos.fim = 'Data final inválida.';
  if (!campos.inicio && !campos.fim && inicio > fim) {
    campos.fim = 'A data final deve ser igual ou posterior à inicial.';
  }
  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Período inválido.', campos);
  }

  req.periodo = { inicio, fim };
  next();
}
