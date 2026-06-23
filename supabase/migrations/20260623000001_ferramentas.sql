-- =============================================================
-- ENCIVIL — Módulo de Ferramentas (empréstimo de equipamento)
--
-- A empresa também empresta ferramentas/equipamento aos
-- funcionários para uso em obra. Este módulo replica o padrão já
-- usado em produtos/movimentos_stock:
--   - código automático (F0001, F0002, ...) gerado pela coluna
--     DEFAULT (nextval), nunca pela função de pré-visualização
--     (lição aprendida na migration de produtos: nextval só deve
--     ser consumido no INSERT real, nunca ao abrir um modal)
--   - RPCs SECURITY DEFINER para operações atómicas (emprestar /
--     devolver), com FOR UPDATE para evitar race conditions
--   - RLS: leitura para qualquer utilizador autenticado; escrita
--     restrita por papel (role)
-- =============================================================

-- ------------------------------------------------------------
-- 1. ENUMERAÇÕES
-- ------------------------------------------------------------
CREATE TYPE estado_ferramenta  AS ENUM ('disponivel', 'emprestada', 'manutencao', 'inativa');
CREATE TYPE estado_emprestimo  AS ENUM ('ativo', 'devolvido');
CREATE TYPE condicao_devolucao AS ENUM ('bom_estado', 'danificada', 'perdida');


-- ------------------------------------------------------------
-- 2. SEQUÊNCIA + TABELA: ferramentas
-- ------------------------------------------------------------
CREATE SEQUENCE ferramenta_codigo_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE ferramentas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT NOT NULL UNIQUE
                    DEFAULT ('F' || LPAD(nextval('ferramenta_codigo_seq')::TEXT, 4, '0')),
  nome            TEXT NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'outro',
  numero_serie    TEXT,
  valor_estimado  NUMERIC(12, 2),
  estado          estado_ferramenta NOT NULL DEFAULT 'disponivel',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_valor_estimado_nao_negativo CHECK (valor_estimado IS NULL OR valor_estimado >= 0)
);

ALTER SEQUENCE ferramenta_codigo_seq OWNED BY ferramentas.codigo;

CREATE INDEX idx_ferramentas_codigo    ON ferramentas(codigo);
CREATE INDEX idx_ferramentas_categoria ON ferramentas(categoria);
CREATE INDEX idx_ferramentas_estado    ON ferramentas(estado);
CREATE INDEX idx_ferramentas_ativo     ON ferramentas(ativo);

CREATE TRIGGER trg_ferramentas_updated_at
BEFORE UPDATE ON ferramentas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN ferramentas.codigo IS
  'Código automático e imutável (F0001, F0002, ...). Atribuído pela '
  'coluna DEFAULT no momento do INSERT — nunca editável pelo utilizador.';


-- ------------------------------------------------------------
-- 3. FUNÇÃO RPC — pré-visualização do próximo código (não consome)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gerar_codigo_ferramenta()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'F' || LPAD(
    (CASE WHEN is_called THEN last_value + 1 ELSE last_value END)::TEXT,
    4, '0'
  )
  FROM ferramenta_codigo_seq;
$$;

COMMENT ON FUNCTION public.gerar_codigo_ferramenta() IS
  'Pré-visualização do próximo código de ferramenta. Não consome a sequência — '
  'o valor real é atribuído pela coluna DEFAULT de ferramentas.codigo apenas '
  'quando a ferramenta é efetivamente criada (INSERT).';


-- ------------------------------------------------------------
-- 4. TABELA: emprestimos_ferramentas
--    Ciclo de vida: criado no empréstimo (estado='ativo'),
--    atualizado na devolução (estado='devolvido'). Ao contrário de
--    movimentos_stock, esta tabela NÃO é imutável — a devolução é
--    um UPDATE controlado pela RPC registar_devolucao_ferramenta.
-- ------------------------------------------------------------
CREATE TABLE emprestimos_ferramentas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ferramenta_id            UUID NOT NULL REFERENCES ferramentas(id),
  funcionario_nome         TEXT NOT NULL,
  funcionario_documento    TEXT,
  destino_obra             TEXT,
  data_emprestimo          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_prevista_devolucao  DATE,
  data_devolucao           TIMESTAMPTZ,
  estado                   estado_emprestimo NOT NULL DEFAULT 'ativo',
  condicao_entrega         TEXT,
  condicao_devolucao       condicao_devolucao,
  observacoes              TEXT,
  observacoes_devolucao    TEXT,
  responsavel_entrega      TEXT NOT NULL,
  responsavel_recebimento  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by               UUID REFERENCES auth.users(id),

  CONSTRAINT ck_devolucao_consistente CHECK (
    (estado = 'ativo'      AND data_devolucao IS NULL) OR
    (estado = 'devolvido'  AND data_devolucao IS NOT NULL)
  )
);

CREATE INDEX idx_emprestimos_ferramenta_id  ON emprestimos_ferramentas(ferramenta_id);
CREATE INDEX idx_emprestimos_estado         ON emprestimos_ferramentas(estado);
CREATE INDEX idx_emprestimos_funcionario    ON emprestimos_ferramentas(funcionario_nome);
CREATE INDEX idx_emprestimos_data_emprestimo ON emprestimos_ferramentas(data_emprestimo DESC);
CREATE INDEX idx_emprestimos_destino_obra   ON emprestimos_ferramentas(destino_obra);
CREATE INDEX idx_emprestimos_created_by     ON emprestimos_ferramentas(created_by);

