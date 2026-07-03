-- =============================================================
-- ENCIVIL — Ligar empréstimos de ferramentas à Obra (por chave)
--
-- Até agora o empréstimo só guardava destino_obra em texto, ao contrário
-- de movimentos e combustível que ligam por obra_id. Isto punha as
-- ferramentas fora do padrão "tudo liga à obra" e impedia a Ficha de Obra
-- de mostrar as ferramentas ao serviço daquela obra.
-- =============================================================

ALTER TABLE public.emprestimos_ferramentas
  ADD COLUMN IF NOT EXISTS obra_id UUID REFERENCES public.obras(id);

CREATE INDEX IF NOT EXISTS idx_emprestimos_obra_id ON public.emprestimos_ferramentas(obra_id);

COMMENT ON COLUMN public.emprestimos_ferramentas.obra_id IS
  'Obra a que a ferramenta foi entregue. destino_obra (texto) mantém-se para '
  'retrocompatibilidade e destinos sem obra formal.';

-- RPC recriada com p_obra_id opcional no fim (mantém compatibilidade).
DROP FUNCTION IF EXISTS public.registar_emprestimo_ferramenta(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.registar_emprestimo_ferramenta(
  p_ferramenta_id            UUID,
  p_funcionario_nome         TEXT,
  p_responsavel_entrega      TEXT,
  p_funcionario_documento    TEXT DEFAULT NULL,
  p_destino_obra             TEXT DEFAULT NULL,
  p_data_prevista_devolucao  DATE DEFAULT NULL,
  p_condicao_entrega         TEXT DEFAULT NULL,
  p_observacoes              TEXT DEFAULT NULL,
  p_obra_id                  UUID DEFAULT NULL
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
    destino_obra, obra_id, data_prevista_devolucao, condicao_entrega,
    observacoes, responsavel_entrega, created_by
  ) VALUES (
    p_ferramenta_id, p_funcionario_nome, p_funcionario_documento,
    p_destino_obra, p_obra_id, p_data_prevista_devolucao, p_condicao_entrega,
    p_observacoes, p_responsavel_entrega, auth.uid()
  )
  RETURNING * INTO v_emprestimo;

  RETURN v_emprestimo;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_emprestimo_ferramenta(UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_emprestimo_ferramenta(UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, UUID) TO authenticated;
