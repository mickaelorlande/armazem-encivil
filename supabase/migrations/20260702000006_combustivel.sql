-- =============================================================
-- ENCIVIL — Módulo Combustível (viaturas/máquinas + abastecimentos)
--
-- A empresa abastece viaturas e máquinas; cada abastecimento pode ser
-- imputado a uma obra (base do custo por obra / job costing).
--
-- Padrão herdado dos módulos existentes:
--   - código automático V0001... pela coluna DEFAULT (nextval só no INSERT)
--   - RLS com escrita controlada pelo papel via public.pode_escrever('combustivel')
--     (admin, gestor, armazem) e leitura para qualquer autenticado
--   - GRANTs explícitos (Automatically expose new tables = OFF)
-- =============================================================

-- ------------------------------------------------------------
-- 1. SEQUÊNCIA + TABELA: comb_veiculos (catálogo)
-- ------------------------------------------------------------
CREATE SEQUENCE comb_veiculo_codigo_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE comb_veiculos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo            TEXT NOT NULL UNIQUE
                      DEFAULT ('V' || LPAD(nextval('comb_veiculo_codigo_seq')::TEXT, 4, '0')),
  nome              TEXT NOT NULL,
  tipo              TEXT NOT NULL DEFAULT 'viatura',
  identificacao     TEXT,                       -- matrícula ou nº de série
  tipo_combustivel  TEXT NOT NULL DEFAULT 'gasoleo',
  unidade_contador  TEXT NOT NULL DEFAULT 'km', -- km ou horas
  ativo             BOOLEAN NOT NULL DEFAULT true,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id) DEFAULT auth.uid(),

  CONSTRAINT ck_veiculo_tipo             CHECK (tipo IN ('viatura', 'maquina', 'gerador', 'outro')),
  CONSTRAINT ck_veiculo_combustivel      CHECK (tipo_combustivel IN ('gasoleo', 'gasolina', 'adblue', 'eletrico', 'outro')),
  CONSTRAINT ck_veiculo_unidade_contador CHECK (unidade_contador IN ('km', 'horas'))
);

ALTER SEQUENCE comb_veiculo_codigo_seq OWNED BY comb_veiculos.codigo;

CREATE INDEX idx_comb_veiculos_ativo ON comb_veiculos(ativo);
CREATE INDEX idx_comb_veiculos_tipo  ON comb_veiculos(tipo);

CREATE TRIGGER trg_comb_veiculos_updated_at
BEFORE UPDATE ON comb_veiculos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Pré-visualização do próximo código (não consome a sequência)
CREATE OR REPLACE FUNCTION public.gerar_codigo_veiculo()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'V' || LPAD(
    (CASE WHEN is_called THEN last_value + 1 ELSE last_value END)::TEXT, 4, '0'
  )
  FROM comb_veiculo_codigo_seq;
$$;

-- ------------------------------------------------------------
-- 2. TABELA: comb_abastecimentos (operacional)
-- ------------------------------------------------------------
CREATE TABLE comb_abastecimentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id    UUID NOT NULL REFERENCES comb_veiculos(id),
  obra_id       UUID REFERENCES obras(id),      -- opcional (nem tudo é imputado a obra)
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  litros        NUMERIC(12, 3) NOT NULL,
  custo_total   NUMERIC(12, 2) NOT NULL,
  contador      NUMERIC(12, 1),                 -- leitura km/horas no momento
  local         TEXT,                           -- posto de abastecimento
  responsavel   TEXT NOT NULL,
  observacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id) DEFAULT auth.uid(),

  CONSTRAINT ck_abast_litros_positivo  CHECK (litros > 0),
  CONSTRAINT ck_abast_custo_nao_neg    CHECK (custo_total >= 0),
  CONSTRAINT ck_abast_contador_nao_neg CHECK (contador IS NULL OR contador >= 0)
);

CREATE INDEX idx_comb_abast_veiculo ON comb_abastecimentos(veiculo_id);
CREATE INDEX idx_comb_abast_obra    ON comb_abastecimentos(obra_id);
CREATE INDEX idx_comb_abast_data    ON comb_abastecimentos(data DESC);

CREATE TRIGGER trg_comb_abast_updated_at
BEFORE UPDATE ON comb_abastecimentos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE comb_veiculos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comb_abastecimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comb_veiculos_select_auth" ON comb_veiculos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comb_veiculos_insert_rbac" ON comb_veiculos
  FOR INSERT TO authenticated WITH CHECK (public.pode_escrever('combustivel'));
CREATE POLICY "comb_veiculos_update_rbac" ON comb_veiculos
  FOR UPDATE TO authenticated USING (public.pode_escrever('combustivel'));

CREATE POLICY "comb_abast_select_auth" ON comb_abastecimentos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comb_abast_insert_rbac" ON comb_abastecimentos
  FOR INSERT TO authenticated WITH CHECK (public.pode_escrever('combustivel'));
CREATE POLICY "comb_abast_update_rbac" ON comb_abastecimentos
  FOR UPDATE TO authenticated USING (public.pode_escrever('combustivel'));
CREATE POLICY "comb_abast_delete_rbac" ON comb_abastecimentos
  FOR DELETE TO authenticated USING (public.pode_escrever('combustivel'));

-- ------------------------------------------------------------
-- 4. GRANTS
-- ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE         ON public.comb_veiculos       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comb_abastecimentos TO authenticated;
GRANT USAGE ON SEQUENCE public.comb_veiculo_codigo_seq TO authenticated;

REVOKE ALL ON public.comb_veiculos       FROM anon;
REVOKE ALL ON public.comb_abastecimentos FROM anon;
REVOKE ALL ON SEQUENCE public.comb_veiculo_codigo_seq FROM anon;

GRANT EXECUTE ON FUNCTION public.gerar_codigo_veiculo() TO authenticated;
