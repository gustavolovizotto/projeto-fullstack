// Formatação de valores e datas para exibição.

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function moeda(valor) {
  return formatadorMoeda.format(valor ?? 0)
}

// '2026-11-01' → '01/11/2026'. Quebra a string em vez de usar new Date(),
// que interpreta a data em UTC e pode mostrar o dia anterior no Brasil.
export function dataBR(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
