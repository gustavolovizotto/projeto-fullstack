// Recria todas as tabelas a partir do schema.sql. Uso: npm run db:criar
import '../src/config/env.js';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/config/db.js';

const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');

try {
  await pool.query(sql);
  console.log('Banco recriado a partir do schema.sql.');
} catch (erro) {
  console.error(`Falha ao criar o banco: ${erro.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
