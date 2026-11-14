# Projeto 2: Controle Financeiro

Aplicação full stack de controle financeiro pessoal. O usuário se cadastra, faz login e registra entradas e saídas de dinheiro por categoria e por fonte/destino. A aplicação gera relatórios por categoria, por fonte/destino e a previsão das faturas dos cartões de crédito.

Disciplina: Programação Web Full Stack (Engenharia de Software).

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js 20+, Express 5 |
| Banco de dados | PostgreSQL (driver `pg`, com pool de conexões) |
| Configuração | `dotenv` |
| Segurança | `cors`, `bcrypt` (hash + salt das senhas), `jsonwebtoken` (JWT), `express-rate-limit` (login) |
| Testes das regras | `node --test` (nativo do Node) |
| Front-end | React 19 + Vite, React Router, `fetch` nativo |

## Estrutura

```
projeto-fullstack/
├── backend/
│   ├── .env.example        → modelo das variáveis de ambiente
│   ├── database/           → scripts SQL e seed
│   └── src/
│       ├── server.js       → cria o app Express, registra middlewares e rotas
│       ├── routes/         → rotas + código dos controladores
│       ├── models/         → acesso ao banco de dados e regras de negócio
│       ├── middlewares/    → autenticação, validação, tratamento de erros
│       └── config/         → variáveis de ambiente e pool do banco
├── frontend/
│   ├── .env.example        → URL da API
│   └── src/
│       ├── main.jsx        → ponto de entrada (monta o React Router)
│       ├── index.css       → estilos globais
│       ├── components/     → componentes e páginas em JSX
│       ├── contexts/       → AuthContext e demais contextos
│       └── services/       → cliente HTTP (único acesso à API) e formatação
└── README.md
```

## Como rodar

### Pré-requisitos
- Node.js 20 ou superior
- PostgreSQL rodando localmente

### Banco de dados
Crie um banco vazio chamado `financas` (escolha uma das opções):

```bash
createdb financas
```

```bash
docker run -d --name financas-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=financas -p 5432:5432 postgres:16
```

### Back-end
```bash
cd backend
cp .env.example .env    # depois ajuste DATABASE_URL com seu usuário e senha
npm install
npm run db:criar        # cria as tabelas (apaga os dados se já existirem)
npm run dev
```

A API sobe em `http://localhost:3000`. Para conferir: `curl http://localhost:3000/api/health`.

### Front-end
Em outro terminal, com a API rodando:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173` (porta fixa, porque é a origem liberada no CORS da API).

### Testes
Testes das regras de negócio (CPF, senha e, mais adiante, parcelas e faturas):

```bash
cd backend && npm test
```

## Rotas da API

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| GET | `/api/health` | Confere se a API está no ar | 200 |
| POST | `/api/auth/cadastro` | Cadastra usuário (`nome`, `email`, `cpf`, `senha`, `confirmacaoSenha`) | 201, 400, 409 |
| POST | `/api/auth/login` | Autentica (`email`, `senha`) e devolve `{ token, usuario }` | 200, 400, 401, 429 |
| GET | `/api/auth/me` | Dados do usuário logado | 200, 401 |

Todas as rotas abaixo de `/api`, exceto `health`, `cadastro` e `login`, exigem o cabeçalho `Authorization: Bearer <token>`. Token ausente, inválido ou expirado → 401.

### Padrão de erro

Toda resposta de erro tem o mesmo formato:

```json
{
  "erro": "Dados inválidos.",
  "campos": { "valor": "O valor deve ser maior que zero." }
}
```

`campos` só aparece quando o erro é de um campo específico.

## Decisões do projeto

- **Banco:** PostgreSQL. O modelo está em [`backend/database/schema.sql`](backend/database/schema.sql).
- **Unicidade garantida pelo banco:** `email` e `cpf` têm `UNIQUE`. Além disso, `CHECK`s obrigam o e-mail a estar em minúsculas e o CPF a ter só dígitos, para ninguém furar a unicidade gravando sem normalizar.
- **Cadastro em transação:** o usuário, as categorias padrão e as fontes/destinos padrão (Conta corrente e Salário) são gravados juntos. Se algo falhar, nada fica gravado.
- **Front sem pasta de utilitários:** o enunciado limita o `src/` do front a `components/`, `contexts/` e `services/`. Funções de formatação (moeda, datas) ficam em `frontend/src/services/formatos.js`.
- **Cliente HTTP único:** `frontend/src/services/api.js` usa o `fetch` nativo, põe o `Authorization` em toda requisição e, se uma requisição autenticada voltar 401, faz logout.
- **Login:** o token JWT vale `JWT_EXPIRES_IN` (padrão 1h). E-mail inexistente e senha errada recebem a mesma resposta e levam o mesmo tempo (o bcrypt compara com um hash falso), para não revelar quais e-mails estão cadastrados. Depois de 5 tentativas com falha em 15 minutos, o IP recebe 429.
- **Utilitários puros** (`cpfValido`, validações de e-mail e senha) ficam em `backend/src/models/validacao.js`, junto com o teste deles.
- **Soft-delete:** categorias, fontes/destinos e lançamentos não são apagados de verdade. A exclusão preenche `excluido_em`, e a API só lê e altera pelas views `categorias_ativas`, `fontes_destinos_ativas` e `lancamentos_ativos`. Assim nenhuma consulta precisa lembrar de filtrar os excluídos.
- **Nomes únicos entre os ativos:** por causa do soft-delete, o `UNIQUE` de nome de categoria e de fonte/destino é um índice único parcial (`WHERE excluido_em IS NULL`). A regra continua garantida pelo banco, mas excluir "Lazer" permite criar outra "Lazer". O nome também não diferencia maiúsculas (`LOWER(nome)`).

## Uso de IA

O grupo usou assistente de IA (Claude) como apoio para planejamento e escrita de código. Todo o código foi revisado e é explicado pelos integrantes.
