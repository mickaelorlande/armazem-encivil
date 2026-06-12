-- =============================================================
-- ENCIVIL — Migration #4: Product CRUD + Delete policy
-- Idempotente: usa DROP ... IF EXISTS antes de criar
-- =============================================================

-- Allow admin to DELETE products (hard delete).
-- Safe only for products with no movements — the frontend
-- enforces this check before calling delete.
DROP POLICY IF EXISTS "produtos_delete_admin" ON public.produtos;

CREATE POLICY "produtos_delete_admin"
  ON public.produtos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow gestor/encarregado to register movements.
-- registar_movimento() is SECURITY DEFINER so it already bypasses
-- RLS — this policy covers any direct INSERT fallback path.
DROP POLICY IF EXISTS "movimentos_insert_admin" ON public.movimentos_stock;
DROP POLICY IF EXISTS "movimentos_insert_admin_gestor" ON public.movimentos_stock;

CREATE POLICY "movimentos_insert_admin_gestor"
  ON public.movimentos_stock FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );
