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
npm run db:reset        # cria as tabelas e carrega os dados de demonstração
npm run dev
```

Scripts do banco:

| Script | O que faz |
|---|---|
| `npm run db:criar` | Recria as tabelas a partir de `database/schema.sql` (apaga os dados) |
| `npm run db:seed` | Carrega os dados de demonstração num banco vazio |
| `npm run db:reset` | `db:criar` + `db:seed` |

### Dados de demonstração
O seed cria dois usuários com o mês atual e os dois anteriores de lançamentos, cartões e compras parceladas (incluindo uma compra feita no dia do fechamento do cartão):

| Usuário | E-mail | Senha |
|---|---|---|
| Ana Souza | `ana@exemplo.com` | `Senha123` |
| Bruno Lima | `bruno@exemplo.com` | `Senha123` |

As datas são relativas ao dia em que o seed roda, então a demonstração sempre tem dados recentes.

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

| GET | `/api/categorias?tipo=` | Lista as categorias do usuário (filtro opcional `entrada`/`saida`) | 200, 400 |
| POST | `/api/categorias` | Cria categoria (`nome`, `tipo`) | 201, 400, 409 |
| PUT | `/api/categorias/:id` | Edita categoria | 200, 400, 404, 409 |
| DELETE | `/api/categorias/:id` | Exclui categoria (soft-delete) | 204, 404, 409 |
| GET | `/api/fontes-destinos?tipo=` | Lista fontes/destinos (filtro opcional `renda`/`conta`/`cartao_credito`) | 200, 400 |
| POST | `/api/fontes-destinos` | Cria fonte/destino (`nome`, `tipo`; cartão exige `diaFechamento`, `diaVencimento`, `limite`) | 201, 400, 409 |
| PUT | `/api/fontes-destinos/:id` | Edita fonte/destino | 200, 400, 404, 409 |
| DELETE | `/api/fontes-destinos/:id` | Exclui fonte/destino (soft-delete) | 204, 404, 409 |
| GET | `/api/lancamentos?inicio=&fim=&tipo=&categoriaId=&fonteDestinoId=&pagina=&porPagina=` | Lista com filtros (padrão: mês corrente) e paginação; traz os totais de entradas, saídas e saldo do período filtrado | 200, 400 |
| POST | `/api/lancamentos` | Cria lançamento (`tipo`, `descricao`, `valor`, `data`, `categoriaId`, `fonteDestinoId`, `totalParcelas?`); devolve a lista de parcelas criadas | 201, 400, 404 |
| GET | `/api/lancamentos/:id` | Detalha um lançamento (numa parcela, inclui `grupo.valorTotal`) | 200, 404 |
| PUT | `/api/lancamentos/:id?todasParcelas=` | Edita o lançamento, uma parcela ou todas as parcelas da compra | 200, 400, 404 |
| DELETE | `/api/lancamentos/:id?todasParcelas=` | Exclui o lançamento, uma parcela ou todas (soft-delete) | 204, 404 |
| GET | `/api/relatorios/categorias?inicio=&fim=` | Saídas e entradas por categoria, com percentual e comparação com o período anterior | 200, 400 |
| GET | `/api/relatorios/fontes-destinos?inicio=&fim=` | Entradas por fonte, saídas por destino e saldo de cada conta no período | 200, 400 |
| GET | `/api/relatorios/faturas?meses=3` | Fatura aberta e as próximas N de cada cartão, com limite utilizado e disponível | 200, 400 |
| GET | `/api/saude-financeira` | Indicadores, projeção de saldo e dicas (desafio) | 200 |

Todas as rotas abaixo de `/api`, exceto `health`, `cadastro` e `login`, exigem o cabeçalho `Authorization: Bearer <token>`. Token ausente, inválido ou expirado → 401.

**Isolamento entre usuários:** o id do usuário vem sempre do token. Toda consulta filtra por ele, então um registro de outro usuário responde 404, como se não existisse.

### Padrão de erro

Toda resposta de erro tem o mesmo formato:

```json
{
  "erro": "Dados inválidos.",
  "campos": { "valor": "O valor deve ser maior que zero." }
}
```

`campos` só aparece quando o erro é de um campo específico.

## Saúde financeira (desafio)

Tudo é calculado no back-end, em `backend/src/models/saudeFinanceira.js` (função pura, testada em `saudeFinanceira.test.js`). As dicas são geradas por regras, sem modelo de linguagem.

| Indicador | Como é calculado |
|---|---|
| Taxa de poupança | (entradas − saídas) ÷ entradas, mês a mês e no total da janela (mês atual até hoje + 2 meses anteriores) |
| Comprometimento com cartões | soma das 3 próximas faturas de todos os cartões ÷ 3 meses de renda média |
| Parcelas futuras | soma das parcelas de compras parceladas que ainda vão vencer, por mês |
| Categoria fora da curva | gasto do mês atual na categoria × média dos 3 meses anteriores |
| Projeção de saldo | para os próximos 6 meses: renda média − saídas à vista médias − parcelas já conhecidas daquele mês, acumulado |

Meses sem nenhum lançamento (antes de o usuário começar a usar o app) ficam fora das médias.

Limites usados nas dicas (constante `LIMITES`):

| Regra | Limite |
|---|---|
| Alerta de poupança baixa | menos de 10% da renda |
| Elogio de poupança | 20% da renda ou mais |
| Alerta de comprometimento com cartões | mais de 30% da renda |
| Alerta de categoria fora da curva | mais de 20% acima da média |
| Alerta de saldo projetado | saldo acumulado negativo em algum dos 6 meses |

A página avisa, em texto visível, que as informações são educativas e não constituem recomendação financeira profissional.

## Decisões do projeto

- **Banco:** PostgreSQL. O modelo está em [`backend/database/schema.sql`](backend/database/schema.sql).
- **Unicidade garantida pelo banco:** `email` e `cpf` têm `UNIQUE`. Além disso, `CHECK`s obrigam o e-mail a estar em minúsculas e o CPF a ter só dígitos, para ninguém furar a unicidade gravando sem normalizar.
- **Cadastro em transação:** o usuário, as categorias padrão e as fontes/destinos padrão (Conta corrente e Salário) são gravados juntos. Se algo falhar, nada fica gravado.
- **Front sem pasta de utilitários:** o enunciado limita o `src/` do front a `components/`, `contexts/` e `services/`. Funções de formatação e máscara (moeda, datas, CPF) ficam em `frontend/src/services/formatos.js`, e as validações do lado do cliente (mesmo `cpfValido` do back) em `frontend/src/services/validacao.js`.
- **Cliente HTTP único:** `frontend/src/services/api.js` usa o `fetch` nativo, põe o `Authorization` em toda requisição e, se uma requisição autenticada voltar 401, faz logout.
- **Sessão no front:** o `AuthContext` guarda o token no `localStorage` (sobrevive ao recarregar). Ao abrir o app, o token é conferido em `/api/auth/me`. As telas logadas ficam dentro de `RotaProtegida`, que manda para o login quem não tem token e volta para a tela de origem depois de entrar.
- **Login:** o token JWT vale `JWT_EXPIRES_IN` (padrão 1h). E-mail inexistente e senha errada recebem a mesma resposta e levam o mesmo tempo (o bcrypt compara com um hash falso), para não revelar quais e-mails estão cadastrados. Depois de 5 tentativas com falha em 15 minutos, o IP recebe 429.
- **Utilitários puros** (`cpfValido`, validações de e-mail e senha) ficam em `backend/src/models/validacao.js`, junto com o teste deles.
- **Soft-delete:** categorias, fontes/destinos e lançamentos não são apagados de verdade. A exclusão preenche `excluido_em`, e a API só lê e altera pelas views `categorias_ativas`, `fontes_destinos_ativas` e `lancamentos_ativos`. Assim nenhuma consulta precisa lembrar de filtrar os excluídos.
- **Exclusão de categoria ou fonte/destino com lançamentos:** continua recusada com 409, como pede o enunciado. Como o soft-delete não apaga linhas, a chave estrangeira não bloqueia mais nada; quem bloqueia é o próprio `UPDATE`, que só marca como excluída se não existir lançamento ativo usando a categoria. Pelo mesmo motivo, não dá para trocar o tipo de uma categoria (entrada/saída) ou de uma fonte/destino (ex.: cartão para conta) que tem lançamentos. Mudar o fechamento, o vencimento ou o limite de um cartão é permitido.
- **Compras parceladas:** só saídas no cartão de crédito podem ser parceladas (1 a 48 vezes). A API grava uma linha por parcela, todas com o mesmo `grupo_parcelamento`, dentro de uma transação: ou todas são gravadas, ou nenhuma. O valor é dividido em centavos inteiros e a sobra do arredondamento vai para a primeira parcela (R$ 100,00 em 3× = 33,34 + 33,33 + 33,33).
- **Data das parcelas:** todas as parcelas guardam a **data da compra**. A fatura de cada uma é calculada a partir dessa data e do número da parcela. Consequência: a listagem e os relatórios por período contam a compra inteira no mês em que ela foi feita (regime de competência).
- **Edição de parcelas:** dá para editar uma parcela só (descrição, valor e categoria) ou todas de uma vez (`?todasParcelas=true`: descrição, categoria, data, cartão e o valor total da compra, redividido entre as parcelas). Data, cartão e tipo de uma parcela só não mudam sozinhos, porque definem em que fatura ela cai. O número de parcelas não muda na edição: para isso, exclua e lance de novo.
- **Faturas:** a regra de fechamento está em `backend/src/models/fatura.js` (a implementação de referência do enunciado), testada com os 4 exemplos da tabela do enunciado. A fatura de cada parcela é calculada na hora com a data da compra e o número da parcela, então mudar o dia de fechamento de um cartão recalcula tudo. A "fatura aberta" é a fatura em que cairia uma compra feita hoje. O limite utilizado soma todas as parcelas que ainda não venceram (inclusive as que caem depois das faturas mostradas).
- **Período anterior nos relatórios:** se o período é de meses fechados (do dia 1 ao último dia), a comparação é com os mesmos meses imediatamente antes (outubro × setembro inteiro). Em qualquer outro período, com o mesmo número de dias logo antes do início.
- **Nomes únicos entre os ativos:** por causa do soft-delete, o `UNIQUE` de nome de categoria e de fonte/destino é um índice único parcial (`WHERE excluido_em IS NULL`). A regra continua garantida pelo banco, mas excluir "Lazer" permite criar outra "Lazer". O nome também não diferencia maiúsculas (`LOWER(nome)`).

## Uso de IA

O grupo usou assistente de IA (Claude) como apoio para planejamento e escrita de código. Todo o código foi revisado e é explicado pelos integrantes.
