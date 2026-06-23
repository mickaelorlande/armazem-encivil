-- =============================================================
-- ENCIVIL — Permissões em falta para o módulo de Ferramentas
--
-- Bug: "Erro ao criar ferramenta." A migration 20260623000001 criou as
-- tabelas/sequência/RPCs mas esqueceu os GRANTs explícitos exigidos por
-- este projeto (Automatically expose new tables = OFF, ver
-- 20260611000001_grants.sql). Sem GRANT, o Postgres nega o acesso antes
-- de a RLS ser avaliada — por isso falhava tanto o INSERT como, em
-- silêncio, o SELECT (catálogo aparecia sempre vazio).
-- =============================================================

GRANT SELECT, INSERT, UPDATE ON public.ferramentas             TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.emprestimos_ferramentas TO authenticated;

GRANT USAGE ON SEQUENCE public.ferramenta_codigo_seq TO authenticated;

REVOKE ALL ON public.ferramentas             FROM anon;
REVOKE ALL ON public.emprestimos_ferramentas FROM anon;
REVOKE ALL ON SEQUENCE public.ferramenta_codigo_seq FROM anon;

GRANT EXECUTE ON FUNCTION public.gerar_codigo_ferramenta() TO authenticated;

GRANT EXECUTE ON FUNCTION public.registar_emprestimo_ferramenta(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.registar_devolucao_ferramenta(
  UUID, condicao_devolucao, TEXT, TEXT
) TO authenticated;
