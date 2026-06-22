-- =============================================================
-- ENCIVIL — Segurança crítica: fecha auto-promoção de role
--
-- PROBLEMA: a policy "profiles_update_own" permitia que qualquer
-- utilizador autenticado alterasse a sua própria linha em profiles,
-- incluindo a coluna `role`. Um 'gestor' podia correr:
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', meuId)
-- e tornar-se admin instantaneamente, sem qualquer RPC ou exploit.
--
-- FIX: GRANT a nível de coluna — authenticated só pode UPDATE a
-- coluna `nome`. role/email/id só mudam via RPC SECURITY DEFINER
-- auditada (promover_role), que verifica que o chamador já é admin.
-- =============================================================

-- ── 1. Restringir UPDATE de profiles a colunas seguras ──────────
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (nome) ON public.profiles TO authenticated;

-- ── 2. Remover INSERT direto — a criação de profile é só via
--      trigger handle_new_user() (SECURITY DEFINER, corre como
--      owner da função, não precisa do grant de authenticated) ──
REVOKE INSERT ON public.profiles FROM authenticated;

-- ── 3. Tabela de audit log — rastreia mudanças de role e outras
--      operações sensíveis para detenção/investigação ───────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID REFERENCES auth.users(id),
  action     TEXT NOT NULL,
  target_id  UUID,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor      ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select_admin" ON public.audit_log;
CREATE POLICY "audit_log_select_admin"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ninguém insere directamente — só as RPCs SECURITY DEFINER (bypassa RLS)
REVOKE ALL ON public.audit_log FROM authenticated, anon;
GRANT SELECT ON public.audit_log TO authenticated; -- RLS acima filtra para admin

-- ── 4. RPC segura para alterar role — único caminho legítimo ────
CREATE OR REPLACE FUNCTION public.promover_role(
  p_user_id  UUID,
  p_novo_role role_utilizador
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_profile     public.profiles%ROWTYPE;
BEGIN
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Autorização negada: apenas administradores podem alterar roles.';
  END IF;

  IF p_user_id = auth.uid() AND p_novo_role != 'admin' THEN
    RAISE EXCEPTION 'Não é permitido despromover a própria conta (evita lockout acidental).';
  END IF;

  UPDATE public.profiles
  SET role = p_novo_role
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilizador não encontrado.';
  END IF;

  INSERT INTO public.audit_log (actor_id, action, target_id, details)
  VALUES (auth.uid(), 'role_change', p_user_id, jsonb_build_object('novo_role', p_novo_role));

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.promover_role(UUID, role_utilizador) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promover_role(UUID, role_utilizador) TO authenticated;
