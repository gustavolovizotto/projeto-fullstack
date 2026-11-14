// Rode com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisar } from './saudeFinanceira.js';

const cartaoComNotebook = {
  faturas: [
    { referencia: '2026-12', total: 900, itens: [
      { valor: 400, totalParcelas: 10 }, // parcela do notebook
      { valor: 500, totalParcelas: 1 }, // compra à vista no cartão
    ] },
    { referencia: '2027-01', total: 400, itens: [{ valor: 400, totalParcelas: 10 }] },
    { referencia: '2027-02', total: 400, itens: [{ valor: 400, totalParcelas: 10 }] },
    { referencia: '2027-03', total: 0, itens: [] },
  ],
};

const base = {
  mesAtual: '2026-11',
  totaisPorMes: [
    { referencia: '2026-08', entradas: 5000, saidas: 4100, saidasAVista: 4100 },
    { referencia: '2026-09', entradas: 5000, saidas: 4000, saidasAVista: 4000 },
    { referencia: '2026-10', entradas: 5000, saidas: 4500, saidasAVista: 4500 },
    { referencia: '2026-11', entradas: 5000, saidas: 3000, saidasAVista: 3000 },
  ],
  gastosPorCategoria: [
    { id: 3, nome: 'Alimentação', referencia: '2026-08', total: 600 },
    { id: 3, nome: 'Alimentação', referencia: '2026-09', total: 600 },
    { id: 3, nome: 'Alimentação', referencia: '2026-10', total: 600 },
    { id: 3, nome: 'Alimentação', referencia: '2026-11', total: 900 }, // 50% acima
    { id: 4, nome: 'Moradia', referencia: '2026-10', total: 1500 },
    { id: 4, nome: 'Moradia', referencia: '2026-11', total: 1500 }, // média 500: 200% acima
  ],
  cartoes: [cartaoComNotebook],
};

test('taxa de poupança da janela de 3 meses', () => {
  const { meses, indicadores } = analisar(base);
  assert.deepEqual(meses.map((m) => m.taxaPoupanca), [20, 10, 40]);
  // (15000 - 11500) / 15000
  assert.equal(indicadores.taxaPoupancaMedia, 23.33);
  assert.equal(indicadores.rendaMediaMensal, 5000);
});

test('comprometimento usa as 3 próximas faturas sobre 3 meses de renda', () => {
  const { indicadores } = analisar(base);
  assert.equal(indicadores.comprometimentoCartoes.totalProximasFaturas, 1700);
  assert.equal(indicadores.comprometimentoCartoes.percentualDaRenda, 11.33);
});

test('parcelas futuras contam só compras parceladas', () => {
  const { indicadores } = analisar(base);
  assert.equal(indicadores.parcelasFuturas.total, 1200);
  assert.equal(indicadores.parcelasFuturas.ate, '2027-02');
});

test('categoria fora da curva compara com a média dos 3 meses anteriores', () => {
  const { indicadores } = analisar(base);
  assert.deepEqual(
    indicadores.categoriasForaDaCurva.map((c) => [c.nome, c.percentualAcima]),
    [['Moradia', 200], ['Alimentação', 50]],
  );
});

test('projeção soma a média à vista com as parcelas conhecidas', () => {
  const { projecao } = analisar(base);
  // média à vista = (4000 + 4500 + 3000) / 3 = 3833,33; dezembro tem +400 de parcela
  assert.deepEqual(projecao[0], {
    referencia: '2026-12', entradas: 5000, saidas: 4233.33, parcelas: 400, saldoMes: 766.67, saldoAcumulado: 766.67,
  });
  assert.equal(projecao.length, 6);
});

test('dicas por regra', () => {
  const textos = analisar(base).dicas.map((d) => `${d.tipo}: ${d.texto}`);
  assert.ok(textos.some((t) => t.startsWith('positivo: Você guardou 23,3% da sua renda')));
  assert.ok(textos.some((t) => t.includes('em parcelas até fevereiro de 2027')));
  assert.ok(textos.some((t) => t.startsWith('alerta: Seus gastos com Moradia estão 200% acima')));
  assert.ok(textos.some((t) => t.includes('continua positivo nos próximos 6 meses')));
});

test('saldo projetado negativo vira alerta', () => {
  const apertado = {
    ...base,
    totaisPorMes: base.totaisPorMes.map((t) => ({ ...t, saidas: 5200, saidasAVista: 5200 })),
  };
  const { dicas, indicadores } = analisar(apertado);
  assert.ok(indicadores.taxaPoupancaMedia < 0);
  assert.ok(dicas.some((d) => d.tipo === 'alerta' && d.texto.includes('gastou mais do que recebeu')));
  assert.ok(dicas.some((d) => d.tipo === 'alerta' && d.texto.includes('fica negativo em dezembro de 2026')));
});

test('meses sem nenhum lançamento ficam fora das médias', () => {
  // Usuário que começou em outubro: agosto e setembro não têm movimento.
  const novato = {
    ...base,
    totaisPorMes: base.totaisPorMes.filter((t) => t.referencia >= '2026-10'),
    gastosPorCategoria: [
      { id: 4, nome: 'Moradia', referencia: '2026-10', total: 1500 },
      { id: 4, nome: 'Moradia', referencia: '2026-11', total: 1500 },
    ],
  };
  const { indicadores } = analisar(novato);
  assert.equal(indicadores.rendaMediaMensal, 5000); // média de out e nov, não (0 + 5000 + 5000) / 3
  // Aluguel igual ao de outubro não é "fora da curva".
  assert.deepEqual(indicadores.categoriasForaDaCurva, []);
});
