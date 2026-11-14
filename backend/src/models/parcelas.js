// Divide uma compra em n parcelas trabalhando em centavos inteiros (dinheiro
// não é float: em JavaScript 0.1 + 0.2 !== 0.3). A sobra do arredondamento
// vai para a primeira parcela, então a soma sempre bate com o total.
// Ex.: dividirEmParcelas(100, 3) → [33.34, 33.33, 33.33]
export function dividirEmParcelas(valor, n) {
  const centavos = Math.round(valor * 100);
  const base = Math.floor(centavos / n);
  const sobra = centavos - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i === 0 ? sobra : 0)) / 100);
}

// Cada parcela precisa ter pelo menos R$ 0,01 (o banco exige valor > 0).
export function cabeEmParcelas(valor, n) {
  return Math.round(valor * 100) >= n;
}
