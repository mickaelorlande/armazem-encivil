import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Valores de produção — públicos por natureza: vão embutidos no bundle que
// qualquer utilizador descarrega. A segurança real é a RLS no Postgres.
// Env vars (quando válidas) têm prioridade, para dev/staging apontarem a outro projeto.
const PROD_URL = 'https://wuruhxmbueeyhiqgvlxu.supabase.co'
const PROD_KEY = 'sb_publishable_b2Zjbv0hhxxORNxjemsGZA_bMtFaDJa'

const envUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

const urlValid = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(envUrl)
const keyValid = /^sb_publishable_[A-Za-z0-9_-]+$/.test(envKey)
if (!urlValid || !keyValid) console.warn('[supabase] env vars ausentes ou inválidas — a usar credenciais de produção embutidas')
const supabaseUrl = urlValid ? envUrl : PROD_URL
const supabaseKey = keyValid ? envKey : PROD_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
