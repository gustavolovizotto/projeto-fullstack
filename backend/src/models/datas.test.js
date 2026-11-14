// Rode com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mesDe, periodoAnterior, somarDias } from './datas.js';

test('mesDe devolve o primeiro e o último dia do mês', () => {
  assert.deepEqual(mesDe('2026-02-14'), { inicio: '2026-02-01', fim: '2026-02-28' });
  assert.deepEqual(mesDe('2028-02-01'), { inicio: '2028-02-01', fim: '2028-02-29' });
});

test('somarDias atravessa meses e anos', () => {
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28');
});

test('periodoAnterior de um mês fechado é o mês anterior inteiro', () => {
  assert.deepEqual(periodoAnterior({ inicio: '2026-10-01', fim: '2026-10-31' }), {
    inicio: '2026-09-01',
    fim: '2026-09-30',
  });
  assert.deepEqual(periodoAnterior({ inicio: '2026-03-01', fim: '2026-03-31' }), {
    inicio: '2026-02-01',
    fim: '2026-02-28',
  });
  assert.deepEqual(periodoAnterior({ inicio: '2026-01-01', fim: '2026-01-31' }), {
    inicio: '2025-12-01',
    fim: '2025-12-31',
  });
});

test('periodoAnterior de vários meses fechados volta o mesmo número de meses', () => {
  assert.deepEqual(periodoAnterior({ inicio: '2026-09-01', fim: '2026-11-30' }), {
    inicio: '2026-06-01',
    fim: '2026-08-31',
  });
});

test('periodoAnterior de um período qualquer usa o mesmo número de dias', () => {
  assert.deepEqual(periodoAnterior({ inicio: '2026-11-10', fim: '2026-11-19' }), {
    inicio: '2026-10-31',
    fim: '2026-11-09',
  });
});
