// Rode com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cabeEmParcelas, dividirEmParcelas } from './parcelas.js';

const somaEmCentavos = (parcelas) => parcelas.reduce((total, p) => total + Math.round(p * 100), 0);

test('R$ 100,00 em 3x: a sobra vai para a primeira parcela', () => {
  const parcelas = dividirEmParcelas(100, 3);
  assert.deepEqual(parcelas, [33.34, 33.33, 33.33]);
  assert.equal(somaEmCentavos(parcelas), 10000);
});

test('à vista devolve o próprio valor', () => {
  assert.deepEqual(dividirEmParcelas(59.9, 1), [59.9]);
});

test('a soma sempre bate com o total', () => {
  for (const [valor, n] of [[0.1 + 0.2, 2], [1999.99, 7], [10, 48], [0.48, 48]]) {
    assert.equal(somaEmCentavos(dividirEmParcelas(valor, n)), Math.round(valor * 100));
  }
});

test('cabeEmParcelas exige pelo menos 1 centavo por parcela', () => {
  assert.equal(cabeEmParcelas(0.48, 48), true);
  assert.equal(cabeEmParcelas(0.47, 48), false);
});
