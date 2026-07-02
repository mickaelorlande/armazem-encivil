-- =============================================================
-- ENCIVIL — Fase 1: Obras + Subempreiteiros (contratações)
--
-- Contexto (pedido do chefe): registar as contratações de
-- subempreiteiros por obra, com o valor acordado, para depois (Fase 2)
-- medir o executado (autos da eng. Eduarda) e saber quanto pagar.
--
-- Decisões de negócio confirmadas:
--   - Valor acordado pode ser GLOBAL (preço fechado) ou UNITÁRIO
--     (artigos com preço por unidade). Ambos os casos existem.
--   - Fluxo Rascunho -> Validado: todos veem; enquanto rascunho
--     qualquer utilizador edita; após o admin validar, fica IMUTÁVEL.
--   - Sem retenção/caução. Autos e trabalhos a mais entram na Fase 2
--     (a coluna is_extra já fica preparada nos artigos).
--
-- NOTA (lição das migrations anteriores): este projeto tem
-- "Automatically expose new tables" OFF, por isso os GRANTs explícitos
-- vão já nesta migration (secção 7) — sem eles a API nega o acesso.
-- =============================================================

-- ------------------------------------------------------------
-- 1. ENUMERAÇÕES
-- ------------------------------------------------------------
CREATE TYPE tipo_subempreitada   AS ENUM ('global', 'unitario');
CREATE TYPE estado_subempreitada AS ENUM ('rascunho', 'validado');


-- ------------------------------------------------------------
-- 2. TABELA: obras
--    Cadastro próprio de obras (antes "obra" era texto livre).
-- ------------------------------------------------------------
CREATE TABLE obras (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  cliente      TEXT,
  localizacao  TEXT,
  estado       TEXT NOT NULL DEFAULT 'ativa',
  observacoes  TEXT,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id) DEFAULT auth.uid(),

  CONSTRAINT ck_obra_estado CHECK (estado IN ('ativa', 'concluida'))
);

CREATE INDEX idx_obras_ativo  ON obras(ativo);
CREATE INDEX idx_obras_estado ON obras(estado);

CREATE TRIGGER trg_obras_updated_at
BEFORE UPDATE ON obras
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 3. TABELA: subempreiteiros (uma contratação = um sub numa obra)
-- ------------------------------------------------------------
CREATE TABLE subempreiteiros (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id               UUID NOT NULL REFERENCES obras(id),
  nome                  TEXT NOT NULL,
  contacto_responsavel  TEXT,
  tipo                  tipo_subempreitada   NOT NULL DEFAULT 'global',
  valor_global          NUMERIC(14, 2),   -- usado quando tipo = 'global'
  condicoes             TEXT,             -- observações / condições acordadas
  estado                estado_subempreitada NOT NULL DEFAULT 'rascunho',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  validado_por          UUID REFERENCES auth.users(id),
  validado_em           TIMESTAMPTZ,

  CONSTRAINT ck_valor_global_nao_negativo CHECK (valor_global IS NULL OR valor_global >= 0)
);

CREATE INDEX idx_subempreiteiros_obra_id ON subempreiteiros(obra_id);
CREATE INDEX idx_subempreiteiros_estado  ON subempreiteiros(estado);

CREATE TRIGGER trg_subempreiteiros_updated_at
BEFORE UPDATE ON subempreiteiros
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 4. TABELA: subempreiteiro_artigos (mapa de quantidades — tipo unitário)
--    is_extra marca "trabalhos a mais" acrescentados depois (Fase 2).
-- ------------------------------------------------------------
CREATE TABLE subempreiteiro_artigos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subempreiteiro_id   UUID NOT NULL REFERENCES subempreiteiros(id) ON DELETE CASCADE,
  descricao           TEXT NOT NULL,
  unidade             TEXT NOT NULL,
  preco_unitario      NUMERIC(14, 4) NOT NULL,
  quantidade_prevista NUMERIC(14, 3) NOT NULL,
  is_extra            BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_artigo_preco_nao_negativo CHECK (preco_unitario      >= 0),
  CONSTRAINT ck_artigo_qtd_nao_negativa   CHECK (quantidade_prevista >= 0)
);

