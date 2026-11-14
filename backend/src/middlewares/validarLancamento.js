import { ErroHttp } from './erros.js';
import {
  dataValida,
  idValido,
  inteiroEntre,
  numero,
  texto,
  valorMonetarioValido,
} from '../models/validacao.js';
import { cabeEmParcelas } from '../models/parcelas.js';

export const TIPOS_LANCAMENTO = ['entrada', 'saida'];

// Corpo do POST e do PUT de lançamentos:
// { tipo, descricao, valor, data, categoriaId, fonteDestinoId, totalParcelas? }
// Aqui só o formato. As regras que dependem do banco (a categoria é do
// usuário? é do mesmo tipo? a fonte é um cartão?) ficam na rota.
export function validarLancamento(req, res, next) {
  const corpo = req.body ?? {};
  const tipo = texto(corpo.tipo);
  const descricao = texto(corpo.descricao);
  const valor = numero(corpo.valor);
  const data = texto(corpo.data);
  const categoriaId = numero(corpo.categoriaId);
  const fonteDestinoId = numero(corpo.fonteDestinoId);
  const totalParcelas = corpo.totalParcelas === undefined ? 1 : numero(corpo.totalParcelas);

  const campos = {};
  if (!TIPOS_LANCAMENTO.includes(tipo)) campos.tipo = 'O tipo deve ser entrada ou saida.';
  if (!descricao) campos.descricao = 'Informe a descrição.';
  else if (descricao.length > 120) campos.descricao = 'A descrição deve ter no máximo 120 caracteres.';
  if (!valorMonetarioValido(valor)) {
    campos.valor = 'O valor deve ser maior que zero, com até 2 casas decimais.';
  }
  if (!dataValida(data)) campos.data = 'Informe uma data válida.';
  if (!idValido(categoriaId)) campos.categoriaId = 'Informe a categoria.';
  if (!idValido(fonteDestinoId)) campos.fonteDestinoId = 'Informe a fonte/destino.';
  if (!inteiroEntre(totalParcelas, 1, 48)) {
    campos.totalParcelas = 'O número de parcelas deve ser de 1 a 48.';
  } else if (!campos.valor && !cabeEmParcelas(valor, totalParcelas)) {
    campos.valor = 'O valor é pequeno demais para esse número de parcelas.';
  }

  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Dados inválidos.', campos);
  }

  req.body = { tipo, descricao, valor, data, categoriaId, fonteDestinoId, totalParcelas };
  next();
}
