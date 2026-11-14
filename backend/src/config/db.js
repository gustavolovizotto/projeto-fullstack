import pg from 'pg';

const { Pool, types } = pg;

// O pg devolve NUMERIC (1700) e BIGINT (20, ex.: COUNT) como string.
// Os valores do projeto cabem com folga em Number, então convertemos.
types.setTypeParser(1700, (valor) => Number(valor));
types.setTypeParser(20, (valor) => Number(valor));

// DATE (1082) viraria um Date do JS com fuso horário, e '2026-11-01' poderia
// aparecer como 31/10. Mantemos a string 'AAAA-MM-DD' como veio do banco.
types.setTypeParser(1082, (valor) => valor);

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
