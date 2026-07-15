-- =============================================================
-- ENCIVIL — Assinaturas atômicas nas RPCs (2026-07-15)
--
-- PROBLEMA (TOCTOU): registar_emprestimo_ferramenta criava o registo
-- via RPC e depois um UPDATE separado gravava as assinaturas. Se o
-- UPDATE falhasse (queda de rede entre os dois passos), o empréstimo
-- ficava na BD sem assinaturas — violação do requisito legal.
--
-- FIX: assinaturas passam a ser parâmetros das próprias RPCs e
-- gravadas atomicamente na mesma transação.
--
-- Compatibilidade: parâmetros novos têm DEFAULT NULL — chamadas
-- antigas sem assinaturas continuam a funcionar.
-- =============================================================

-- ------------------------------------------------------------
-- 1. registar_emprestimo_ferramenta — assinaturas atómicas
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.registar_emprestimo_ferramenta(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, UUID
);

CREATE OR REPLACE FUNCTION public.registar_emprestimo_ferramenta(
  p_ferramenta_id                UUID,
  p_funcionario_nome             TEXT,
  p_responsavel_entrega          TEXT,
  p_funcionario_documento        TEXT    DEFAULT NULL,
  p_destino_obra                 TEXT    DEFAULT NULL,
  p_data_prevista_devolucao      DATE    DEFAULT NULL,
  p_condicao_entrega             TEXT    DEFAULT NULL,
  p_observacoes                  TEXT    DEFAULT NULL,
  p_obra_id                      UUID    DEFAULT NULL,
  p_assinatura_entrega           TEXT    DEFAULT NULL,
  p_assinatura_responsavel_ent   TEXT    DEFAULT NULL
)
RETURNS emprestimos_ferramentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    destino_obra, obra_id, data_prevista_devolucao, condicao_entrega,
    observacoes, responsavel_entrega,
    assinatura_entrega, assinatura_responsavel_entrega,
    created_by
  ) VALUES (
    p_ferramenta_id, p_funcionario_nome, p_funcionario_documento,
    p_destino_obra, p_obra_id, p_data_prevista_devolucao, p_condicao_entrega,
    p_observacoes, p_responsavel_entrega,
    p_assinatura_entrega, p_assinatura_responsavel_ent,
    auth.uid()
  )
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_emprestimo_ferramenta(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, UUID, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_emprestimo_ferramenta(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, UUID, TEXT, TEXT
) TO authenticated;


-- ------------------------------------------------------------
-- 2. registar_devolucao_ferramenta — assinaturas atómicas
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.registar_devolucao_ferramenta(
  UUID, condicao_devolucao, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.registar_devolucao_ferramenta(
  p_emprestimo_id               UUID,
  p_condicao_devolucao          condicao_devolucao,
  p_responsavel_recebimento     TEXT,
  p_observacoes_devolucao       TEXT    DEFAULT NULL,
  p_assinatura_devolucao        TEXT    DEFAULT NULL,
  p_assinatura_responsavel_dev  TEXT    DEFAULT NULL
)
RETURNS emprestimos_ferramentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    estado                      = 'devolvido',
    data_devolucao              = NOW(),
    condicao_devolucao          = p_condicao_devolucao,
    observacoes_devolucao       = p_observacoes_devolucao,
    responsavel_recebimento     = p_responsavel_recebimento,
    assinatura_devolucao        = p_assinatura_devolucao,
    assinatura_responsavel_devolucao = p_assinatura_responsavel_dev
  WHERE id = p_emprestimo_id
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_devolucao_ferramenta(
  UUID, condicao_devolucao, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_devolucao_ferramenta(
  UUID, condicao_devolucao, TEXT, TEXT, TEXT, TEXT
) TO authenticated;
