// Formatação de valores e datas para exibição.

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function moeda(valor) {
  return formatadorMoeda.format(valor ?? 0)
}

// Máscara de dinheiro: o usuário digita só números e eles entram pelos
// centavos, como numa maquininha. '123456' → '1.234,56'. Até 12 dígitos,
// o máximo que cabe no NUMERIC(12, 2) do banco.
export function mascaraMoeda(texto) {
  const digitos = String(texto).replace(/\D/g, '').replace(/^0+/, '').slice(0, 12)
  if (!digitos) return ''
  return (Number(digitos) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Texto do campo de dinheiro → número para a API. '1.234,56' → 1234.56; '' → NaN.
export function lerMoeda(texto) {
  const digitos = String(texto).replace(/\D/g, '')
  return digitos ? Number(digitos) / 100 : NaN
}

// Número vindo da API → texto do campo de dinheiro. 1234.5 → '1.234,50'.
export function moedaParaCampo(valor) {
  return valor == null ? '' : mascaraMoeda(String(Math.round(valor * 100)))
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
