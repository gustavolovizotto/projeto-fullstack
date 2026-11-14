import { pool } from '../config/db.js';

const PADRAO = [
  { nome: 'Salário', tipo: 'entrada' },
  { nome: 'Outros', tipo: 'entrada' },
  { nome: 'Alimentação', tipo: 'saida' },
  { nome: 'Moradia', tipo: 'saida' },
  { nome: 'Saúde', tipo: 'saida' },
  { nome: 'Mobilidade', tipo: 'saida' },
  { nome: 'Lazer', tipo: 'saida' },
  { nome: 'Educação', tipo: 'saida' },
  { nome: 'Outros', tipo: 'saida' },
];

// Todas as consultas usam a view categorias_ativas (sem as excluídas) e
// filtram por usuario_id, que vem sempre do token, nunca da requisição.

// Categorias criadas junto com o usuário, para ele começar a usar na hora.
// db: client da transação do cadastro (ou o pool, fora de transação).
export async function criarPadrao(usuarioId, db = pool) {
  for (const { nome, tipo } of PADRAO) {
    await db.query(
      'INSERT INTO categorias (usuario_id, nome, tipo) VALUES ($1, $2, $3)',
      [usuarioId, nome, tipo],
    );
  }
}

// tipo opcional: 'entrada' ou 'saida'.
export async function listar(usuarioId, tipo) {
  const { rows } = await pool.query(
    `SELECT id, nome, tipo FROM categorias_ativas
     WHERE usuario_id = $1 AND ($2::text IS NULL OR tipo = $2)
     ORDER BY tipo, nome`,
    [usuarioId, tipo ?? null],
  );
  return rows;
}

export async function buscar(id, usuarioId) {
  const { rows } = await pool.query(
    'SELECT id, nome, tipo FROM categorias_ativas WHERE id = $1 AND usuario_id = $2',
    [id, usuarioId],
  );
  return rows[0];
}

export async function criar(usuarioId, { nome, tipo }) {
  const { rows } = await pool.query(
    `INSERT INTO categorias (usuario_id, nome, tipo) VALUES ($1, $2, $3)
     RETURNING id, nome, tipo`,
    [usuarioId, nome, tipo],
  );
  return rows[0];
}

// Trocar o tipo de uma categoria que já tem lançamentos deixaria lançamentos de
// saída com categoria de entrada. Por isso o UPDATE só troca o tipo se não
// houver lançamento ativo. Devolve a categoria atualizada, ou undefined se não
// atualizou (não existe para esse usuário, ou o tipo não pôde mudar).
export async function atualizar(id, usuarioId, { nome, tipo }) {
  const { rows } = await pool.query(
    `UPDATE categorias_ativas SET nome = $3, tipo = $4
     WHERE id = $1 AND usuario_id = $2
       AND (tipo = $4 OR NOT EXISTS (
         SELECT 1 FROM lancamentos_ativos WHERE categoria_id = $1))
     RETURNING id, nome, tipo`,
    [id, usuarioId, nome, tipo],
  );
  return rows[0];
}

// Soft-delete: só marca como excluída se nenhum lançamento ativo usa a
// categoria (RF4). Devolve true se excluiu.
export async function excluir(id, usuarioId) {
  const { rowCount } = await pool.query(
    `UPDATE categorias_ativas SET excluido_em = NOW()
     WHERE id = $1 AND usuario_id = $2
       AND NOT EXISTS (SELECT 1 FROM lancamentos_ativos WHERE categoria_id = $1)`,
    [id, usuarioId],
  );
  return rowCount > 0;
}
