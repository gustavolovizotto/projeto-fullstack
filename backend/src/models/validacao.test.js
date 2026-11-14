// Rode com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpfValido, emailValido, senhaValida, senhaCabeNoBcrypt } from './validacao.js';

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
