// Validações feitas no navegador antes de enviar. São só para a experiência
// do usuário: a API valida tudo de novo e é ela quem decide.

export function somenteDigitos(valor) {
  return String(valor).replace(/\D/g, '')
}

// Mesma função do back-end (backend/src/models/validacao.js).
export function cpfValido(cpf) {
  const d = somenteDigitos(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digito = (tamanho) => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10])
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function senhaValida(senha) {
  return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha)
}
