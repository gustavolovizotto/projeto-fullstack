import { pool } from '../config/db.js';

const PADRAO = [
  { nome: 'Conta corrente', tipo: 'conta' },
  { nome: 'Salário', tipo: 'renda' },
];

// Fontes/destinos criados junto com o usuário.
export async function criarPadrao(usuarioId, db = pool) {
  for (const { nome, tipo } of PADRAO) {
    await db.query(
      'INSERT INTO fontes_destinos (usuario_id, nome, tipo) VALUES ($1, $2, $3)',
      [usuarioId, nome, tipo],
    );
  }
}
