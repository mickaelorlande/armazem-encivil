-- =============================================================
-- ENCIVIL — RBAC (parte B): helper central + RLS de escrita por papel
--
-- Fonte única da verdade das permissões de ESCRITA por módulo:
--   public.pode_escrever(modulo). A UI lê a mesma matriz conceptual,
--   mas a segurança real é esta RLS.
--
-- Matriz (ver ARCHITECTURE.md §5):
--   armazem/ferramentas/combustivel -> admin, gestor, armazem
--   obras                           -> admin, gestor
--   subempreitadas (contratos/autos)-> admin, gestor, medicoes
--   validação (rascunho->validado)  -> admin  (já nas RPCs)
--
-- SELECT continua aberto a qualquer autenticado (todos os papéis leem).
--
-- Seguro em produção: 'admin' está em todas as capacidades; utilizadores
-- atuais (todos admin) não perdem acesso. Onde antes era 'authenticated'
-- (obras, subempreiteiros, autos) passa a exigir papel — mas como só
-- existem admins, não afeta ninguém hoje.
-- =============================================================

-- ------------------------------------------------------------
-- 1. Helpers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.pode_escrever(modulo TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE modulo
    WHEN 'armazem'        THEN public.auth_role() IN ('admin', 'gestor', 'armazem')
    WHEN 'ferramentas'    THEN public.auth_role() IN ('admin', 'gestor', 'armazem')
    WHEN 'combustivel'    THEN public.auth_role() IN ('admin', 'gestor', 'armazem')
    WHEN 'obras'          THEN public.auth_role() IN ('admin', 'gestor')
    WHEN 'subempreitadas' THEN public.auth_role() IN ('admin', 'gestor', 'medicoes')
    ELSE false
  END
$$;

GRANT EXECUTE ON FUNCTION public.auth_role()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_escrever(TEXT)    TO authenticated;

-- ------------------------------------------------------------
-- 2. Armazém — produtos (antes: admin-only)  ->  módulo 'armazem'
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "produtos_insert_admin" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update_admin" ON public.produtos;

CREATE POLICY "produtos_insert_rbac" ON public.produtos
  FOR INSERT TO authenticated WITH CHECK (public.pode_escrever('armazem'));
CREATE POLICY "produtos_update_rbac" ON public.produtos
  FOR UPDATE TO authenticated USING (public.pode_escrever('armazem'));

-- ------------------------------------------------------------
-- 3. Ferramentas (antes: admin-only)  ->  módulo 'ferramentas'
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "ferramentas_insert_admin" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_update_admin" ON public.ferramentas;

CREATE POLICY "ferramentas_insert_rbac" ON public.ferramentas
  FOR INSERT TO authenticated WITH CHECK (public.pode_escrever('ferramentas'));
CREATE POLICY "ferramentas_update_rbac" ON public.ferramentas
  FOR UPDATE TO authenticated USING (public.pode_escrever('ferramentas'));

-- emprestimos_ferramentas (antes: admin+gestor)  ->  + armazem
DROP POLICY IF EXISTS "emprestimos_insert_admin_gestor" ON public.emprestimos_ferramentas;
DROP POLICY IF EXISTS "emprestimos_update_admin_gestor" ON public.emprestimos_ferramentas;

CREATE POLICY "emprestimos_insert_rbac" ON public.emprestimos_ferramentas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.pode_escrever('ferramentas'));
CREATE POLICY "emprestimos_update_rbac" ON public.emprestimos_ferramentas
  FOR UPDATE TO authenticated USING (public.pode_escrever('ferramentas'));

-- ------------------------------------------------------------
-- 4. Obras (antes: authenticated)  ->  módulo 'obras'
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "obras_insert_auth" ON public.obras;
DROP POLICY IF EXISTS "obras_update_auth" ON public.obras;

CREATE POLICY "obras_insert_rbac" ON public.obras
  FOR INSERT TO authenticated WITH CHECK (public.pode_escrever('obras'));
CREATE POLICY "obras_update_rbac" ON public.obras
  FOR UPDATE TO authenticated USING (public.pode_escrever('obras'));

-- ------------------------------------------------------------
-- 5. Subempreitadas (antes: authenticated + rascunho) -> 'subempreitadas'
--    Mantém a imutabilidade (só rascunho) E acrescenta o papel.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "subempreiteiros_insert_rascunho" ON public.subempreiteiros;
DROP POLICY IF EXISTS "subempreiteiros_update_rascunho" ON public.subempreiteiros;
DROP POLICY IF EXISTS "subempreiteiros_delete_rascunho" ON public.subempreiteiros;

