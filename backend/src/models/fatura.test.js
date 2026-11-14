// Rode com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFatura, montarFaturas } from './fatura.js';

const NUBANK = { diaFechamento: 3, diaVencimento: 10, limite: 5000 };
const VISA = { diaFechamento: 25, diaVencimento: 5, limite: 3000 };

// Tabela 10.3 do enunciado.
test('compra antes do fechamento entra na fatura do mesmo mês', () => {
  assert.deepEqual(calcularFatura('2026-11-02', NUBANK), {
    referencia: '2026-11', fechamento: '2026-11-03', vencimento: '2026-11-10',
  });
});

test('compra no dia do fechamento vai para a fatura do mês seguinte', () => {
  assert.deepEqual(calcularFatura('2026-11-03', NUBANK), {
    referencia: '2026-12', fechamento: '2026-12-03', vencimento: '2026-12-10',
  });
});

test('vencimento antes do dia de fechamento cai no mês seguinte ao fechamento', () => {
  assert.deepEqual(calcularFatura('2026-12-28', VISA), {
    referencia: '2027-02', fechamento: '2027-01-25', vencimento: '2027-02-05',
  });
});

test('parcela 3 de 3 cai dois meses depois da primeira', () => {
  assert.deepEqual(calcularFatura('2026-12-20', VISA, 3), {
    referencia: '2027-03', fechamento: '2027-02-25', vencimento: '2027-03-05',
  });
});

test('fechamento no dia 31 é ajustado para o último dia de fevereiro', () => {
  const cartao = { diaFechamento: 31, diaVencimento: 10 };
  assert.deepEqual(calcularFatura('2026-02-15', cartao), {
    referencia: '2026-03', fechamento: '2026-02-28', vencimento: '2026-03-10',
  });
  // Dia 28 é o fechamento de fevereiro: a compra vai para março.
  assert.equal(calcularFatura('2026-02-28', cartao).fechamento, '2026-03-31');
});

test('montarFaturas distribui as parcelas e calcula o limite', () => {
  const parcelas = [
    // Notebook 3x comprado em 15/10: parcelas em nov, dez e jan.
    { id: 1, descricao: 'Notebook', valor: 400, data: '2026-10-15', parcelaAtual: 1, totalParcelas: 3 },
    { id: 2, descricao: 'Notebook', valor: 400, data: '2026-10-15', parcelaAtual: 2, totalParcelas: 3 },
    { id: 3, descricao: 'Notebook', valor: 400, data: '2026-10-15', parcelaAtual: 3, totalParcelas: 3 },
    // Fatura de outubro, já vencida: não conta no limite.
    { id: 4, descricao: 'Mercado', valor: 100, data: '2026-10-01', parcelaAtual: 1, totalParcelas: 1 },
  ];
  const resultado = montarFaturas(NUBANK, parcelas, '2026-11-14', 2);

  // Hoje é 14/11: a fatura aberta fecha em 03/12 e vence em 10/12.
  assert.deepEqual(resultado.faturas.map((f) => [f.referencia, f.total, f.aberta]), [
    ['2026-12', 400, true],
    ['2027-01', 400, false],
    ['2027-02', 0, false],
  ]);
  assert.deepEqual(resultado.faturas[0].itens.map((i) => `${i.descricao} ${i.parcelaAtual}/${i.totalParcelas}`), [
    'Notebook 2/3',
  ]);
  // A parcela 1 (vence 10/11) já venceu; as parcelas 2 e 3 comprometem o limite.
  assert.equal(resultado.limiteUtilizado, 800);
  assert.equal(resultado.limiteDisponivel, 4200);
});
