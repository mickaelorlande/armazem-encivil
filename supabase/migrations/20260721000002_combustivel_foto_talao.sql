-- ================================================================
-- ENCIVIL — Foto do Talão de Combustível
--
-- Motoristas podem fotografar o talão com o telemóvel ao registar
-- o abastecimento via QR code. A foto fica armazenada no bucket
-- "combustivel-taloes" e é transferida para comb_abastecimentos
-- quando o gestor aprova o registo pendente.
--
-- APLICAR: colar no SQL Editor do Supabase e executar.
-- ================================================================

-- 1. Adicionar coluna foto_url às duas tabelas
ALTER TABLE public.comb_abastecimentos
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

ALTER TABLE public.comb_abastecimentos_pendentes
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Bucket público para fotos de talões (10 MB, apenas imagens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'combustivel-taloes',
  'combustivel-taloes',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de storage
-- Anon pode fazer upload (motorista sem login via QR code)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'anon_upload_taloes'
      AND tablename  = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "anon_upload_taloes"
      ON storage.objects FOR INSERT TO anon
      WITH CHECK (bucket_id = 'combustivel-taloes');
  END IF;
END $$;

-- Todos podem ler (bucket público — URL partilhável)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_read_taloes'
      AND tablename  = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "public_read_taloes"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'combustivel-taloes');
  END IF;
END $$;

-- 4. Recriar RPC de aprovação para copiar foto_url para comb_abastecimentos
CREATE OR REPLACE FUNCTION public.aprovar_abastecimento_pendente(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pend public.comb_abastecimentos_pendentes%ROWTYPE;
BEGIN
  IF NOT public.pode_escrever('combustivel') THEN
    RAISE EXCEPTION 'Sem permissão para aprovar abastecimentos';
  END IF;

  SELECT * INTO v_pend
  FROM public.comb_abastecimentos_pendentes
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registo pendente não encontrado: %', p_id;
  END IF;

  INSERT INTO public.comb_abastecimentos
    (veiculo_id, data, litros, custo_total, contador, local, responsavel, observacoes, foto_url)
  VALUES
    (v_pend.veiculo_id, v_pend.data, v_pend.litros, v_pend.custo_total,
     v_pend.contador, v_pend.local, v_pend.funcionario_nome, v_pend.observacoes,
     v_pend.foto_url);

  DELETE FROM public.comb_abastecimentos_pendentes WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_abastecimento_pendente(uuid) TO authenticated;
