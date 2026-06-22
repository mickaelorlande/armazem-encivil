-- =============================================================
-- ENCIVIL — Corrige consumo da sequência de código ao abrir o modal
--
-- Bug: gerar_codigo_produto() chamava nextval() sempre que o
-- formulário "Novo Produto" abria, mesmo que o utilizador cancelasse.
-- Isso fazia o código sugerido "saltar" (P0003 -> P0005) sem nenhum
-- produto ter sido criado.
--
-- Correção:
-- 1. O código passa a ser gerado pela própria coluna (DEFAULT com
--    nextval) no momento do INSERT — só é consumido quando o produto
--    é mesmo criado.
-- 2. gerar_codigo_produto() passa a ser apenas uma pré-visualização:
--    lê o estado da sequência sem avançar (sem nextval), só para
--    mostrar ao utilizador o código que será atribuído.
-- =============================================================

ALTER TABLE public.produtos
  ALTER COLUMN codigo SET DEFAULT ('P' || LPAD(nextval('produto_codigo_seq')::TEXT, 4, '0'));

CREATE OR REPLACE FUNCTION public.gerar_codigo_produto()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- A sequência tem INCREMENT 1; por isso somamos 1 diretamente em vez
  -- de ler increment_by (que só existe em pg_sequences, não na relação).
  SELECT 'P' || LPAD(
    (CASE WHEN is_called THEN last_value + 1 ELSE last_value END)::TEXT,
    4, '0'
  )
  FROM produto_codigo_seq;
$$;

COMMENT ON FUNCTION public.gerar_codigo_produto() IS
  'Pré-visualização do próximo código de produto. Não consome a sequência — '
  'o valor real é atribuído pela coluna DEFAULT de produtos.codigo apenas '
  'quando o produto é efetivamente criado (INSERT).';
