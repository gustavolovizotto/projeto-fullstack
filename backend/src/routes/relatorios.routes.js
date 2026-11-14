import { Router } from 'express';
import * as Relatorio from '../models/Relatorio.js';
import { periodoAnterior } from '../models/datas.js';
import { validarPeriodo } from '../middlewares/validarPeriodo.js';

// Montado em /api/relatorios, depois do middleware autenticar.
const router = Router();

const paraCentavos = (valor) => Math.round(valor * 100);
const arredondar = (valor) => Math.round(valor * 100) / 100;

// Monta a lista de um tipo (entradas ou saídas) com o percentual de cada
// categoria sobre o total e a variação em relação ao período anterior.
function montarGrupo(linhas, tipo) {
  const itens = linhas.filter((linha) => linha.tipo === tipo);
  // Soma em centavos inteiros para não acumular erro de ponto flutuante.
  const total = itens.reduce((soma, item) => soma + paraCentavos(item.total), 0) / 100;
  return {
    total,
    categorias: itens.map(({ id, nome, total: valor, periodoAnterior: anterior }) => ({
      id,
      nome,
      total: valor,
      percentual: total > 0 ? arredondar((valor / total) * 100) : 0,
      periodoAnterior: anterior,
      // null quando não houve gasto no período anterior (não dá para calcular %).
      variacao: anterior > 0 ? arredondar(((valor - anterior) / anterior) * 100) : null,
    })),
  };
}

// RF7: ?inicio=&fim= (padrão: mês corrente)
router.get('/categorias', validarPeriodo, async (req, res) => {
  const anterior = periodoAnterior(req.periodo);
  const linhas = await Relatorio.porCategoria(req.usuarioId, req.periodo, anterior);
  const saidas = montarGrupo(linhas, 'saida');
  const entradas = montarGrupo(linhas, 'entrada');

  res.json({
    periodo: req.periodo,
    comparadoCom: anterior,
    totalSaidas: saidas.total,
    categorias: saidas.categorias, // saídas, no formato do exemplo do enunciado
    totalEntradas: entradas.total,
    entradas: entradas.categorias,
  });
});

export default router;
