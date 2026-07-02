import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { listarSubempreiteiros } from '@/features/subempreiteiros/services/subempreiteirosService'

// Read-model do dashboard: agrega obras + subempreitadas + autos.
// (O dashboard é a camada de composição — pode cruzar módulos.)
export type ResumoObras = {
  obrasAtivas: number
  totalContratado: number
  totalExecutado: number
  totalFalta: number
  contratosPorValidar: number
  autosPorValidar: number
}

export function useResumoObras() {
  const [resumo, setResumo] = useState<ResumoObras | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [obrasRes, subs, autosRes] = await Promise.all([
        supabase.from('obras').select('*', { count: 'exact', head: true }).eq('ativo', true),
        listarSubempreiteiros(),
        supabase.from('autos_medicao').select('valor_periodo, estado'),
      ])

      const autos = (autosRes.data ?? []) as { valor_periodo: number; estado: string }[]
      const totalContratado = subs.reduce((s, x) => s + x.agreedValue, 0)
      const totalExecutado = autos
        .filter(a => a.estado === 'validado')
        .reduce((s, a) => s + Number(a.valor_periodo), 0)

      setResumo({
        obrasAtivas: obrasRes.count ?? 0,
        totalContratado,
        totalExecutado,
        totalFalta: totalContratado - totalExecutado,
        contratosPorValidar: subs.filter(s => s.status === 'rascunho').length,
        autosPorValidar: autos.filter(a => a.estado === 'rascunho').length,
      })
    } catch {
      setResumo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { resumo, loading, reload: load }
}
