// Análise de saúde financeira (desafio). Função pura: recebe os números já
// agregados pelo banco e devolve indicadores, projeção e dicas. Testada em
// saudeFinanceira.test.js. Os limites das dicas estão documentados no README.
import { somarMeses } from './datas.js';

export const LIMITES = {
  poupancaMinima: 10, // % da renda: abaixo disso, alerta
  poupancaBoa: 20, // % da renda: a partir disso, elogio
  comprometimentoMaximo: 30, // % da renda nas próximas 3 faturas
  foraDaCurva: 20, // % acima da média dos 3 meses anteriores
  mesesProjecao: 6,
};

const centavos = (valor) => Math.round(valor * 100);
const arredondar = (valor) => Math.round(valor * 100) / 100;
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const percentual = (valor) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)}%`;

function nomeDoMes(referencia) {
  const [ano, mes] = referencia.split('-').map(Number);
  return formatoMes.format(Date.UTC(ano, mes - 1, 1));
}

// Média em centavos de um campo nos meses informados (0 se a lista for vazia).
function media(meses, campo) {
  if (meses.length === 0) return 0;
  return Math.round(meses.reduce((soma, mes) => soma + centavos(mes[campo]), 0) / meses.length) / 100;
}

// mesAtual: 'AAAA-MM'
// totaisPorMes: [{ referencia, entradas, saidas, saidasAVista }] (mês atual e anteriores)
// gastosPorCategoria: [{ id, nome, referencia, total }] (saídas, mês atual e 3 anteriores)
// cartoes: resultado de montarFaturas() de cada cartão, a partir da fatura aberta
export function analisar({ mesAtual, totaisPorMes, gastosPorCategoria, cartoes }) {
  // Meses sem nenhum lançamento (o usuário ainda não usava o app) ficam fora
  // das médias; senão, quem começou há pouco teria médias artificialmente baixas.
  const porReferencia = new Map(totaisPorMes.map((t) => [t.referencia, t]));
  const teveMovimento = (referencia) => porReferencia.has(referencia);

  // Janela das médias: o mês atual (até hoje) e os 2 anteriores.
  const meses = [-2, -1, 0].map((k) => {
    const referencia = somarMeses(mesAtual, k);
    const t = porReferencia.get(referencia) ?? { entradas: 0, saidas: 0, saidasAVista: 0 };
    return {
      referencia,
      entradas: t.entradas,
      saidas: t.saidas,
      saidasAVista: t.saidasAVista,
      taxaPoupanca: t.entradas > 0 ? arredondar(((t.entradas - t.saidas) / t.entradas) * 100) : null,
    };
  });

  const mesesComMovimento = meses.filter((m) => teveMovimento(m.referencia));
  const rendaMediaMensal = media(mesesComMovimento, 'entradas');
  const saidasAVistaMedia = media(mesesComMovimento, 'saidasAVista');
  const totalEntradas = meses.reduce((s, m) => s + centavos(m.entradas), 0);
  const totalSaidas = meses.reduce((s, m) => s + centavos(m.saidas), 0);
  const taxaPoupancaMedia =
    totalEntradas > 0 ? arredondar(((totalEntradas - totalSaidas) / totalEntradas) * 100) : null;

  // Comprometimento: as 3 próximas faturas de todos os cartões ÷ 3 meses de renda.
  const proximasFaturasCentavos = cartoes.reduce(
    (soma, cartao) => soma + cartao.faturas.slice(0, 3).reduce((s, f) => s + centavos(f.total), 0),
    0,
  );
  const comprometimento = {
    totalProximasFaturas: proximasFaturasCentavos / 100,
    percentualDaRenda:
      rendaMediaMensal > 0 ? arredondar((proximasFaturasCentavos / 100 / (3 * rendaMediaMensal)) * 100) : null,
  };

  // Parcelas futuras: soma das parcelas de compras parceladas por mês de vencimento.
  const parcelasPorMes = new Map();
  for (const cartao of cartoes) {
    for (const fatura of cartao.faturas) {
      const parcelado = fatura.itens.filter((item) => item.totalParcelas > 1);
      if (parcelado.length === 0) continue;
      const soma = parcelado.reduce((s, item) => s + centavos(item.valor), 0);
      parcelasPorMes.set(fatura.referencia, (parcelasPorMes.get(fatura.referencia) ?? 0) + soma);
    }
  }
  const parcelasOrdenadas = [...parcelasPorMes.entries()].sort(([a], [b]) => a.localeCompare(b));
  const parcelasFuturas = {
    total: parcelasOrdenadas.reduce((s, [, valor]) => s + valor, 0) / 100,
    ate: parcelasOrdenadas.at(-1)?.[0] ?? null,
    porMes: parcelasOrdenadas.map(([referencia, valor]) => ({ referencia, total: valor / 100 })),
  };

  // Categoria fora da curva: gasto do mês atual × média dos 3 meses anteriores
  // (só os que tiveram movimento).
  const anteriores = [-3, -2, -1].map((k) => somarMeses(mesAtual, k)).filter(teveMovimento);
  const categorias = new Map();
  for (const { id, nome, referencia, total } of gastosPorCategoria) {
    const categoria = categorias.get(id) ?? { nome, mes: 0, anteriores: 0 };
    if (referencia === mesAtual) categoria.mes += centavos(total);
    else if (anteriores.includes(referencia)) categoria.anteriores += centavos(total);
    categorias.set(id, categoria);
  }
  const categoriasForaDaCurva = [...categorias.values()]
    .map(({ nome, mes, anteriores: soma }) => {
      const mediaCentavos = anteriores.length > 0 ? soma / anteriores.length : 0;
      return {
        nome,
        gastoMes: mes / 100,
        mediaAnterior: Math.round(mediaCentavos) / 100,
        percentualAcima: mediaCentavos > 0 ? arredondar(((mes - mediaCentavos) / mediaCentavos) * 100) : null,
      };
    })
    .filter((c) => c.percentualAcima !== null && c.percentualAcima > LIMITES.foraDaCurva)
    .sort((a, b) => b.percentualAcima - a.percentualAcima);

  // Projeção: média de entradas e de saídas à vista + parcelas já conhecidas.
  let acumulado = 0;
  const projecao = [];
  for (let k = 1; k <= LIMITES.mesesProjecao; k++) {
    const referencia = somarMeses(mesAtual, k);
    const parcelas = (parcelasPorMes.get(referencia) ?? 0) / 100;
    const saidas = arredondar(saidasAVistaMedia + parcelas);
    const saldoMes = arredondar(rendaMediaMensal - saidas);
    acumulado = arredondar(acumulado + saldoMes);
    projecao.push({ referencia, entradas: rendaMediaMensal, saidas, parcelas, saldoMes, saldoAcumulado: acumulado });
  }

  return {
    meses,
    indicadores: {
      taxaPoupancaMedia,
      rendaMediaMensal,
      comprometimentoCartoes: comprometimento,
      parcelasFuturas,
      categoriasForaDaCurva,
    },
    projecao,
    dicas: gerarDicas({ taxaPoupancaMedia, comprometimento, parcelasFuturas, categoriasForaDaCurva, projecao }),
  };
}

// Dicas por regra: cada if usa um dos LIMITES acima.
function gerarDicas({ taxaPoupancaMedia, comprometimento, parcelasFuturas, categoriasForaDaCurva, projecao }) {
  const dicas = [];

  if (taxaPoupancaMedia === null) {
    dicas.push({ tipo: 'info', texto: 'Registre suas entradas para calcularmos quanto da sua renda você guarda.' });
  } else if (taxaPoupancaMedia < 0) {
    dicas.push({
      tipo: 'alerta',
      texto: `Nos últimos 3 meses você gastou mais do que recebeu (${percentual(Math.abs(taxaPoupancaMedia))} acima da renda).`,
    });
  } else if (taxaPoupancaMedia < LIMITES.poupancaMinima) {
    dicas.push({
      tipo: 'alerta',
      texto: `Você guardou ${percentual(taxaPoupancaMedia)} da sua renda nos últimos 3 meses. Uma meta comum é guardar pelo menos ${LIMITES.poupancaMinima}%.`,
    });
  } else if (taxaPoupancaMedia >= LIMITES.poupancaBoa) {
    dicas.push({
      tipo: 'positivo',
      texto: `Você guardou ${percentual(taxaPoupancaMedia)} da sua renda nos últimos 3 meses. Bom ritmo!`,
    });
  } else {
    dicas.push({
      tipo: 'info',
      texto: `Você guardou ${percentual(taxaPoupancaMedia)} da sua renda nos últimos 3 meses, acima da meta comum de ${LIMITES.poupancaMinima}%.`,
    });
  }

  if (comprometimento.percentualDaRenda !== null && comprometimento.percentualDaRenda > LIMITES.comprometimentoMaximo) {
    dicas.push({
      tipo: 'alerta',
      texto: `Suas próximas 3 faturas (${moeda.format(comprometimento.totalProximasFaturas)}) comprometem ${percentual(comprometimento.percentualDaRenda)} da sua renda. Acima de ${LIMITES.comprometimentoMaximo}% vale segurar novas compras no cartão.`,
    });
  }

  if (parcelasFuturas.total > 0) {
    dicas.push({
      tipo: 'info',
      texto: `Você tem ${moeda.format(parcelasFuturas.total)} em parcelas até ${nomeDoMes(parcelasFuturas.ate)}.`,
    });
  }

  for (const categoria of categoriasForaDaCurva.slice(0, 3)) {
    dicas.push({
      tipo: 'alerta',
      texto: `Seus gastos com ${categoria.nome} estão ${percentual(categoria.percentualAcima)} acima da sua média dos 3 meses anteriores.`,
    });
  }

  const negativo = projecao.find((mes) => mes.saldoAcumulado < 0);
  dicas.push(
    negativo
      ? {
          tipo: 'alerta',
          texto: `Mantendo a média dos últimos meses, seu saldo projetado fica negativo em ${nomeDoMes(negativo.referencia)}.`,
        }
      : {
          tipo: 'positivo',
          texto: `Mantendo a média dos últimos meses, seu saldo projetado continua positivo nos próximos ${LIMITES.mesesProjecao} meses.`,
        },
  );

  return dicas;
}
