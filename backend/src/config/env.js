// Carrega o .env e para a aplicação se faltar alguma variável obrigatória.
// Importado antes de tudo no server.js e nos scripts do banco.
import 'dotenv/config';

const obrigatorias = ['DATABASE_URL', 'FRONT_URL'];

const faltando = obrigatorias.filter((nome) => !process.env[nome]);

if (faltando.length > 0) {
  console.error(`Variáveis faltando no .env: ${faltando.join(', ')}. Veja o .env.example.`);
  process.exit(1);
}
