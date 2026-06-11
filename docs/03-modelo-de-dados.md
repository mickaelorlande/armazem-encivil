# Modelo de Dados — Controle Armazém ENCIVIL

Base de dados: Supabase / PostgreSQL

---

## Enumerações

```sql
CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste');
CREATE TYPE role_utilizador AS ENUM ('admin');
CREATE TYPE estado_stock AS ENUM ('normal', 'baixo', 'sem_stock');
```

---

## Tabela: profiles

Perfis de utilizadores autenticados. Extensão da tabela `auth.users` do Supabase.

```sql
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       role_utilizador NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Índices:**
```sql
CREATE INDEX idx_profiles_email ON profiles(email);
```

**Notas:**
- `id` corresponde ao `auth.users.id` do Supabase Auth.
- No MVP existe apenas um utilizador com role `admin`.
- Trigger automático cria o perfil quando um utilizador é registado.

---

## Tabela: produtos

Materiais de armazém geridos pelo sistema.

```sql
CREATE TABLE produtos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT NOT NULL UNIQUE,
  nome         TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  unidade      TEXT NOT NULL,
  stock_atual  NUMERIC(12, 3) NOT NULL DEFAULT 0,
  stock_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  observacoes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_stock_atual_nao_negativo CHECK (stock_atual >= 0),
  CONSTRAINT ck_stock_minimo_nao_negativo CHECK (stock_minimo >= 0)
);
```

**Índices:**
```sql
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
```

**Trigger para updated_at:**
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_produtos_updated_at
BEFORE UPDATE ON produtos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Tabela: movimentos_stock

Histórico imutável de todos os movimentos de stock. **Nunca apagar registos desta tabela.**

```sql
CREATE TABLE movimentos_stock (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id   UUID NOT NULL REFERENCES produtos(id),
  tipo         tipo_movimento NOT NULL,
  quantidade   NUMERIC(12, 3) NOT NULL,
  stock_antes  NUMERIC(12, 3) NOT NULL,
  stock_depois NUMERIC(12, 3) NOT NULL,
  responsavel  TEXT NOT NULL,
  destino_obra TEXT,
  observacoes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id),

  CONSTRAINT ck_quantidade_positiva CHECK (quantidade > 0),
  CONSTRAINT ck_stock_depois_nao_negativo CHECK (stock_depois >= 0),
  CONSTRAINT ck_destino_obrigatorio_saida CHECK (
    tipo != 'saida' OR (tipo = 'saida' AND destino_obra IS NOT NULL AND destino_obra != '')
  )
);
```

**Índices:**
```sql
CREATE INDEX idx_movimentos_produto_id ON movimentos_stock(produto_id);
CREATE INDEX idx_movimentos_created_at ON movimentos_stock(created_at DESC);
CREATE INDEX idx_movimentos_tipo ON movimentos_stock(tipo);
CREATE INDEX idx_movimentos_responsavel ON movimentos_stock(responsavel);
CREATE INDEX idx_movimentos_destino_obra ON movimentos_stock(destino_obra);
CREATE INDEX idx_movimentos_created_by ON movimentos_stock(created_by);
```

**Notas importantes:**
- `stock_antes` e `stock_depois` são gravados no momento do movimento para garantir auditabilidade.
- Relatórios calculam-se a partir desta tabela, nunca apenas de `produtos.stock_atual`.
- `created_by` é o utilizador autenticado que submeteu o movimento.
- `responsavel` é o nome da pessoa física (pode ser diferente do utilizador que submeteu, ex: encarregado).

---

## Tabela: configuracoes_empresa

Configurações globais do sistema. Apenas uma linha (singleton).

```sql
CREATE TABLE configuracoes_empresa (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa        TEXT NOT NULL DEFAULT 'ENCIVIL',
  logo_url            TEXT,
  responsavel_armazem TEXT,
  stock_minimo_padrao NUMERIC(12, 3) NOT NULL DEFAULT 10,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_stock_minimo_padrao_nao_negativo CHECK (stock_minimo_padrao >= 0)
);

CREATE TRIGGER trg_config_updated_at
BEFORE UPDATE ON configuracoes_empresa
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Relacionamentos

```
auth.users (Supabase)
    └── profiles (1:1)

profiles
    └── movimentos_stock.created_by (1:N)

produtos
    └── movimentos_stock.produto_id (1:N)
```

---

## Estratégia de Auditoria

- `movimentos_stock` é a fonte de auditoria principal — nunca apagar.
- Campos `stock_antes` e `stock_depois` garantem rastreabilidade total.
- `created_by` identifica o utilizador autenticado que submeteu.
- `responsavel` identifica a pessoa física responsável pelo movimento.
- Para auditoria avançada (Fase 2): ativar Supabase Audit Logging ou usar extensão `pgaudit`.

---

## Campos para Relatórios

Os seguintes campos em `movimentos_stock` são necessários para os relatórios:

| Campo | Relatório |
|-------|-----------|
| `created_at` | Diário, semanal, mensal, anual |
| `tipo` | Separar entradas de saídas |
| `quantidade` | Totais e somas |
| `produto_id` | Por produto |
| `destino_obra` | Por obra |
| `responsavel` | Por responsável |
| `stock_depois` | Estado de stock em dado momento |

---

## Migration SQL Completa

```sql
-- 1. Enumerações
CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste');
CREATE TYPE role_utilizador AS ENUM ('admin');

-- 2. Função updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. profiles
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       role_utilizador NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. produtos
CREATE TABLE produtos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT NOT NULL UNIQUE,
  nome         TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  unidade      TEXT NOT NULL,
  stock_atual  NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_atual >= 0),
  stock_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  ativo        BOOLEAN NOT NULL DEFAULT true,
  observacoes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_produtos_updated_at
BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. movimentos_stock
CREATE TABLE movimentos_stock (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id   UUID NOT NULL REFERENCES produtos(id),
  tipo         tipo_movimento NOT NULL,
  quantidade   NUMERIC(12, 3) NOT NULL CHECK (quantidade > 0),
  stock_antes  NUMERIC(12, 3) NOT NULL,
  stock_depois NUMERIC(12, 3) NOT NULL CHECK (stock_depois >= 0),
  responsavel  TEXT NOT NULL,
  destino_obra TEXT,
  observacoes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id),
  CONSTRAINT ck_destino_obrigatorio_saida CHECK (
    tipo != 'saida' OR destino_obra IS NOT NULL AND destino_obra != ''
  )
);

-- 6. configuracoes_empresa
CREATE TABLE configuracoes_empresa (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa        TEXT NOT NULL DEFAULT 'ENCIVIL',
  logo_url            TEXT,
  responsavel_armazem TEXT,
  stock_minimo_padrao NUMERIC(12, 3) NOT NULL DEFAULT 10 CHECK (stock_minimo_padrao >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_config_updated_at
BEFORE UPDATE ON configuracoes_empresa FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Índices
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_movimentos_produto_id ON movimentos_stock(produto_id);
CREATE INDEX idx_movimentos_created_at ON movimentos_stock(created_at DESC);
CREATE INDEX idx_movimentos_tipo ON movimentos_stock(tipo);
CREATE INDEX idx_movimentos_destino_obra ON movimentos_stock(destino_obra);

-- 8. Dados iniciais
INSERT INTO configuracoes_empresa (nome_empresa, stock_minimo_padrao)
VALUES ('ENCIVIL', 10);
```
