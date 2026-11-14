// Regras de fatura de cartão de crédito (RF9). Funções puras, testadas em
// fatura.test.js. Datas em UTC para não sofrer com fuso horário.

function ultimoDiaDoMes(ano, mes) {
  // mes: 0 a 11
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

// Aceita mes > 11 (vira o ano) e ajusta dia 31 em meses curtos.
function dataSegura(ano, mes, dia) {
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return new Date(Date.UTC(a, m, Math.min(dia, ultimoDiaDoMes(a, m))));
}

const iso = (data) => data.toISOString().slice(0, 10);

// Implementação de referência do enunciado.
// Compra feita antes do dia de fechamento entra na fatura que fecha no mesmo
// mês; no dia do fechamento ou depois, na do mês seguinte. A parcela k cai
// k − 1 meses depois. Se o vencimento é depois do fechamento, vence no mesmo
// mês; senão, no mês seguinte.
// dataCompra: 'AAAA-MM-DD'; cartao: { diaFechamento, diaVencimento }
export function calcularFatura(dataCompra, cartao, numeroParcela = 1) {
  const [ano, mes, dia] = dataCompra.split('-').map(Number);
  const m = mes - 1;
  const fechamentoDoMes = Math.min(cartao.diaFechamento, ultimoDiaDoMes(ano, m));

  let mesFechamento = dia < fechamentoDoMes ? m : m + 1;
  mesFechamento += numeroParcela - 1;

  const fechamento = dataSegura(ano, mesFechamento, cartao.diaFechamento);
  const mesVencimento =
    cartao.diaVencimento > cartao.diaFechamento ? mesFechamento : mesFechamento + 1;
  const vencimento = dataSegura(ano, mesVencimento, cartao.diaVencimento);

  return { referencia: iso(vencimento).slice(0, 7), fechamento: iso(fechamento), vencimento: iso(vencimento) };
}

const paraCentavos = (valor) => Math.round(valor * 100);

// Monta a fatura aberta (onde cairia uma compra feita hoje) e as `meses`
// faturas seguintes de um cartão, com as parcelas que caem em cada uma.
// parcelas: saídas do cartão { id, descricao, valor, data, parcelaAtual, totalParcelas }
// O limite é comprometido por todas as parcelas que ainda não venceram,
// inclusive as que caem depois do horizonte mostrado.
export function montarFaturas(cartao, parcelas, hoje, meses) {
  const faturas = [];
  for (let k = 0; k <= meses; k++) {
    // A k-ésima fatura depois da aberta é onde cairia a parcela k + 1 de uma compra feita hoje.
    faturas.push({ ...calcularFatura(hoje, cartao, k + 1), centavos: 0, itens: [] });
  }
  const porReferencia = new Map(faturas.map((fatura) => [fatura.referencia, fatura]));

  let utilizadoCentavos = 0;
  for (const parcela of parcelas) {
    const { referencia, vencimento } = calcularFatura(parcela.data, cartao, parcela.parcelaAtual);
    if (vencimento >= hoje) utilizadoCentavos += paraCentavos(parcela.valor);

    const fatura = porReferencia.get(referencia);
    if (fatura) {
      fatura.centavos += paraCentavos(parcela.valor);
      fatura.itens.push({
        id: parcela.id,
        descricao: parcela.descricao,
        valor: parcela.valor,
        dataCompra: parcela.data,
        parcelaAtual: parcela.parcelaAtual,
        totalParcelas: parcela.totalParcelas,
      });
    }
  }

  const limiteCentavos = paraCentavos(cartao.limite);
  return {
    limite: cartao.limite,
    limiteUtilizado: utilizadoCentavos / 100,
    limiteDisponivel: (limiteCentavos - utilizadoCentavos) / 100,
    faturas: faturas.map(({ centavos, ...fatura }, indice) => ({
      ...fatura,
      aberta: indice === 0,
      total: centavos / 100,
    })),
  };
}
