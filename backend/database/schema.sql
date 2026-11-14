-- Recria o banco do zero. Rode com: npm run db:criar
-- ATENÇÃO: apaga todos os dados.

DROP VIEW IF EXISTS lancamentos_ativos, fontes_destinos_ativas, categorias_ativas;
DROP TABLE IF EXISTS lancamentos, fontes_destinos, categorias, usuarios;

CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) NOT NULL,
  cpf         CHAR(11)     NOT NULL,
  senha_hash  VARCHAR(100) NOT NULL,
  criado_em   TIMESTAMP    NOT NULL DEFAULT NOW(),
  -- A unicidade é garantida pelo banco, não por consulta prévia no código.
  -- Os nomes das constraints são usados pela API para dizer qual campo repetiu.
  CONSTRAINT usuarios_email_unico UNIQUE (email),
  CONSTRAINT usuarios_cpf_unico   UNIQUE (cpf),
  -- Garante que ninguém grave sem normalizar, o que furaria o UNIQUE.
  CONSTRAINT usuarios_email_minusculo CHECK (email = LOWER(TRIM(email))),
  CONSTRAINT usuarios_cpf_digitos     CHECK (cpf ~ '^[0-9]{11}$')
);

-- Soft-delete: categorias, fontes/destinos e lançamentos nunca são apagados de
-- verdade. A exclusão preenche excluido_em, e a API só enxerga as views *_ativas.

CREATE TABLE categorias (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome         VARCHAR(60) NOT NULL,
  tipo         VARCHAR(7)  NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  excluido_em  TIMESTAMP
);

-- Nome único por usuário e tipo, entre as categorias ativas. Por ser parcial,
-- excluir "Lazer" permite criar outra "Lazer" depois.
CREATE UNIQUE INDEX categorias_nome_unico
  ON categorias (usuario_id, LOWER(nome), tipo)
  WHERE excluido_em IS NULL;

CREATE TABLE fontes_destinos (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome            VARCHAR(60) NOT NULL,
  tipo            VARCHAR(14) NOT NULL CHECK (tipo IN ('renda', 'conta', 'cartao_credito')),
  dia_fechamento  SMALLINT CHECK (dia_fechamento BETWEEN 1 AND 31),
  dia_vencimento  SMALLINT CHECK (dia_vencimento BETWEEN 1 AND 31),
  limite          NUMERIC(12, 2) CHECK (limite > 0),
  excluido_em     TIMESTAMP,
  CHECK (tipo <> 'cartao_credito'
         OR (dia_fechamento IS NOT NULL AND dia_vencimento IS NOT NULL AND limite IS NOT NULL))
);

CREATE UNIQUE INDEX fontes_destinos_nome_unico
  ON fontes_destinos (usuario_id, LOWER(nome))
  WHERE excluido_em IS NULL;

CREATE TABLE lancamentos (
  id                  SERIAL PRIMARY KEY,
  usuario_id          INTEGER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo                VARCHAR(7)     NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao           VARCHAR(120)   NOT NULL,
  valor               NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  data                DATE           NOT NULL,   -- data da compra (igual em todas as parcelas)
  categoria_id        INTEGER        NOT NULL REFERENCES categorias(id),
  fonte_destino_id    INTEGER        NOT NULL REFERENCES fontes_destinos(id),
  parcela_atual       SMALLINT       NOT NULL DEFAULT 1,
  total_parcelas      SMALLINT       NOT NULL DEFAULT 1 CHECK (total_parcelas BETWEEN 1 AND 48),
  grupo_parcelamento  UUID,                      -- mesmo valor em todas as parcelas de uma compra
  criado_em           TIMESTAMP      NOT NULL DEFAULT NOW(),
  excluido_em         TIMESTAMP,
  CHECK (parcela_atual BETWEEN 1 AND total_parcelas)
);

CREATE INDEX idx_lancamentos_usuario_data ON lancamentos (usuario_id, data);

-- Views de registros ativos. Os models leem e alteram sempre por elas, então
-- um registro excluído some de listagens, relatórios e faturas sem que cada
-- query precise lembrar do filtro. INSERT vai direto na tabela.
CREATE VIEW categorias_ativas AS
  SELECT * FROM categorias WHERE excluido_em IS NULL;

CREATE VIEW fontes_destinos_ativas AS
  SELECT * FROM fontes_destinos WHERE excluido_em IS NULL;

CREATE VIEW lancamentos_ativos AS
  SELECT * FROM lancamentos WHERE excluido_em IS NULL;
