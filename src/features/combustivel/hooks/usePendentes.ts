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
    const { data, error: err } = await supabase
      .from('comb_abastecimentos_pendentes')
      .select('*')
      .order('criado_em', { ascending: false })
    if (err) {
      setError(err.message)
      setItems([])
    } else {
      setItems((data ?? []) as AbastecimentoPendente[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const aprovar = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.rpc('aprovar_abastecimento_pendente', { p_id: id })
    if (err) return false
    setItems(prev => prev.filter(p => p.id !== id))
    return true
  }

  const rejeitar = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.rpc('rejeitar_abastecimento_pendente', { p_id: id })
    if (err) return false
    setItems(prev => prev.filter(p => p.id !== id))
    return true
  }

  return { items, loading, error, reload: load, aprovar, rejeitar }
}
