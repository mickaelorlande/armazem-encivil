-- =============================================================
-- ENCIVIL — Fase 2: Autos de Medição (execução dos subempreiteiros)
--
-- Contexto: a eng. Eduarda mede mensalmente o trabalho executado por
-- cada subempreiteiro. Cada auto calcula o valor executado no período,
-- que alimenta o acumulado "Executado" e o "Falta" da contratação.
--
-- Regras confirmadas:
--   - Autos mensais; servem para PAGAR ao subempreiteiro.
--   - Dois tipos (herdados da contratação):
--       * global    -> mede-se a % executada no período
--       * unitário  -> medem-se quantidades por artigo (qtd x preço)
--   - Trabalhos a mais (extras): linhas livres num auto (is_extra=true),
--     não ligadas a um artigo do contrato original.
--   - Fluxo Rascunho -> Validado: todos veem; enquanto rascunho edita-se;
--     após o admin validar, fica imutável (RLS + RPC admin-only).
--   - valor_periodo é gravado já calculado, para o acumulado "Executado"
--     ser uma simples soma dos autos validados.
--
-- GRANTs incluídos (Automatically expose new tables = OFF).
-- =============================================================

CREATE TYPE estado_auto AS ENUM ('rascunho', 'validado');

-- ------------------------------------------------------------
-- 1. TABELA: autos_medicao
-- ------------------------------------------------------------
CREATE TABLE autos_medicao (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subempreiteiro_id    UUID NOT NULL REFERENCES subempreiteiros(id),
  numero               INT  NOT NULL,
  data_medicao         DATE NOT NULL DEFAULT CURRENT_DATE,
  percentagem_periodo  NUMERIC(6, 3),           -- usado no tipo 'global'
  valor_periodo        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  observacoes          TEXT,
  estado               estado_auto NOT NULL DEFAULT 'rascunho',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  validado_por         UUID REFERENCES auth.users(id),
  validado_em          TIMESTAMPTZ,

  CONSTRAINT ck_auto_valor_nao_negativo CHECK (valor_periodo >= 0)
);

CREATE INDEX idx_autos_subempreiteiro ON autos_medicao(subempreiteiro_id);
CREATE INDEX idx_autos_estado         ON autos_medicao(estado);

CREATE TRIGGER trg_autos_updated_at
BEFORE UPDATE ON autos_medicao
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 2. TABELA: auto_linhas
--    Unitário: uma linha por artigo medido (artigo_id preenchido).
--    Extras (trabalhos a mais): artigo_id NULL e is_extra = true.
-- ------------------------------------------------------------
CREATE TABLE auto_linhas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_id         UUID NOT NULL REFERENCES autos_medicao(id) ON DELETE CASCADE,
  artigo_id       UUID REFERENCES subempreiteiro_artigos(id),
  descricao       TEXT NOT NULL,
  unidade         TEXT NOT NULL,
  preco_unitario  NUMERIC(14, 4) NOT NULL,
  quantidade      NUMERIC(14, 3) NOT NULL,
  is_extra        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_linha_preco_nao_negativo CHECK (preco_unitario >= 0),
  CONSTRAINT ck_linha_qtd_nao_negativa   CHECK (quantidade     >= 0)
);

CREATE INDEX idx_auto_linhas_auto   ON auto_linhas(auto_id);
CREATE INDEX idx_auto_linhas_artigo ON auto_linhas(artigo_id);


-- ------------------------------------------------------------
-- 3. RPC — validar_auto (apenas admin)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validar_auto(p_id UUID)
RETURNS autos_medicao
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row autos_medicao%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem validar autos.';
  END IF;

  SELECT * INTO v_row FROM autos_medicao WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auto não encontrado.';
  END IF;
  IF v_row.estado = 'validado' THEN
    RAISE EXCEPTION 'Este auto já está validado.';
  END IF;
  IF v_row.valor_periodo <= 0 THEN
    RAISE EXCEPTION 'O auto não tem valor medido. Preencha as medições antes de validar.';
  END IF;

  UPDATE autos_medicao
  SET estado = 'validado', validado_por = auth.uid(), validado_em = NOW()
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (mesmo padrão dos subempreiteiros)
-- ------------------------------------------------------------
ALTER TABLE autos_medicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_linhas   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autos_select_auth" ON autos_medicao
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "autos_insert_rascunho" ON autos_medicao
  FOR INSERT TO authenticated WITH CHECK (estado = 'rascunho');
CREATE POLICY "autos_update_rascunho" ON autos_medicao
  FOR UPDATE TO authenticated USING (estado = 'rascunho') WITH CHECK (estado = 'rascunho');
CREATE POLICY "autos_delete_rascunho" ON autos_medicao
  FOR DELETE TO authenticated USING (estado = 'rascunho');

CREATE POLICY "auto_linhas_select_auth" ON auto_linhas
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auto_linhas_insert_rascunho" ON auto_linhas
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM autos_medicao a WHERE a.id = auto_id AND a.estado = 'rascunho')
  );
CREATE POLICY "auto_linhas_update_rascunho" ON auto_linhas
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM autos_medicao a WHERE a.id = auto_id AND a.estado = 'rascunho')
  );
CREATE POLICY "auto_linhas_delete_rascunho" ON auto_linhas
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM autos_medicao a WHERE a.id = auto_id AND a.estado = 'rascunho')
  );


-- ------------------------------------------------------------
-- 5. GRANTS
-- ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autos_medicao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_linhas   TO authenticated;

REVOKE ALL ON public.autos_medicao FROM anon;
REVOKE ALL ON public.auto_linhas   FROM anon;

GRANT EXECUTE ON FUNCTION public.validar_auto(UUID) TO authenticated;
