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
