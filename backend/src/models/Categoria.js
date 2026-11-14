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
