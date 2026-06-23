-- =============================================================
-- ENCIVIL — Assinatura de quem opera o sistema (entrega/receção)
--
-- Além do funcionário que pega/devolve a ferramenta, o termo também
-- exige a assinatura de quem está a operar o sistema nesse momento
-- (admin ou encarregado), tanto na entrega como na devolução.
-- =============================================================

ALTER TABLE emprestimos_ferramentas
  ADD COLUMN assinatura_responsavel_entrega   TEXT,
  ADD COLUMN assinatura_responsavel_devolucao TEXT;

COMMENT ON COLUMN emprestimos_ferramentas.assinatura_responsavel_entrega IS
  'Assinatura (PNG base64) de quem operava o sistema ao entregar a ferramenta.';
COMMENT ON COLUMN emprestimos_ferramentas.assinatura_responsavel_devolucao IS
  'Assinatura (PNG base64) de quem operava o sistema ao receber a devolução.';
