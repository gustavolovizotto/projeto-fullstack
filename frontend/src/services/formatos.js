// Formatação de valores e datas para exibição.

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function moeda(valor) {
  return formatadorMoeda.format(valor ?? 0)
}

// Máscara progressiva de CPF: '5299822' → '529.982.2'.
export function mascaraCpf(valor) {
  return String(valor)
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// '2026-11-01' → '01/11/2026'. Quebra a string em vez de usar new Date(),
// que interpreta a data em UTC e pode mostrar o dia anterior no Brasil.
export function dataBR(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
