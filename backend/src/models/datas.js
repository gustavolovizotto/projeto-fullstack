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

const DIA_EM_MS = 24 * 60 * 60 * 1000;

function paraUTC(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function deUTC(ms) {
  const data = new Date(ms);
  return paraISO(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

export function somarDias(dataISO, dias) {
  return deUTC(paraUTC(dataISO) + dias * DIA_EM_MS);
}

// Período imediatamente anterior, do mesmo tamanho, para comparação.
// - Meses fechados (do dia 1 ao último dia): os mesmos N meses antes.
//   Ex.: outubro inteiro → setembro inteiro (e não os 31 dias antes).
// - Qualquer outro período: o mesmo número de dias logo antes do início.
export function periodoAnterior({ inicio, fim }) {
  const [anoInicio, mesInicio, diaInicio] = inicio.split('-').map(Number);
  const [anoFim, mesFim, diaFim] = fim.split('-').map(Number);

  if (diaInicio === 1 && diaFim === ultimoDiaDoMes(anoFim, mesFim - 1)) {
    const meses = (anoFim - anoInicio) * 12 + (mesFim - mesInicio) + 1;
    return {
      inicio: deUTC(Date.UTC(anoInicio, mesInicio - 1 - meses, 1)),
      fim: deUTC(Date.UTC(anoInicio, mesInicio - 1, 0)), // dia 0 = último dia do mês anterior
    };
  }

  const dias = (paraUTC(fim) - paraUTC(inicio)) / DIA_EM_MS + 1;
  return { inicio: somarDias(inicio, -dias), fim: somarDias(inicio, -1) };
}

// Mês de referência 'AAAA-MM' somado de n meses (n pode ser negativo).
export function somarMeses(referencia, meses) {
  const [ano, mes] = referencia.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}`;
}

// Primeiro e último dia do mês da data informada (padrão: hoje).
export function mesDe(dataISO = hojeISO()) {
  const [ano, mes] = dataISO.split('-').map(Number);
  return {
    inicio: paraISO(ano, mes - 1, 1),
    fim: paraISO(ano, mes - 1, ultimoDiaDoMes(ano, mes - 1)),
  };
}
