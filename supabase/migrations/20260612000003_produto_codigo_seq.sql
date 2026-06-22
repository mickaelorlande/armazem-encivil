-- =============================================================
-- ENCIVIL — Migration #7: Código de produto — sequência automática
-- Adiciona RPC gerar_codigo_produto() para sugestão de código
-- único no frontend. O campo codigo já tem UNIQUE no schema.
--
-- Nota histórica: nesta migration o código ainda era editável pelo
-- utilizador. Isso foi alterado em 2026-06-22 (ver migration
-- 20260622000002) — o código passou a ser sempre automático e
-- imutável. O início em 1001 também foi corrigido para 1 nessa
-- migration posterior.
-- =============================================================

CREATE SEQUENCE IF NOT EXISTS produto_codigo_seq START 1001 INCREMENT 1;

-- RPC pública (autenticados) para obter o próximo código sugerido
CREATE OR REPLACE FUNCTION public.gerar_codigo_produto()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'P' || LPAD(nextval('produto_codigo_seq')::TEXT, 4, '0');
$$;

REVOKE ALL ON FUNCTION public.gerar_codigo_produto() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gerar_codigo_produto() TO authenticated;

-- Garantir que o constraint UNIQUE existe (já definido no schema inicial,
-- mas declaramos explicitamente para tornar a intenção clara)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'produtos'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'produtos_codigo_key'
  ) THEN
    ALTER TABLE public.produtos ADD CONSTRAINT produtos_codigo_unique UNIQUE (codigo);
  END IF;
END
$$;

-- Comentário documentando a intenção
COMMENT ON SEQUENCE produto_codigo_seq IS
  'Sequência para sugestão automática de código de produto. '
  'Formato: P0001, P0002, ... O utilizador pode sempre substituir '
  'por um código semântico antes de submeter o formulário.';
