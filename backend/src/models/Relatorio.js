import { pool } from '../config/db.js';

// Agregações feitas no próprio banco (GROUP BY + SUM), sem trazer os
// lançamentos um a um para somar em JavaScript.

// Total por categoria no período e no período anterior, numa consulta só.
// Categorias que só tiveram movimento no período anterior também aparecem
// (com total 0), para a comparação mostrar a redução.
export async function porCategoria(usuarioId, periodo, anterior) {
  const { rows } = await pool.query(
    `SELECT c.id, c.nome, c.tipo,
       COALESCE(SUM(l.valor) FILTER (WHERE l.data BETWEEN $2 AND $3), 0) AS total,
       COALESCE(SUM(l.valor) FILTER (WHERE l.data BETWEEN $4 AND $5), 0) AS "periodoAnterior"
     FROM lancamentos_ativos l
     JOIN categorias c ON c.id = l.categoria_id
     WHERE l.usuario_id = $1
       AND (l.data BETWEEN $2 AND $3 OR l.data BETWEEN $4 AND $5)
     GROUP BY c.id, c.nome, c.tipo
     ORDER BY total DESC, c.nome`,
    [usuarioId, periodo.inicio, periodo.fim, anterior.inicio, anterior.fim],
  );
  return rows;
}

// Entradas e saídas de cada mês do período. saidasAVista separa o que não é
// compra parcelada, para a projeção não contar parcelas duas vezes.
export async function totaisPorMes(usuarioId, inicio, fim) {
  const { rows } = await pool.query(
    `SELECT to_char(data, 'YYYY-MM') AS referencia,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS entradas,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS saidas,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida' AND total_parcelas = 1), 0) AS "saidasAVista"
     FROM lancamentos_ativos
     WHERE usuario_id = $1 AND data BETWEEN $2 AND $3
     GROUP BY 1
     ORDER BY 1`,
    [usuarioId, inicio, fim],
  );
  return rows;
}

// Saídas de cada categoria em cada mês do período.
export async function saidasPorCategoriaEMes(usuarioId, inicio, fim) {
  const { rows } = await pool.query(
    `SELECT c.id, c.nome, to_char(l.data, 'YYYY-MM') AS referencia, SUM(l.valor) AS total
     FROM lancamentos_ativos l
     JOIN categorias c ON c.id = l.categoria_id
     WHERE l.usuario_id = $1 AND l.tipo = 'saida' AND l.data BETWEEN $2 AND $3
     GROUP BY c.id, c.nome, 3`,
    [usuarioId, inicio, fim],
  );
  return rows;
}

// Entradas, saídas e saldo de cada fonte/destino ativa no período. O LEFT
// JOIN faz contas sem movimento aparecerem com zero.
export async function porFonteDestino(usuarioId, periodo) {
  const { rows } = await pool.query(
    `SELECT f.id, f.nome, f.tipo,
       COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'entrada'), 0) AS entradas,
       COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'saida'), 0) AS saidas,
       COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE -l.valor END), 0) AS saldo
     FROM fontes_destinos_ativas f
     LEFT JOIN lancamentos_ativos l
       ON l.fonte_destino_id = f.id AND l.data BETWEEN $2 AND $3
     WHERE f.usuario_id = $1
     GROUP BY f.id, f.nome, f.tipo
     ORDER BY f.nome`,
    [usuarioId, periodo.inicio, periodo.fim],
  );
  return rows;
}
