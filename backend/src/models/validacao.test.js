// Rode com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpfValido,
  dataValida,
  emailValido,
  numero,
  senhaCabeNoBcrypt,
  senhaValida,
  valorMonetarioValido,
} from './validacao.js';

test('cpfValido confere os dígitos verificadores', () => {
  assert.equal(cpfValido('529.982.247-25'), true);
  assert.equal(cpfValido('52998224725'), true);
  assert.equal(cpfValido('529.982.247-24'), false); // dígito errado
  assert.equal(cpfValido('111.111.111-11'), false); // todos iguais
  assert.equal(cpfValido('1234567890'), false); // 10 dígitos
});

test('emailValido exige algo@dominio.ext', () => {
  assert.equal(emailValido('ana@email.com'), true);
  assert.equal(emailValido('ana@email'), false);
  assert.equal(emailValido('ana email@x.com'), false);
});

test('senhaValida exige 8+ caracteres com letra e número', () => {
  assert.equal(senhaValida('abc12345'), true);
  assert.equal(senhaValida('abc1234'), false); // 7 caracteres
  assert.equal(senhaValida('abcdefgh'), false); // sem número
  assert.equal(senhaValida('12345678'), false); // sem letra
});

test('senhaCabeNoBcrypt limita a 72 bytes', () => {
  assert.equal(senhaCabeNoBcrypt('a1'.repeat(36)), true);
  assert.equal(senhaCabeNoBcrypt('a1'.repeat(36) + 'x'), false);
});

test('numero aceita número ou texto numérico', () => {
  assert.equal(numero(10), 10);
  assert.equal(numero('10.5'), 10.5);
  assert.ok(Number.isNaN(numero('')));
  assert.ok(Number.isNaN(numero(null)));
  assert.ok(Number.isNaN(numero('abc')));
});

test('valorMonetarioValido exige positivo com até 2 casas', () => {
  assert.equal(valorMonetarioValido(0.01), true);
  assert.equal(valorMonetarioValido(1234.56), true);
  assert.equal(valorMonetarioValido(0.1 + 0.2), true); // 0.30000000000000004
  assert.equal(valorMonetarioValido(0), false);
  assert.equal(valorMonetarioValido(-5), false);
  assert.equal(valorMonetarioValido(10.123), false);
  assert.equal(valorMonetarioValido(10000000000), false); // não cabe em NUMERIC(12,2)
  assert.equal(valorMonetarioValido(NaN), false);
});

test('dataValida exige AAAA-MM-DD de um dia que existe', () => {
  assert.equal(dataValida('2026-11-14'), true);
  assert.equal(dataValida('2028-02-29'), true); // ano bissexto
  assert.equal(dataValida('2026-02-29'), false);
  assert.equal(dataValida('2026-02-31'), false);
  assert.equal(dataValida('2026-13-01'), false);
  assert.equal(dataValida('14/11/2026'), false);
  assert.equal(dataValida(''), false);
});
