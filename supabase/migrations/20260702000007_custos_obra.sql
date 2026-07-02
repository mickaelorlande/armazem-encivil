-- =============================================================
-- ENCIVIL — Custos por Obra (job costing)
--
-- Liga TODAS as fontes de custo a uma obra para o CEO ver, por obra:
--   custo real (materiais + subempreiteiros + combustível) vs. orçamento
--   -> margem.
--
-- Três peças que faltavam:
--   1. produtos.custo_unitario  -> permite valorizar o material consumido.
--   2. obras.orcamento          -> valor previsto/contratado com o cliente.
--   3. movimentos_stock.obra_id -> liga o consumo de material à obra por
--      CHAVE (antes só existia destino_obra em texto, pouco fiável).
--
-- A RPC registar_movimento passa a aceitar p_obra_id (opcional). É
-- recriada (DROP+CREATE) para o parâmetro novo ficar no fim com DEFAULT,
-- mantendo compatibilidade com chamadas antigas.
-- =============================================================

-- 1. Custo unitário do produto (para valorizar consumos)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(12, 4) NOT NULL DEFAULT 0
  CONSTRAINT ck_produto_custo_nao_neg CHECK (custo_unitario >= 0);

COMMENT ON COLUMN public.produtos.custo_unitario IS
  'Custo unitário de referência do material, para valorizar o consumo por obra.';

-- 2. Orçamento da obra (valor previsto/contratado com o cliente)
ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS orcamento NUMERIC(14, 2)
  CONSTRAINT ck_obra_orcamento_nao_neg CHECK (orcamento IS NULL OR orcamento >= 0);

COMMENT ON COLUMN public.obras.orcamento IS
  'Valor orçamentado/contratado com o cliente para a obra. Base da margem (orçamento - custo real).';

-- 3. Ligação forte movimento -> obra
ALTER TABLE public.movimentos_stock
  ADD COLUMN IF NOT EXISTS obra_id UUID REFERENCES public.obras(id);

CREATE INDEX IF NOT EXISTS idx_movimentos_obra_id ON public.movimentos_stock(obra_id);

COMMENT ON COLUMN public.movimentos_stock.obra_id IS
  'Obra a que o movimento (tipicamente saída) é imputado. destino_obra (texto) '
  'mantém-se para retrocompatibilidade e destinos sem obra formal.';

-- ------------------------------------------------------------
-- RPC registar_movimento — agora com p_obra_id opcional
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.registar_movimento(UUID, tipo_movimento, NUMERIC, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.registar_movimento(
  p_produto_id   UUID,
  p_tipo         tipo_movimento,
  p_quantidade   NUMERIC,
  p_responsavel  TEXT,
  p_destino_obra TEXT DEFAULT NULL,
  p_observacoes  TEXT DEFAULT NULL,
  p_obra_id      UUID DEFAULT NULL
)
RETURNS movimentos_stock
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_produto       produtos%ROWTYPE;
  v_stock_antes   NUMERIC(12, 3);
  v_stock_depois  NUMERIC(12, 3);
  v_movimento     movimentos_stock%ROWTYPE;
BEGIN
  IF NOT public.pode_escrever('armazem') THEN
    RAISE EXCEPTION 'Autorização negada: não tem permissão para registar movimentos de stock.';
  END IF;

  SELECT * INTO v_produto FROM produtos WHERE id = p_produto_id AND ativo = true FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou inativo.';
  END IF;

  v_stock_antes := v_produto.stock_atual;

  CASE p_tipo
    WHEN 'entrada' THEN v_stock_depois := v_stock_antes + p_quantidade;
    WHEN 'saida' THEN
      IF p_quantidade > v_stock_antes THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponível: %, Pedido: %', v_stock_antes, p_quantidade;
      END IF;
      v_stock_depois := v_stock_antes - p_quantidade;
    WHEN 'ajuste' THEN v_stock_depois := p_quantidade;
  END CASE;

  UPDATE produtos SET stock_atual = v_stock_depois WHERE id = p_produto_id;

  INSERT INTO movimentos_stock (
    produto_id, tipo, quantidade, stock_antes, stock_depois,
    responsavel, destino_obra, observacoes, obra_id, created_by
  ) VALUES (
    p_produto_id, p_tipo, p_quantidade, v_stock_antes, v_stock_depois,
    p_responsavel, p_destino_obra, p_observacoes, p_obra_id, auth.uid()
  )
  RETURNING * INTO v_movimento;

  RETURN v_movimento;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_movimento(UUID, tipo_movimento, NUMERIC, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_movimento(UUID, tipo_movimento, NUMERIC, TEXT, TEXT, TEXT, UUID) TO authenticated;
