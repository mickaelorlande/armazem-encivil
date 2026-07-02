-- =============================================================
-- ENCIVIL — RBAC (parte A): novos papéis de utilizador
--
-- Passa do modelo grosseiro (admin/gestor) para papéis por módulo,
-- conforme ARCHITECTURE.md secção 5. Esta migration APENAS acrescenta
-- os valores ao enum — as políticas que os usam vêm na migration
-- seguinte (garante que os valores estão comprometidos antes de usar).
--
-- Seguro em produção: todos os utilizadores atuais são 'admin' e
-- mantêm acesso total; os papéis novos ainda não estão atribuídos a
-- ninguém.
-- =============================================================

ALTER TYPE public.role_utilizador ADD VALUE IF NOT EXISTS 'armazem';
ALTER TYPE public.role_utilizador ADD VALUE IF NOT EXISTS 'medicoes';
ALTER TYPE public.role_utilizador ADD VALUE IF NOT EXISTS 'leitura';
