-- =============================================================
-- ENCIVIL Armazém — Migration inicial completa
-- Inclui: schema, triggers, índices, RLS, seed
-- =============================================================

-- ------------------------------------------------------------
-- 1. ENUMERAÇÕES
-- ------------------------------------------------------------
CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste');
CREATE TYPE role_utilizador AS ENUM ('admin');


-- ------------------------------------------------------------
-- 2. FUNÇÃO UTILITÁRIA — updated_at automático
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------
-- 3. TABELA: profiles
--    Extensão de auth.users; criado automaticamente por trigger.
-- ------------------------------------------------------------
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       role_utilizador NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);


-- ------------------------------------------------------------
-- 4. TRIGGER — cria profile automaticamente no signup
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ------------------------------------------------------------
-- 5. TABELA: produtos
-- ------------------------------------------------------------
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

  CONSTRAINT ck_stock_atual_nao_negativo  CHECK (stock_atual  >= 0),
  CONSTRAINT ck_stock_minimo_nao_negativo CHECK (stock_minimo >= 0)
);

CREATE INDEX idx_produtos_codigo    ON produtos(codigo);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_ativo     ON produtos(ativo);

CREATE TRIGGER trg_produtos_updated_at
BEFORE UPDATE ON produtos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 6. TABELA: movimentos_stock   (IMUTÁVEL — nunca apagar)
-- ------------------------------------------------------------
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

  CONSTRAINT ck_quantidade_positiva        CHECK (quantidade   >  0),
  CONSTRAINT ck_stock_depois_nao_negativo  CHECK (stock_depois >= 0),
  CONSTRAINT ck_destino_obrigatorio_saida  CHECK (
    tipo != 'saida' OR (destino_obra IS NOT NULL AND destino_obra != '')
  )
);

CREATE INDEX idx_movimentos_produto_id   ON movimentos_stock(produto_id);
CREATE INDEX idx_movimentos_created_at   ON movimentos_stock(created_at DESC);
CREATE INDEX idx_movimentos_tipo         ON movimentos_stock(tipo);
CREATE INDEX idx_movimentos_responsavel  ON movimentos_stock(responsavel);
CREATE INDEX idx_movimentos_destino_obra ON movimentos_stock(destino_obra);
CREATE INDEX idx_movimentos_created_by   ON movimentos_stock(created_by);


-- ------------------------------------------------------------
-- 7. TABELA: configuracoes_empresa   (singleton — 1 linha)
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- 8. FUNÇÃO RPC — registar_movimento (transação atômica)
--    Grava o movimento + atualiza stock_atual em 1 transação.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION registar_movimento(
  p_produto_id   UUID,
  p_tipo         tipo_movimento,
  p_quantidade   NUMERIC,
  p_responsavel  TEXT,
  p_destino_obra TEXT DEFAULT NULL,
  p_observacoes  TEXT DEFAULT NULL
)
RETURNS movimentos_stock
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_produto       produtos%ROWTYPE;
  v_stock_antes   NUMERIC(12, 3);
  v_stock_depois  NUMERIC(12, 3);
  v_movimento     movimentos_stock%ROWTYPE;
BEGIN
  -- Bloqueia o produto para evitar race conditions
  SELECT * INTO v_produto
  FROM produtos
  WHERE id = p_produto_id AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou inativo.';
  END IF;

  v_stock_antes := v_produto.stock_atual;

  -- Calcula novo stock conforme tipo
  CASE p_tipo
    WHEN 'entrada' THEN
      v_stock_depois := v_stock_antes + p_quantidade;
    WHEN 'saida' THEN
      IF p_quantidade > v_stock_antes THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponível: %, Pedido: %',
          v_stock_antes, p_quantidade;
      END IF;
      v_stock_depois := v_stock_antes - p_quantidade;
    WHEN 'ajuste' THEN
      v_stock_depois := p_quantidade;
  END CASE;

  -- Atualiza stock do produto
  UPDATE produtos
  SET stock_atual = v_stock_depois
  WHERE id = p_produto_id;

  -- Regista o movimento
  INSERT INTO movimentos_stock (
    produto_id, tipo, quantidade,
    stock_antes, stock_depois,
    responsavel, destino_obra, observacoes,
    created_by
  ) VALUES (
    p_produto_id, p_tipo, p_quantidade,
    v_stock_antes, v_stock_depois,
    p_responsavel, p_destino_obra, p_observacoes,
    auth.uid()
  )
  RETURNING * INTO v_movimento;

  RETURN v_movimento;
END;
$$;


-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY — ativar em todas as tabelas
-- ------------------------------------------------------------
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_stock      ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_empresa ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 10. POLÍTICAS RLS — profiles
-- ------------------------------------------------------------
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);


-- ------------------------------------------------------------
-- 11. POLÍTICAS RLS — produtos
-- ------------------------------------------------------------
CREATE POLICY "produtos_select_auth"
ON produtos FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "produtos_insert_auth"
ON produtos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "produtos_update_auth"
ON produtos FOR UPDATE
USING (auth.role() = 'authenticated');

-- SEM policy DELETE: ninguém apaga produtos fisicamente


-- ------------------------------------------------------------
-- 12. POLÍTICAS RLS — movimentos_stock
-- ------------------------------------------------------------
CREATE POLICY "movimentos_select_auth"
ON movimentos_stock FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "movimentos_insert_auth"
ON movimentos_stock FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- SEM policies UPDATE/DELETE: movimentos são imutáveis


-- ------------------------------------------------------------
-- 13. POLÍTICAS RLS — configuracoes_empresa
-- ------------------------------------------------------------
CREATE POLICY "config_select_auth"
ON configuracoes_empresa FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "config_update_auth"
ON configuracoes_empresa FOR UPDATE
USING (auth.role() = 'authenticated');


-- ------------------------------------------------------------
-- 14. SEED — linha inicial de configurações
-- ------------------------------------------------------------
INSERT INTO configuracoes_empresa (nome_empresa, stock_minimo_padrao)
VALUES ('ENCIVIL', 10);
