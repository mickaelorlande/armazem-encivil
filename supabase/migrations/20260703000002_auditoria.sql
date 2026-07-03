-- =============================================================
-- ENCIVIL — Auditoria das ações sensíveis
--
-- A tabela audit_log existia mas só a promoção de papel escrevia nela.
-- Passa a registar as ações que movem dinheiro/estado:
--   - validações (contratos e autos) — quem aprovou o quê e quando
--   - eliminações de contratos/autos/abastecimentos (via triggers)
--
-- Tudo escreve via SECURITY DEFINER (a RLS do audit_log só permite
-- leitura a admin; inserção só por funções owner).
-- =============================================================

-- ------------------------------------------------------------
-- 1. validar_subempreiteiro — agora regista no audit_log
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

  INSERT INTO public.audit_log (actor_id, action, target_id, details)
  VALUES (auth.uid(), 'validar_subempreiteiro', p_id,
    jsonb_build_object('nome', v_row.nome, 'obra_id', v_row.obra_id, 'tipo', v_row.tipo, 'valor_global', v_row.valor_global));

  RETURN v_row;
END;
$$;

-- ------------------------------------------------------------
-- 2. validar_auto — agora regista no audit_log
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

  INSERT INTO public.audit_log (actor_id, action, target_id, details)
  VALUES (auth.uid(), 'validar_auto', p_id,
    jsonb_build_object('subempreiteiro_id', v_row.subempreiteiro_id, 'numero', v_row.numero, 'valor_periodo', v_row.valor_periodo));

  RETURN v_row;
END;
$$;

-- ------------------------------------------------------------
-- 3. Trigger genérico de auditoria de eliminações
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, action, target_id, details)
  VALUES (auth.uid(), 'delete_' || TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_del_subempreiteiros ON public.subempreiteiros;
CREATE TRIGGER trg_audit_del_subempreiteiros
  AFTER DELETE ON public.subempreiteiros
  FOR EACH ROW EXECUTE FUNCTION public.audit_delete();

DROP TRIGGER IF EXISTS trg_audit_del_autos ON public.autos_medicao;
CREATE TRIGGER trg_audit_del_autos
  AFTER DELETE ON public.autos_medicao
  FOR EACH ROW EXECUTE FUNCTION public.audit_delete();

DROP TRIGGER IF EXISTS trg_audit_del_abastecimentos ON public.comb_abastecimentos;
CREATE TRIGGER trg_audit_del_abastecimentos
  AFTER DELETE ON public.comb_abastecimentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_delete();