CREATE INDEX idx_artigos_subempreiteiro_id ON subempreiteiro_artigos(subempreiteiro_id);


-- ------------------------------------------------------------
-- 5. RPC — validar_subempreiteiro (apenas admin)
--    Trava a contratação: passa a 'validado' e fica imutável (a RLS
--    de UPDATE/DELETE só permite linhas em 'rascunho').
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validar_subempreiteiro(p_id UUID)
RETURNS subempreiteiros
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row     subempreiteiros%ROWTYPE;
  v_artigos INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem validar contratações.';
  END IF;

  SELECT * INTO v_row FROM subempreiteiros WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contratação não encontrada.';
  END IF;
  IF v_row.estado = 'validado' THEN
    RAISE EXCEPTION 'Esta contratação já está validada.';
  END IF;

  -- Completude mínima antes de travar
  IF v_row.tipo = 'global' AND (v_row.valor_global IS NULL OR v_row.valor_global <= 0) THEN
    RAISE EXCEPTION 'Defina o valor acordado antes de validar.';
  END IF;
  IF v_row.tipo = 'unitario' THEN
    SELECT count(*) INTO v_artigos FROM subempreiteiro_artigos WHERE subempreiteiro_id = p_id;
    IF v_artigos = 0 THEN
      RAISE EXCEPTION 'Adicione pelo menos um artigo antes de validar.';
    END IF;
  END IF;

  UPDATE subempreiteiros
  SET estado = 'validado', validado_por = auth.uid(), validado_em = NOW()
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE obras                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subempreiteiros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subempreiteiro_artigos ENABLE ROW LEVEL SECURITY;

-- Obras: todos os autenticados veem e gerem (sem DELETE — arquiva-se via ativo)
CREATE POLICY "obras_select_auth" ON obras FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "obras_insert_auth" ON obras FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "obras_update_auth" ON obras FOR UPDATE TO authenticated USING (true);

-- Subempreiteiros: todos veem; escrita apenas enquanto 'rascunho'.
-- O WITH CHECK impede um utilizador comum de forçar estado='validado'
-- por UPDATE direto — a validação só acontece pela RPC (SECURITY DEFINER,
-- que ignora a RLS).
CREATE POLICY "subempreiteiros_select_auth" ON subempreiteiros
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "subempreiteiros_insert_rascunho" ON subempreiteiros
  FOR INSERT TO authenticated WITH CHECK (estado = 'rascunho');
CREATE POLICY "subempreiteiros_update_rascunho" ON subempreiteiros
  FOR UPDATE TO authenticated USING (estado = 'rascunho') WITH CHECK (estado = 'rascunho');
CREATE POLICY "subempreiteiros_delete_rascunho" ON subempreiteiros
  FOR DELETE TO authenticated USING (estado = 'rascunho');

-- Artigos: todos veem; escrita apenas se a contratação-pai estiver 'rascunho'.
CREATE POLICY "artigos_select_auth" ON subempreiteiro_artigos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "artigos_insert_rascunho" ON subempreiteiro_artigos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM subempreiteiros s WHERE s.id = subempreiteiro_id AND s.estado = 'rascunho')
  );
CREATE POLICY "artigos_update_rascunho" ON subempreiteiro_artigos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM subempreiteiros s WHERE s.id = subempreiteiro_id AND s.estado = 'rascunho')
  );
CREATE POLICY "artigos_delete_rascunho" ON subempreiteiro_artigos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM subempreiteiros s WHERE s.id = subempreiteiro_id AND s.estado = 'rascunho')
  );


-- ------------------------------------------------------------
-- 7. GRANTS (obrigatórios — "expose new tables" está OFF)
-- ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE         ON public.obras                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subempreiteiros        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subempreiteiro_artigos TO authenticated;

REVOKE ALL ON public.obras                  FROM anon;
REVOKE ALL ON public.subempreiteiros        FROM anon;
REVOKE ALL ON public.subempreiteiro_artigos FROM anon;

GRANT EXECUTE ON FUNCTION public.validar_subempreiteiro(UUID) TO authenticated;
