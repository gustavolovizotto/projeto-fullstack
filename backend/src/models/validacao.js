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

// Lê um campo de texto do corpo da requisição. Qualquer coisa que não seja
// string (número, objeto, ausente) vira '' e cai na validação de obrigatório.
export function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}
