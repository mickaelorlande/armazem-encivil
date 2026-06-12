-- =============================================================
-- ENCIVIL — Migration #5: Segurança — role padrão mínimo privilégio
-- Corrige handle_new_user() de 'admin' para 'gestor'.
-- Novos utilizadores criados via Auth têm o mínimo de permissões.
-- Admins devem ser promovidos manualmente no Dashboard.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'gestor'   -- mínimo privilégio — promover para 'admin' manualmente
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificação: confirmar que a função foi atualizada
-- SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
