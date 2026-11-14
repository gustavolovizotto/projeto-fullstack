// Funções puras de validação, usadas pelos middlewares de validação.

export function somenteDigitos(valor) {
  return String(valor).replace(/\D/g, '');
}

// Valida os dois dígitos verificadores do CPF (função do enunciado).
export function cpfValido(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) {
    return false; // rejeita tamanho errado e 111.111.111-11, 222..., etc.
  }
  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Mínimo 8 caracteres, com pelo menos uma letra e um número.
export function senhaValida(senha) {
  return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

// O bcrypt ignora o que passa de 72 bytes: duas senhas que só diferem
// depois disso dariam o mesmo hash. Por isso limitamos o tamanho.
export function senhaCabeNoBcrypt(senha) {
  return Buffer.byteLength(senha, 'utf8') <= 72;
}

// Lê um número do corpo da requisição: aceita 10 ou "10". Qualquer outra
// coisa (vazio, null, "abc", objeto) vira NaN e é barrada pela validação.
export function numero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
  return NaN;
}

export function inteiroEntre(valor, minimo, maximo) {
  return Number.isInteger(valor) && valor >= minimo && valor <= maximo;
}

// Dinheiro: maior que zero, no máximo 2 casas decimais e cabendo em
// NUMERIC(12, 2), o tipo das colunas de valor no banco.
export function valorMonetarioValido(valor) {
  return (
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= 9999999999.99 &&
    Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6
  );
}

// Lê um campo de texto do corpo da requisição. Qualquer coisa que não seja
// string (número, objeto, ausente) vira '' e cai na validação de obrigatório.
export function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}
