import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Valores de produção — públicos por natureza: vão embutidos no bundle que
// qualquer utilizador descarrega. A segurança real é a RLS no Postgres.
// Env vars (quando válidas) têm prioridade, para dev/staging apontarem a outro projeto.
const PROD_URL = 'https://wuruhxmbueeyhiqgvlxu.supabase.co'
const PROD_KEY = 'sb_publishable_b2Zjbv0hhxxORNxjemsGZA_bMtFaDJa'

const envUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

const supabaseUrl = /^https:\/\/[a-z]+\.supabase\.co$/.test(envUrl) ? envUrl : PROD_URL
const supabaseKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(envKey) ? envKey : PROD_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