CREATE POLICY "subempreiteiros_insert_rbac" ON public.subempreiteiros
  FOR INSERT TO authenticated
  WITH CHECK (estado = 'rascunho' AND public.pode_escrever('subempreitadas'));
CREATE POLICY "subempreiteiros_update_rbac" ON public.subempreiteiros
  FOR UPDATE TO authenticated
  USING (estado = 'rascunho' AND public.pode_escrever('subempreitadas'))
  WITH CHECK (estado = 'rascunho' AND public.pode_escrever('subempreitadas'));
CREATE POLICY "subempreiteiros_delete_rbac" ON public.subempreiteiros
  FOR DELETE TO authenticated
  USING (estado = 'rascunho' AND public.pode_escrever('subempreitadas'));

DROP POLICY IF EXISTS "artigos_insert_rascunho" ON public.subempreiteiro_artigos;
DROP POLICY IF EXISTS "artigos_update_rascunho" ON public.subempreiteiro_artigos;
DROP POLICY IF EXISTS "artigos_delete_rascunho" ON public.subempreiteiro_artigos;

CREATE POLICY "artigos_insert_rbac" ON public.subempreiteiro_artigos
  FOR INSERT TO authenticated WITH CHECK (
    public.pode_escrever('subempreitadas') AND
    EXISTS (SELECT 1 FROM subempreiteiros s WHERE s.id = subempreiteiro_id AND s.estado = 'rascunho')
  );
CREATE POLICY "artigos_update_rbac" ON public.subempreiteiro_artigos
  FOR UPDATE TO authenticated USING (
    public.pode_escrever('subempreitadas') AND
    EXISTS (SELECT 1 FROM subempreiteiros s WHERE s.id = subempreiteiro_id AND s.estado = 'rascunho')
  );
CREATE POLICY "artigos_delete_rbac" ON public.subempreiteiro_artigos
  FOR DELETE TO authenticated USING (
    public.pode_escrever('subempreitadas') AND
    EXISTS (SELECT 1 FROM subempreiteiros s WHERE s.id = subempreiteiro_id AND s.estado = 'rascunho')
  );

DROP POLICY IF EXISTS "autos_insert_rascunho" ON public.autos_medicao;
DROP POLICY IF EXISTS "autos_update_rascunho" ON public.autos_medicao;
DROP POLICY IF EXISTS "autos_delete_rascunho" ON public.autos_medicao;

CREATE POLICY "autos_insert_rbac" ON public.autos_medicao
  FOR INSERT TO authenticated
  WITH CHECK (estado = 'rascunho' AND public.pode_escrever('subempreitadas'));
CREATE POLICY "autos_update_rbac" ON public.autos_medicao
  FOR UPDATE TO authenticated
  USING (estado = 'rascunho' AND public.pode_escrever('subempreitadas'))
  WITH CHECK (estado = 'rascunho' AND public.pode_escrever('subempreitadas'));
CREATE POLICY "autos_delete_rbac" ON public.autos_medicao
  FOR DELETE TO authenticated
  USING (estado = 'rascunho' AND public.pode_escrever('subempreitadas'));

DROP POLICY IF EXISTS "auto_linhas_insert_rascunho" ON public.auto_linhas;
DROP POLICY IF EXISTS "auto_linhas_update_rascunho" ON public.auto_linhas;
DROP POLICY IF EXISTS "auto_linhas_delete_rascunho" ON public.auto_linhas;

CREATE POLICY "auto_linhas_insert_rbac" ON public.auto_linhas
  FOR INSERT TO authenticated WITH CHECK (
    public.pode_escrever('subempreitadas') AND
    EXISTS (SELECT 1 FROM autos_medicao a WHERE a.id = auto_id AND a.estado = 'rascunho')
  );
CREATE POLICY "auto_linhas_update_rbac" ON public.auto_linhas
  FOR UPDATE TO authenticated USING (
    public.pode_escrever('subempreitadas') AND
    EXISTS (SELECT 1 FROM autos_medicao a WHERE a.id = auto_id AND a.estado = 'rascunho')
  );
CREATE POLICY "auto_linhas_delete_rbac" ON public.auto_linhas
  FOR DELETE TO authenticated USING (
    public.pode_escrever('subempreitadas') AND
    EXISTS (SELECT 1 FROM autos_medicao a WHERE a.id = auto_id AND a.estado = 'rascunho')
  );
