-- =============================================================
-- ENCIVIL — RBAC (parte C): guardas de papel nas RPCs SECURITY DEFINER
--
-- As RPCs correm com SECURITY DEFINER (ignoram RLS), por isso a guarda
-- de papel dentro delas é a única barreira. Passam a usar o helper
-- central public.pode_escrever(...).
--
--   - registar_movimento          -> pode_escrever('armazem')  (antes: admin/gestor)
--   - registar_emprestimo_ferramenta -> pode_escrever('ferramentas')  (antes: SEM guarda!)
--   - registar_devolucao_ferramenta  -> pode_escrever('ferramentas')  (antes: SEM guarda!)
--
-- Fecha uma lacuna pré-existente: as RPCs de ferramentas não verificavam
-- papel nenhum (qualquer autenticado podia emprestar/devolver via REST).
-- =============================================================

-- ------------------------------------------------------------
-- registar_movimento — agora inclui o papel 'armazem'
-- ------------------------------------------------------------
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
  v_produto       produtos%ROWTYPE;
  v_stock_antes   NUMERIC(12, 3);
  v_stock_depois  NUMERIC(12, 3);
  v_movimento     movimentos_stock%ROWTYPE;
BEGIN
  IF NOT public.pode_escrever('armazem') THEN
    RAISE EXCEPTION 'Autorização negada: não tem permissão para registar movimentos de stock.';
  END IF;

  SELECT * INTO v_produto
  FROM produtos
  WHERE id = p_produto_id AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou inativo.';
  END IF;

  v_stock_antes := v_produto.stock_atual;

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

  UPDATE produtos SET stock_atual = v_stock_depois WHERE id = p_produto_id;

  INSERT INTO movimentos_stock (
    produto_id, tipo, quantidade, stock_antes, stock_depois,
    responsavel, destino_obra, observacoes, created_by
  ) VALUES (
    p_produto_id, p_tipo, p_quantidade, v_stock_antes, v_stock_depois,
    p_responsavel, p_destino_obra, p_observacoes, auth.uid()
  )
  RETURNING * INTO v_movimento;

  RETURN v_movimento;
END;
$$;

-- ------------------------------------------------------------
-- registar_emprestimo_ferramenta — acrescenta guarda de papel
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registar_emprestimo_ferramenta(
  p_ferramenta_id            UUID,
  p_funcionario_nome         TEXT,
  p_responsavel_entrega      TEXT,
  p_funcionario_documento    TEXT DEFAULT NULL,
  p_destino_obra             TEXT DEFAULT NULL,
  p_data_prevista_devolucao  DATE DEFAULT NULL,
  p_condicao_entrega         TEXT DEFAULT NULL,
  p_observacoes              TEXT DEFAULT NULL
)
RETURNS emprestimos_ferramentas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ferramenta  ferramentas%ROWTYPE;
  v_emprestimo  emprestimos_ferramentas%ROWTYPE;
BEGIN
  IF NOT public.pode_escrever('ferramentas') THEN
    RAISE EXCEPTION 'Autorização negada: não tem permissão para registar empréstimos de ferramentas.';
  END IF;

  SELECT * INTO v_ferramenta
  FROM ferramentas
  WHERE id = p_ferramenta_id AND ativo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ferramenta não encontrada ou inativa.';
  END IF;

  IF v_ferramenta.estado != 'disponivel' THEN
    RAISE EXCEPTION 'Ferramenta "%" não está disponível (estado atual: %).',
      v_ferramenta.nome, v_ferramenta.estado;
  END IF;

  UPDATE ferramentas SET estado = 'emprestada' WHERE id = p_ferramenta_id;

  INSERT INTO emprestimos_ferramentas (
    ferramenta_id, funcionario_nome, funcionario_documento,
    destino_obra, data_prevista_devolucao, condicao_entrega,
    observacoes, responsavel_entrega, created_by
  ) VALUES (
    p_ferramenta_id, p_funcionario_nome, p_funcionario_documento,
    p_destino_obra, p_data_prevista_devolucao, p_condicao_entrega,
    p_observacoes, p_responsavel_entrega, auth.uid()
  )
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;

-- ------------------------------------------------------------
-- registar_devolucao_ferramenta — acrescenta guarda de papel
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registar_devolucao_ferramenta(
  p_emprestimo_id           UUID,
  p_condicao_devolucao      condicao_devolucao,
  p_responsavel_recebimento TEXT,
  p_observacoes_devolucao   TEXT DEFAULT NULL
)
RETURNS emprestimos_ferramentas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emprestimo   emprestimos_ferramentas%ROWTYPE;
  v_novo_estado  estado_ferramenta;
BEGIN
  IF NOT public.pode_escrever('ferramentas') THEN
    RAISE EXCEPTION 'Autorização negada: não tem permissão para registar devoluções de ferramentas.';
  END IF;

  SELECT * INTO v_emprestimo
  FROM emprestimos_ferramentas
  WHERE id = p_emprestimo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado.';
  END IF;

  IF v_emprestimo.estado != 'ativo' THEN
    RAISE EXCEPTION 'Este empréstimo já foi devolvido.';
  END IF;

  PERFORM 1 FROM ferramentas WHERE id = v_emprestimo.ferramenta_id FOR UPDATE;

  v_novo_estado := CASE p_condicao_devolucao
    WHEN 'bom_estado' THEN 'disponivel'
    WHEN 'danificada' THEN 'manutencao'
    WHEN 'perdida'    THEN 'inativa'
  END;

  UPDATE ferramentas SET estado = v_novo_estado WHERE id = v_emprestimo.ferramenta_id;

  UPDATE emprestimos_ferramentas
  SET
    estado                  = 'devolvido',
    data_devolucao          = NOW(),
    condicao_devolucao      = p_condicao_devolucao,
    observacoes_devolucao   = p_observacoes_devolucao,
    responsavel_recebimento = p_responsavel_recebimento
  WHERE id = p_emprestimo_id
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;
