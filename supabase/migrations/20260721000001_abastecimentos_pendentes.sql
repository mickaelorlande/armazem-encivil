-- ================================================================
-- ENCIVIL — Abastecimentos Pendentes (QR Code sem login)
--
-- Motoristas/operadores registam abastecimentos via QR code colado
-- na viatura, SEM login. Os registos ficam pendentes até aprovação
-- do gestor em CombustivelPage > aba "Pendentes".
--
-- APLICAR: colar no SQL Editor do Supabase e executar.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.comb_abastecimentos_pendentes (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id       uuid          NOT NULL REFERENCES public.comb_veiculos(id) ON DELETE CASCADE,
  veiculo_nome     text          NOT NULL,
  funcionario_nome text          NOT NULL,
  data             date          NOT NULL DEFAULT CURRENT_DATE,
  litros           numeric(12,3) NOT NULL,
  custo_total      numeric(12,2) NOT NULL,
  contador         numeric(12,1),
  local            text,
  observacoes      text,
  criado_em        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT ck_pend_litros   CHECK (litros > 0),
  CONSTRAINT ck_pend_custo    CHECK (custo_total >= 0),
  CONSTRAINT ck_pend_contador CHECK (contador IS NULL OR contador >= 0)
);

ALTER TABLE public.comb_abastecimentos_pendentes ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (formulário QR code sem login)
CREATE POLICY "pend_anon_insert"
  ON public.comb_abastecimentos_pendentes
  FOR INSERT TO anon
  WITH CHECK (true);

-- Autenticados com acesso a combustível podem ver os pendentes
CREATE POLICY "pend_auth_select"
  ON public.comb_abastecimentos_pendentes
  FOR SELECT TO authenticated
  USING (true);

-- Só quem pode escrever em combustível pode eliminar (via RPCs abaixo)
CREATE POLICY "pend_auth_delete"
  ON public.comb_abastecimentos_pendentes
  FOR DELETE TO authenticated
  USING (public.pode_escrever('combustivel'));

GRANT INSERT                ON public.comb_abastecimentos_pendentes TO anon;
GRANT SELECT, DELETE        ON public.comb_abastecimentos_pendentes TO authenticated;

-- ── RPC: Aprovar ──────────────────────────────────────────────────
-- Move o registo pendente para comb_abastecimentos (transação atómica).

CREATE OR REPLACE FUNCTION public.aprovar_abastecimento_pendente(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pend public.comb_abastecimentos_pendentes%ROWTYPE;
BEGIN
  IF NOT public.pode_escrever('combustivel') THEN
    RAISE EXCEPTION 'Sem permissão para aprovar abastecimentos';
  END IF;

  SELECT * INTO v_pend
  FROM public.comb_abastecimentos_pendentes
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registo pendente não encontrado: %', p_id;
  END IF;

  INSERT INTO public.comb_abastecimentos
    (veiculo_id, data, litros, custo_total, contador, local, responsavel, observacoes)
  VALUES
    (v_pend.veiculo_id, v_pend.data, v_pend.litros, v_pend.custo_total,
     v_pend.contador, v_pend.local, v_pend.funcionario_nome, v_pend.observacoes);

  DELETE FROM public.comb_abastecimentos_pendentes WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_abastecimento_pendente(uuid) TO authenticated;

-- ── RPC: Rejeitar ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rejeitar_abastecimento_pendente(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.pode_escrever('combustivel') THEN
    RAISE EXCEPTION 'Sem permissão para rejeitar abastecimentos';
  END IF;

  DELETE FROM public.comb_abastecimentos_pendentes WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registo pendente não encontrado: %', p_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rejeitar_abastecimento_pendente(uuid) TO authenticated;
