import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type AbastecimentoPendente = {
  id: string
  veiculo_id: string
  veiculo_nome: string
  funcionario_nome: string
  data: string
  litros: number
  custo_total: number
  contador: number | null
  local: string | null
  observacoes: string | null
  criado_em: string
}

export function usePendentes() {
  const [items,   setItems]   = useState<AbastecimentoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from('comb_abastecimentos_pendentes')
      .select('*')
      .order('criado_em', { ascending: false })
    if (err) {
      setError((err as { message: string }).message)
      setItems([])
    } else {
      setItems(((data ?? []) as unknown) as AbastecimentoPendente[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const aprovar = async (id: string): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).rpc('aprovar_abastecimento_pendente', { p_id: id })
    if (err) return false
    setItems(prev => prev.filter(p => p.id !== id))
    return true
  }

  const rejeitar = async (id: string): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).rpc('rejeitar_abastecimento_pendente', { p_id: id })
    if (err) return false
    setItems(prev => prev.filter(p => p.id !== id))
    return true
  }

  return { items, loading, error, reload: load, aprovar, rejeitar }
}
