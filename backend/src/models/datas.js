// Utilitários de data. As datas circulam como texto 'AAAA-MM-DD', do jeito
// que o banco devolve o tipo DATE, para não sofrer com fuso horário.

const doisDigitos = (n) => String(n).padStart(2, '0');

// mes: 0 a 11, como no Date do JavaScript.
export function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

export function paraISO(ano, mes, dia) {
  return `${ano}-${doisDigitos(mes + 1)}-${doisDigitos(dia)}`;
}

// Hoje no fuso do servidor.
export function hojeISO() {
  const hoje = new Date();
  return paraISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
}

// Primeiro e último dia do mês da data informada (padrão: hoje).
export function mesDe(dataISO = hojeISO()) {
  const [ano, mes] = dataISO.split('-').map(Number);
  return {
    inicio: paraISO(ano, mes - 1, 1),
    fim: paraISO(ano, mes - 1, ultimoDiaDoMes(ano, mes - 1)),
  };
}
