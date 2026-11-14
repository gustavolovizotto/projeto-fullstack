import { randomUUID } from 'node:crypto';
import { pool, transacao } from '../config/db.js';
import { dividirEmParcelas } from './parcelas.js';

// Colunas devolvidas pela API, em camelCase.
const COLUNAS = `id, tipo, descricao, valor, data,
  categoria_id AS "categoriaId", fonte_destino_id AS "fonteDestinoId",
  parcela_atual AS "parcelaAtual", total_parcelas AS "totalParcelas",
  grupo_parcelamento AS "grupoParcelamento"`;

// Leituras e alterações passam pela view lancamentos_ativos (sem os
// excluídos) e sempre filtram por usuario_id, que vem do token.

// Listagem paginada com filtros opcionais, mais os totais do período filtrado
// (somados no banco, sobre todos os lançamentos do filtro, não só a página).
export async function listar(usuarioId, { inicio, fim }, filtros) {
  const condicoes = ['l.usuario_id = $1', 'l.data BETWEEN $2 AND $3'];
  const parametros = [usuarioId, inicio, fim];
  // Cada filtro informado vira mais um "AND coluna = $n", sempre parametrizado.
  for (const [coluna, valor] of [
    ['l.tipo', filtros.tipo],
    ['l.categoria_id', filtros.categoriaId],
    ['l.fonte_destino_id', filtros.fonteDestinoId],
  ]) {
    if (valor !== null) {
      parametros.push(valor);
      condicoes.push(`${coluna} = $${parametros.length}`);
    }
  }
  const where = condicoes.join(' AND ');

  const { rows: [totais] } = await pool.query(
    `SELECT COUNT(*) AS "totalItens",
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS entradas,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS saidas,
       COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo
     FROM lancamentos_ativos l
     WHERE ${where}`,
    parametros,
  );

  const offset = (filtros.pagina - 1) * filtros.porPagina;
  const { rows: itens } = await pool.query(
    `SELECT l.id, l.tipo, l.descricao, l.valor, l.data,
       l.categoria_id AS "categoriaId", c.nome AS "categoriaNome",
       l.fonte_destino_id AS "fonteDestinoId", f.nome AS "fonteDestinoNome",
       f.tipo AS "fonteDestinoTipo",
       l.parcela_atual AS "parcelaAtual", l.total_parcelas AS "totalParcelas",
       l.grupo_parcelamento AS "grupoParcelamento"
     FROM lancamentos_ativos l
     JOIN categorias c ON c.id = l.categoria_id
     JOIN fontes_destinos f ON f.id = l.fonte_destino_id
     WHERE ${where}
     ORDER BY l.data DESC, l.id DESC
     LIMIT $${parametros.length + 1} OFFSET $${parametros.length + 2}`,
    [...parametros, filtros.porPagina, offset],
  );

  const { totalItens, ...valores } = totais;
  return {
    itens,
    pagina: filtros.pagina,
    porPagina: filtros.porPagina,
    totalItens,
    totalPaginas: Math.max(1, Math.ceil(totalItens / filtros.porPagina)),
    totais: valores,
  };
}

// Cria o lançamento. Com totalParcelas > 1, grava uma linha por parcela, todas
// com a data da compra e o mesmo grupo_parcelamento, numa transação: ou todas
// as parcelas são gravadas, ou nenhuma. Devolve a lista criada.
export async function criar(usuarioId, dados) {
  const { tipo, descricao, valor, data, categoriaId, fonteDestinoId, totalParcelas } = dados;
  const valores = dividirEmParcelas(valor, totalParcelas);
  const grupo = totalParcelas > 1 ? randomUUID() : null;

  return transacao(async (cliente) => {
    const criados = [];
    for (let i = 0; i < totalParcelas; i++) {
      const { rows } = await cliente.query(
        `INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id,
           fonte_destino_id, parcela_atual, total_parcelas, grupo_parcelamento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING ${COLUNAS}`,
        [usuarioId, tipo, descricao, valores[i], data, categoriaId, fonteDestinoId,
          i + 1, totalParcelas, grupo],
      );
      criados.push(rows[0]);
    }
    return criados;
  });
}

// Numa parcela, devolve também o total da compra (soma das parcelas ativas),
// que o formulário usa para editar todas as parcelas de uma vez.
export async function buscar(id, usuarioId) {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS} FROM lancamentos_ativos WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId],
  );
  const lancamento = rows[0];
  if (lancamento?.grupoParcelamento) {
    const { rows: soma } = await pool.query(
      `SELECT SUM(valor) AS total FROM lancamentos_ativos
       WHERE grupo_parcelamento = $1 AND usuario_id = $2`,
      [lancamento.grupoParcelamento, usuarioId],
    );
    lancamento.grupo = { valorTotal: soma[0].total, totalParcelas: lancamento.totalParcelas };
  }
  return lancamento;
}

// Edita um lançamento só (ou uma parcela só).
export async function atualizar(id, usuarioId, { tipo, descricao, valor, data, categoriaId, fonteDestinoId }) {
  const { rows } = await pool.query(
    `UPDATE lancamentos_ativos
     SET tipo = $3, descricao = $4, valor = $5, data = $6, categoria_id = $7, fonte_destino_id = $8
     WHERE id = $1 AND usuario_id = $2
     RETURNING ${COLUNAS}`,
    [id, usuarioId, tipo, descricao, valor, data, categoriaId, fonteDestinoId],
  );
  return rows[0];
}

// Edita todas as parcelas ativas de uma compra. valor é o total da compra,
// redividido em centavos entre as parcelas (sobra na primeira), em transação.
export async function atualizarGrupo(grupo, usuarioId, { descricao, valor, data, categoriaId, fonteDestinoId }) {
  return transacao(async (cliente) => {
    const { rows: parcelas } = await cliente.query(
      `SELECT id FROM lancamentos_ativos
       WHERE grupo_parcelamento = $1 AND usuario_id = $2
       ORDER BY parcela_atual`,
      [grupo, usuarioId],
    );
    const valores = dividirEmParcelas(valor, parcelas.length);
    const atualizadas = [];
    for (const [i, { id }] of parcelas.entries()) {
      const { rows } = await cliente.query(
        `UPDATE lancamentos_ativos
         SET descricao = $3, valor = $4, data = $5, categoria_id = $6, fonte_destino_id = $7
         WHERE id = $1 AND usuario_id = $2
         RETURNING ${COLUNAS}`,
        [id, usuarioId, descricao, valores[i], data, categoriaId, fonteDestinoId],
      );
      atualizadas.push(rows[0]);
    }
    return atualizadas;
  });
}

// Quantas parcelas ativas a compra ainda tem (para checar o valor mínimo).
export async function contarParcelasAtivas(grupo, usuarioId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS total FROM lancamentos_ativos WHERE grupo_parcelamento = $1 AND usuario_id = $2',
    [grupo, usuarioId],
  );
  return rows[0].total;
}

// Soft-delete. Com todasParcelas, marca todas as parcelas da mesma compra.
// Devolve quantos lançamentos foram excluídos (0 = não existe para o usuário).
export async function excluir(id, usuarioId, todasParcelas) {
  const { rowCount } = await pool.query(
    `UPDATE lancamentos_ativos SET excluido_em = NOW()
     WHERE usuario_id = $2
       AND (id = $1 OR ($3 AND grupo_parcelamento = (
         SELECT grupo_parcelamento FROM lancamentos_ativos WHERE id = $1 AND usuario_id = $2)))`,
    [id, usuarioId, todasParcelas],
  );
  return rowCount;
}
