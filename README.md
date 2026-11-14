# Projeto 2: Controle Financeiro

Aplicação full stack de controle financeiro pessoal. O usuário se cadastra, faz login e registra entradas e saídas de dinheiro por categoria e por fonte/destino. A aplicação gera relatórios por categoria, por fonte/destino e a previsão das faturas dos cartões de crédito.

Disciplina: Programação Web Full Stack (Engenharia de Software).

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js 20+, Express 5 |
| Banco de dados | PostgreSQL (driver `pg`, com pool de conexões) |
| Configuração | `dotenv` |
| Segurança | `cors` |

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

## Rotas da API

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| GET | `/api/health` | Confere se a API está no ar | 200 |

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
- **Soft-delete:** categorias, fontes/destinos e lançamentos não são apagados de verdade. A exclusão preenche `excluido_em`, e a API só lê e altera pelas views `categorias_ativas`, `fontes_destinos_ativas` e `lancamentos_ativos`. Assim nenhuma consulta precisa lembrar de filtrar os excluídos.
- **Nomes únicos entre os ativos:** por causa do soft-delete, o `UNIQUE` de nome de categoria e de fonte/destino é um índice único parcial (`WHERE excluido_em IS NULL`). A regra continua garantida pelo banco, mas excluir "Lazer" permite criar outra "Lazer". O nome também não diferencia maiúsculas (`LOWER(nome)`).

## Uso de IA

O grupo usou assistente de IA (Claude) como apoio para planejamento e escrita de código. Todo o código foi revisado e é explicado pelos integrantes.
