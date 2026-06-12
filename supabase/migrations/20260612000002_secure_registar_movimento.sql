-- =============================================================
-- ENCIVIL — Migration #6: Segurança — role check na RPC registar_movimento
-- Adiciona verificação de role no início da função SECURITY DEFINER.
-- Qualquer utilizador sem role 'admin' ou 'gestor' recebe EXCEPTION,
-- mesmo que chame a RPC diretamente via HTTP/REST com token válido.
-- =============================================================

CREATE OR REPLACE FUNCTION public.registar_movimento(
  p_produto_id   UUID,
  p_tipo         tipo_movimento,
  p_quantidade   NUMERIC,
  p_responsavel  TEXT,
  p_destino_obra TEXT DEFAULT NULL,
  p_observacoes  TEXT DEFAULT NULL
)
RETURNS movimentos_stock
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role     TEXT;
  v_produto       produtos%ROWTYPE;
  v_stock_antes   NUMERIC(12, 3);
  v_stock_depois  NUMERIC(12, 3);
  v_movimento     movimentos_stock%ROWTYPE;
BEGIN
  -- ── Verificação de autorização ────────────────────────────────
  -- SECURITY DEFINER bypassa RLS; esta verificação é a única guarda.
  -- Utilizadores sem role atribuído ou com role desconhecido são rejeitados.
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_role IS NULL OR v_user_role NOT IN ('admin', 'gestor') THEN
    RAISE EXCEPTION 'Autorização negada: role "%" não pode registar movimentos. '
      'Apenas admin e gestor têm acesso a esta operação.',
      COALESCE(v_user_role, 'sem role');
  END IF;

  -- ── Lógica de negócio (inalterada) ──────────────────────────

  -- Bloqueia o produto para evitar race conditions
  SELECT * INTO v_produto
  FROM produtos
  WHERE id = p_produto_id AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou inativo.';
  END IF;

  v_stock_antes := v_produto.stock_atual;

  -- Calcula novo stock conforme tipo
  CASE p_tipo
    WHEN 'entrada' THEN
      v_stock_depois := v_stock_antes + p_quantidade;
    WHEN 'saida' THEN
      IF p_quantidade > v_stock_antes THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponível: %, Pedido: %',
          v_stock_antes, p_quantidade;
      END IF;
      v_stock_depois := v_stock_antes - p_quantidade;
    WHEN 'ajuste' THEN
      v_stock_depois := p_quantidade;
  END CASE;

  -- Atualiza stock do produto
  UPDATE produtos
  SET stock_atual = v_stock_depois
  WHERE id = p_produto_id;

  -- Regista o movimento
  INSERT INTO movimentos_stock (
    produto_id, tipo, quantidade,
    stock_antes, stock_depois,
    responsavel, destino_obra, observacoes,
    created_by
  ) VALUES (
    p_produto_id, p_tipo, p_quantidade,
    v_stock_antes, v_stock_depois,
    p_responsavel, p_destino_obra, p_observacoes,
    auth.uid()
  )
  RETURNING * INTO v_movimento;

  RETURN v_movimento;
END;
$$;

-- Garantir que apenas utilizadores autenticados podem chamar esta função
REVOKE ALL ON FUNCTION public.registar_movimento(UUID, tipo_movimento, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_movimento(UUID, tipo_movimento, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
