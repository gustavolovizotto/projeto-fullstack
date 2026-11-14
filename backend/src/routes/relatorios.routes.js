import { Router } from 'express';
import * as Relatorio from '../models/Relatorio.js';
import * as FonteDestino from '../models/FonteDestino.js';
import * as Lancamento from '../models/Lancamento.js';
import { hojeISO, periodoAnterior } from '../models/datas.js';
import { montarFaturas } from '../models/fatura.js';
import { inteiroEntre } from '../models/validacao.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarPeriodo } from '../middlewares/validarPeriodo.js';

// Montado em /api/relatorios, depois do middleware autenticar.
const router = Router();

const paraCentavos = (valor) => Math.round(valor * 100);
const arredondar = (valor) => Math.round(valor * 100) / 100;

// Monta a lista de um tipo (entradas ou saídas) com o percentual de cada
// categoria sobre o total e a variação em relação ao período anterior.
function montarGrupo(linhas, tipo) {
  const itens = linhas.filter((linha) => linha.tipo === tipo);
  // Soma em centavos inteiros para não acumular erro de ponto flutuante.
  const total = itens.reduce((soma, item) => soma + paraCentavos(item.total), 0) / 100;
  return {
    total,
    categorias: itens.map(({ id, nome, total: valor, periodoAnterior: anterior }) => ({
      id,
      nome,
      total: valor,
      percentual: total > 0 ? arredondar((valor / total) * 100) : 0,
      periodoAnterior: anterior,
      // null quando não houve gasto no período anterior (não dá para calcular %).
      variacao: anterior > 0 ? arredondar(((valor - anterior) / anterior) * 100) : null,
    })),
  };
}

// RF7: ?inicio=&fim= (padrão: mês corrente)
router.get('/categorias', validarPeriodo, async (req, res) => {
  const anterior = periodoAnterior(req.periodo);
  const linhas = await Relatorio.porCategoria(req.usuarioId, req.periodo, anterior);
  const saidas = montarGrupo(linhas, 'saida');
  const entradas = montarGrupo(linhas, 'entrada');

  res.json({
    periodo: req.periodo,
    comparadoCom: anterior,
    totalSaidas: saidas.total,
    categorias: saidas.categorias, // saídas, no formato do exemplo do enunciado
    totalEntradas: entradas.total,
    entradas: entradas.categorias,
  });
});

const somar = (itens, campo) =>
  itens.reduce((soma, item) => soma + paraCentavos(item[campo]), 0) / 100;

// RF8: ?inicio=&fim= (padrão: mês corrente)
router.get('/fontes-destinos', validarPeriodo, async (req, res) => {
  const linhas = await Relatorio.porFonteDestino(req.usuarioId, req.periodo);
  const maiorPrimeiro = (campo) => (a, b) => b[campo] - a[campo];

  // Quanto veio de cada fonte e quanto saiu por cada destino (só os que
  // tiveram movimento), e o saldo de cada conta no período.
  const fontes = linhas
    .filter((l) => l.entradas > 0)
    .map(({ id, nome, tipo, entradas }) => ({ id, nome, tipo, total: entradas }))
    .sort(maiorPrimeiro('total'));
  const destinos = linhas
    .filter((l) => l.saidas > 0)
    .map(({ id, nome, tipo, saidas }) => ({ id, nome, tipo, total: saidas }))
    .sort(maiorPrimeiro('total'));
  const contas = linhas
    .filter((l) => l.tipo === 'conta')
    .map(({ id, nome, entradas, saidas, saldo }) => ({ id, nome, entradas, saidas, saldo }));

  res.json({
    periodo: req.periodo,
    totalEntradas: somar(fontes, 'total'),
    totalSaidas: somar(destinos, 'total'),
    fontes,
    destinos,
    contas,
  });
});

// RF9: ?meses=3 → fatura aberta + as próximas N de cada cartão do usuário.
router.get('/faturas', async (req, res) => {
  const meses = req.query.meses === undefined ? 3 : Number(req.query.meses);
  if (!inteiroEntre(meses, 1, 12)) {
    throw new ErroHttp(400, 'Dados inválidos.', { meses: 'Use de 1 a 12 meses.' });
  }

  const hoje = hojeISO();
  const cartoes = await FonteDestino.listar(req.usuarioId, 'cartao_credito');
  const resposta = [];
  for (const cartao of cartoes) {
    const parcelas = await Lancamento.listarSaidasDoCartao(cartao.id, req.usuarioId);
    resposta.push({
      id: cartao.id,
      nome: cartao.nome,
      diaFechamento: cartao.diaFechamento,
      diaVencimento: cartao.diaVencimento,
      ...montarFaturas(cartao, parcelas, hoje, meses),
    });
  }
  res.json({ hoje, cartoes: resposta });
});

export default router;
