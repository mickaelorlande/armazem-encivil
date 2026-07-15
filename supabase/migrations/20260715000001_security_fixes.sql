-- =============================================================
-- ENCIVIL — Correções de segurança (2026-07-15)
--
-- 1. profiles_select: admin passa a ver todos os profiles
--    (necessário para gestão de utilizadores na SettingsPage).
--    auth_role() é SECURITY DEFINER — evita recursão RLS.
--
-- 2. Limites de tamanho nas colunas de assinatura PNG base64.
--    ~150KB PNG → ~200KB base64. Limite: 204800 chars (~200KB).
--    Protege contra payload inflacionado por utilizador autenticado.
-- =============================================================

-- ------------------------------------------------------------
-- 1. profiles — admin pode ver todos os perfis
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.auth_role() = 'admin'
  );

-- Admin pode ver todos os emails (necessário para SettingsPage de gestão)
-- Nota: a política de UPDATE permanece restrita à coluna `nome` (via GRANT coluna).

-- ------------------------------------------------------------
-- 2. emprestimos_ferramentas — limites de tamanho das assinaturas
-- ------------------------------------------------------------
ALTER TABLE public.emprestimos_ferramentas
  ADD CONSTRAINT ck_sig_entrega_size
    CHECK (assinatura_entrega IS NULL OR length(assinatura_entrega) <= 204800),
  ADD CONSTRAINT ck_sig_devolucao_size
    CHECK (assinatura_devolucao IS NULL OR length(assinatura_devolucao) <= 204800),
  ADD CONSTRAINT ck_sig_resp_ent_size
    CHECK (assinatura_responsavel_entrega IS NULL OR length(assinatura_responsavel_entrega) <= 204800),
  ADD CONSTRAINT ck_sig_resp_dev_size
    CHECK (assinatura_responsavel_devolucao IS NULL OR length(assinatura_responsavel_devolucao) <= 204800);
