import { pool, transacao } from '../config/db.js';
import * as Categoria from './Categoria.js';
import * as FonteDestino from './FonteDestino.js';

// Colunas que podem sair na resposta da API. senha_hash nunca entra aqui.
const COLUNAS_PUBLICAS = 'id, nome, email, criado_em';

// Cria o usuário com as categorias e fontes/destinos padrão numa transação só:
// se qualquer passo falhar, nada fica gravado (nem usuário sem categorias).
// email e cpf já chegam normalizados pelo middleware de validação.
// Se o e-mail ou o CPF já existirem, o banco lança o erro 23505 (unique_violation).
export async function cadastrar({ nome, email, cpf, senhaHash }) {
  return transacao(async (cliente) => {
    const { rows } = await cliente.query(
      `INSERT INTO usuarios (nome, email, cpf, senha_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUNAS_PUBLICAS}`,
      [nome, email, cpf, senhaHash],
    );
    const usuario = rows[0];
    await Categoria.criarPadrao(usuario.id, cliente);
    await FonteDestino.criarPadrao(usuario.id, cliente);
    return usuario;
  });
}

export async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id],
  );
  return rows[0];
}
