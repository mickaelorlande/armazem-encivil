-- Add 'gestor' to role_utilizador enum
ALTER TYPE public.role_utilizador ADD VALUE IF NOT EXISTS 'gestor';

-- Restrict produtos INSERT/UPDATE to admin only (was open to all authenticated)
DROP POLICY IF EXISTS "produtos_insert_auth" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update_auth" ON public.produtos;

CREATE POLICY "produtos_insert_admin"
  ON public.produtos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "produtos_update_admin"
  ON public.produtos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Restrict movimentos INSERT to admin only (gestores can SELECT but not INSERT)
DROP POLICY IF EXISTS "movimentos_insert_auth" ON public.movimentos_stock;

CREATE POLICY "movimentos_insert_admin"
  ON public.movimentos_stock FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Restrict configuracoes UPDATE to admin only
DROP POLICY IF EXISTS "config_update_auth" ON public.configuracoes_empresa;

CREATE POLICY "config_update_admin"
  ON public.configuracoes_empresa FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
