-- =============================================================
-- ENCIVIL — Corrige início da sequência de código de produto
--
-- O campo código deixou de ser editável pelo utilizador (gerado
-- sempre automaticamente e imutável após criação — ver fix de UX
-- 2026-06-22). A reserva dos códigos 1-1000 para "uso manual" da
-- migration anterior já não faz sentido: não há mais entrada manual.
-- Reinicia a sequência em 1 para obter P0001, P0002, ... em vez de
-- começar em P1001.
-- =============================================================

ALTER SEQUENCE produto_codigo_seq RESTART WITH 1;

COMMENT ON SEQUENCE produto_codigo_seq IS
  'Sequência para geração automática e imutável do código de produto. '
  'Formato: P0001, P0002, ... Gerada sempre pelo servidor; nunca editável pelo utilizador.';
