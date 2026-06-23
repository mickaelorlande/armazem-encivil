-- =============================================================
-- ENCIVIL — Assinatura digital no Termo de Responsabilidade
--
-- O funcionário assina no ecrã (canvas) tanto ao receber a ferramenta
-- como ao devolvê-la, eliminando a dependência de papel. A imagem da
-- assinatura (PNG em base64) é guardada diretamente na linha do
-- empréstimo — sem necessidade de bucket de storage para este volume.
-- =============================================================

ALTER TABLE emprestimos_ferramentas
  ADD COLUMN assinatura_entrega    TEXT,
  ADD COLUMN assinatura_devolucao  TEXT;

COMMENT ON COLUMN emprestimos_ferramentas.assinatura_entrega IS
  'Assinatura do funcionário (PNG base64) capturada no momento da entrega da ferramenta.';
COMMENT ON COLUMN emprestimos_ferramentas.assinatura_devolucao IS
  'Assinatura do funcionário (PNG base64) capturada no momento da devolução da ferramenta.';

-- Sem GRANT adicional: authenticated já tem SELECT/INSERT/UPDATE nesta
-- tabela desde 20260623000002_ferramentas_grants.sql.
