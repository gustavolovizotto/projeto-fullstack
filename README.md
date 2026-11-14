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

### Back-end
```bash
cd backend
cp .env.example .env    # depois ajuste DATABASE_URL com seu usuário e senha
npm install
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

- **Banco:** PostgreSQL.

## Uso de IA

O grupo usou assistente de IA (Claude) como apoio para planejamento e escrita de código. Todo o código foi revisado e é explicado pelos integrantes.
