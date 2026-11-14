import { ErroHttp } from './erros.js';
import { inteiroEntre, numero, texto, valorMonetarioValido } from '../models/validacao.js';

export const TIPOS_FONTE_DESTINO = ['renda', 'conta', 'cartao_credito'];

// Corpo do POST e do PUT de fontes/destinos:
// { nome, tipo, diaFechamento?, diaVencimento?, limite? }
// Os três últimos são obrigatórios só para cartão de crédito; nos outros tipos
// são ignorados e gravados como nulos.
export function validarFonteDestino(req, res, next) {
  const corpo = req.body ?? {};
  const nome = texto(corpo.nome);
  const tipo = texto(corpo.tipo);

  const campos = {};
  if (!nome) campos.nome = 'Informe o nome.';
  else if (nome.length > 60) campos.nome = 'O nome deve ter no máximo 60 caracteres.';
  if (!TIPOS_FONTE_DESTINO.includes(tipo)) {
    campos.tipo = 'O tipo deve ser renda, conta ou cartao_credito.';
  }

  let diaFechamento = null;
  let diaVencimento = null;
  let limite = null;

  if (tipo === 'cartao_credito') {
    diaFechamento = numero(corpo.diaFechamento);
    diaVencimento = numero(corpo.diaVencimento);
    limite = numero(corpo.limite);
    if (!inteiroEntre(diaFechamento, 1, 31)) {
      campos.diaFechamento = 'Informe o dia de fechamento (1 a 31).';
    }
    if (!inteiroEntre(diaVencimento, 1, 31)) {
      campos.diaVencimento = 'Informe o dia de vencimento (1 a 31).';
    }
    if (!valorMonetarioValido(limite)) {
      campos.limite = 'Informe o limite: um valor maior que zero, com até 2 casas decimais.';
    }
  }

  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Dados inválidos.', campos);
  }

  req.body = { nome, tipo, diaFechamento, diaVencimento, limite };
  next();
}
