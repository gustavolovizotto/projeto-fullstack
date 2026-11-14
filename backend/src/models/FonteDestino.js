import { pool } from '../config/db.js';

const PADRAO = [
  { nome: 'Conta corrente', tipo: 'conta' },
  { nome: 'Salário', tipo: 'renda' },
];

// Colunas devolvidas pela API, já em camelCase.
const COLUNAS = `id, nome, tipo, dia_fechamento AS "diaFechamento",
  dia_vencimento AS "diaVencimento", limite`;

// Todas as consultas usam a view fontes_destinos_ativas e filtram por
// usuario_id, que vem sempre do token.

// Fontes/destinos criados junto com o usuário.
export async function criarPadrao(usuarioId, db = pool) {
  for (const { nome, tipo } of PADRAO) {
    await db.query(
      'INSERT INTO fontes_destinos (usuario_id, nome, tipo) VALUES ($1, $2, $3)',
      [usuarioId, nome, tipo],
    );
  }
}

// tipo opcional: 'renda', 'conta' ou 'cartao_credito'.
export async function listar(usuarioId, tipo) {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS} FROM fontes_destinos_ativas
     WHERE usuario_id = $1 AND ($2::text IS NULL OR tipo = $2)
     ORDER BY tipo, nome`,
    [usuarioId, tipo ?? null],
  );
  return rows;
}

export async function buscar(id, usuarioId) {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS} FROM fontes_destinos_ativas WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId],
  );
  return rows[0];
}

export async function criar(usuarioId, { nome, tipo, diaFechamento, diaVencimento, limite }) {
  const { rows } = await pool.query(
    `INSERT INTO fontes_destinos (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUNAS}`,
    [usuarioId, nome, tipo, diaFechamento, diaVencimento, limite],
  );
  return rows[0];
}

// Como nas categorias, o tipo só muda se não houver lançamento ativo (um
// cartão com compras parceladas não pode virar conta, por exemplo).
// Devolve o registro atualizado, ou undefined se não atualizou.
export async function atualizar(id, usuarioId, { nome, tipo, diaFechamento, diaVencimento, limite }) {
  const { rows } = await pool.query(
    `UPDATE fontes_destinos_ativas
     SET nome = $3, tipo = $4, dia_fechamento = $5, dia_vencimento = $6, limite = $7
     WHERE id = $1 AND usuario_id = $2
       AND (tipo = $4 OR NOT EXISTS (
         SELECT 1 FROM lancamentos_ativos WHERE fonte_destino_id = $1))
     RETURNING ${COLUNAS}`,
    [id, usuarioId, nome, tipo, diaFechamento, diaVencimento, limite],
  );
  return rows[0];
}

// Soft-delete: só marca como excluída se nenhum lançamento ativo a usa (RF5).
export async function excluir(id, usuarioId) {
  const { rowCount } = await pool.query(
    `UPDATE fontes_destinos_ativas SET excluido_em = NOW()
     WHERE id = $1 AND usuario_id = $2
       AND NOT EXISTS (SELECT 1 FROM lancamentos_ativos WHERE fonte_destino_id = $1)`,
    [id, usuarioId],
  );
  return rowCount > 0;
}
