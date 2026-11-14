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

const doisDigitos = (n) => String(n).padStart(2, '0')

// Data de hoje no fuso do navegador, como 'AAAA-MM-DD'.
export function hojeISO() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`
}

// Primeiro e último dia de um mês relativo ao atual (0 = este, -1 = anterior).
export function mesRelativo(deslocamento) {
  const hoje = new Date()
  const referencia = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, 1)
  const ano = referencia.getFullYear()
  const mes = referencia.getMonth() + 1
  const ultimoDia = new Date(ano, mes, 0).getDate()
  return { inicio: `${ano}-${doisDigitos(mes)}-01`, fim: `${ano}-${doisDigitos(mes)}-${ultimoDia}` }
}

// O período padrão das telas.
export function mesAtual() {
  return mesRelativo(0)
}

const formatadorMoedaCurta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

// Para eixos de gráfico: 1500 → 'R$ 1,5 mil'.
export function moedaCurta(valor) {
  return formatadorMoedaCurta.format(valor)
}

const formatadorPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

// 7.84 → '7,84%'
export function percentual(valor) {
  return `${formatadorPercentual.format(valor)}%`
}

// '2026-11-01' → '01/11/2026'. Quebra a string em vez de usar new Date(),
// que interpreta a data em UTC e pode mostrar o dia anterior no Brasil.
export function dataBR(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