CREATE TRIGGER trg_emprestimos_updated_at
BEFORE UPDATE ON emprestimos_ferramentas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 5. CONFIGURAÇÕES DA EMPRESA — campos necessários para o
--    cabeçalho legal do Termo de Responsabilidade.
-- ------------------------------------------------------------
ALTER TABLE configuracoes_empresa
  ADD COLUMN nif_empresa  TEXT,
  ADD COLUMN sede_empresa TEXT;


-- ------------------------------------------------------------
-- 6. RPC — registar_emprestimo_ferramenta (transação atómica)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION registar_emprestimo_ferramenta(
  p_ferramenta_id            UUID,
  p_funcionario_nome         TEXT,
  p_responsavel_entrega      TEXT,
  p_funcionario_documento    TEXT DEFAULT NULL,
  p_destino_obra             TEXT DEFAULT NULL,
  p_data_prevista_devolucao  DATE DEFAULT NULL,
  p_condicao_entrega         TEXT DEFAULT NULL,
  p_observacoes              TEXT DEFAULT NULL
)
RETURNS emprestimos_ferramentas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ferramenta  ferramentas%ROWTYPE;
  v_emprestimo  emprestimos_ferramentas%ROWTYPE;
BEGIN
  SELECT * INTO v_ferramenta
  FROM ferramentas
  WHERE id = p_ferramenta_id AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ferramenta não encontrada ou inativa.';
  END IF;

  IF v_ferramenta.estado != 'disponivel' THEN
    RAISE EXCEPTION 'Ferramenta "%" não está disponível (estado atual: %).',
      v_ferramenta.nome, v_ferramenta.estado;
  END IF;

  UPDATE ferramentas
  SET estado = 'emprestada'
  WHERE id = p_ferramenta_id;

  INSERT INTO emprestimos_ferramentas (
    ferramenta_id, funcionario_nome, funcionario_documento,
    destino_obra, data_prevista_devolucao, condicao_entrega,
    observacoes, responsavel_entrega, created_by
  ) VALUES (
    p_ferramenta_id, p_funcionario_nome, p_funcionario_documento,
    p_destino_obra, p_data_prevista_devolucao, p_condicao_entrega,
    p_observacoes, p_responsavel_entrega, auth.uid()
  )
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;


-- ------------------------------------------------------------
-- 7. RPC — registar_devolucao_ferramenta (transação atómica)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION registar_devolucao_ferramenta(
  p_emprestimo_id           UUID,
  p_condicao_devolucao      condicao_devolucao,
  p_responsavel_recebimento TEXT,
  p_observacoes_devolucao   TEXT DEFAULT NULL
)
RETURNS emprestimos_ferramentas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emprestimo      emprestimos_ferramentas%ROWTYPE;
  v_novo_estado     estado_ferramenta;
BEGIN
  SELECT * INTO v_emprestimo
  FROM emprestimos_ferramentas
  WHERE id = p_emprestimo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado.';
  END IF;

  IF v_emprestimo.estado != 'ativo' THEN
    RAISE EXCEPTION 'Este empréstimo já foi devolvido.';
  END IF;

  -- Bloqueia também a ferramenta, para evitar race condition com um
  -- novo empréstimo a ser registado em simultâneo.
  PERFORM 1 FROM ferramentas WHERE id = v_emprestimo.ferramenta_id FOR UPDATE;

  v_novo_estado := CASE p_condicao_devolucao
    WHEN 'bom_estado' THEN 'disponivel'
    WHEN 'danificada' THEN 'manutencao'
    WHEN 'perdida'    THEN 'inativa'
  END;

  UPDATE ferramentas
  SET estado = v_novo_estado
  WHERE id = v_emprestimo.ferramenta_id;

  UPDATE emprestimos_ferramentas
  SET
    estado                  = 'devolvido',
    data_devolucao          = NOW(),
    condicao_devolucao      = p_condicao_devolucao,
    observacoes_devolucao   = p_observacoes_devolucao,
    responsavel_recebimento = p_responsavel_recebimento
  WHERE id = p_emprestimo_id
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;


-- ------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE ferramentas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE emprestimos_ferramentas ENABLE ROW LEVEL SECURITY;

-- ferramentas: catálogo gerido apenas por admin (mesmo padrão de produtos)
CREATE POLICY "ferramentas_select_auth"
ON ferramentas FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "ferramentas_insert_admin"
ON ferramentas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "ferramentas_update_admin"
ON ferramentas FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- emprestimos_ferramentas: admin e gestor podem registar empréstimo/devolução
-- (decisão do chefe — quem está na obra a entregar a ferramenta é muitas
-- vezes o encarregado, não o admin no escritório)
CREATE POLICY "emprestimos_select_auth"
ON emprestimos_ferramentas FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "emprestimos_insert_admin_gestor"
ON emprestimos_ferramentas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
);

CREATE POLICY "emprestimos_update_admin_gestor"
ON emprestimos_ferramentas FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
);

-- SEM policies DELETE em nenhuma das duas tabelas — histórico preserva-se sempre.
