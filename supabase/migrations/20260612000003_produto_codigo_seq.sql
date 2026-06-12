-- =============================================================
-- ENCIVIL — Migration #7: Código de produto — sequência automática
-- Adiciona RPC gerar_codigo_produto() para sugestão de código
-- único no frontend. O campo codigo já tem UNIQUE no schema.
--
-- Nota: O código é sempre visível e editável pelo utilizador.
-- Esta função gera apenas uma SUGESTÃO — o utilizador pode
-- substituir por um código semântico (ex: CIM001, ARE002).
-- =============================================================

-- Sequência base para auto-geração (começa em 1001 para deixar
-- os primeiros 1000 para códigos manuais/migração de dados)
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
