-- =============================================================
-- ENCIVIL Armazém — Permissões para roles do PostgREST
-- Necessário porque "Automatically expose new tables" está OFF
-- =============================================================

-- Role: authenticated (utilizadores com sessão ativa)
GRANT SELECT, INSERT, UPDATE ON public.profiles              TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.produtos              TO authenticated;
GRANT SELECT, INSERT         ON public.movimentos_stock      TO authenticated;
GRANT SELECT, UPDATE         ON public.configuracoes_empresa TO authenticated;

-- Role: anon (sem sessão) — sem acesso a nenhuma tabela
-- (RLS bloqueia de qualquer forma, mas é boa prática não conceder)
REVOKE ALL ON public.profiles              FROM anon;
REVOKE ALL ON public.produtos              FROM anon;
REVOKE ALL ON public.movimentos_stock      FROM anon;
REVOKE ALL ON public.configuracoes_empresa FROM anon;

-- Permissão para executar a função RPC registar_movimento
GRANT EXECUTE ON FUNCTION public.registar_movimento(UUID, tipo_movimento, NUMERIC, TEXT, TEXT, TEXT)
  TO authenticated;
