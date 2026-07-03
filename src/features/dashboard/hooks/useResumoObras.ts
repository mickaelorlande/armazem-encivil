import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { listarObras } from '@/features/obras/services/obrasService'
import { listarSubempreiteiros } from '@/features/subempreiteiros/services/subempreiteirosService'
import { custosMateriaisCombustivelPorObra } from '@/features/custos/custosService'

// Read-model do dashboard: o P&L global das obras (o número do CEO).
// (O dashboard é a camada de composição — pode cruzar módulos.)
export type ResumoObras = {
  obrasAtivas: number
  totalOrcamento: number
  custoReal: number       // materiais + subempreiteiros + combustível (todas as obras)
  margem: number          // orçamento - custo real
  contratosPorValidar: number
  autosPorValidar: number
}

export function useResumoObras() {
  const [resumo, setResumo] = useState<ResumoObras | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [obras, subs, autosRes, matComb] = await Promise.all([
        listarObras(false),
        listarSubempreiteiros(),
        supabase.from('autos_medicao').select('valor_periodo, estado'),
        custosMateriaisCombustivelPorObra(),
      ])

      const autos = (autosRes.data ?? []) as { valor_periodo: number; estado: string }[]
      const executado = autos
        .filter(a => a.estado === 'validado')
        .reduce((s, a) => s + Number(a.valor_periodo), 0)

      const parciais = Object.values(matComb)
      const materiais = parciais.reduce((s, p) => s + p.materiais, 0)
      const combustivel = parciais.reduce((s, p) => s + p.combustivel, 0)
      const custoReal = materiais + executado + combustivel

      const totalOrcamento = obras.reduce((s, o) => s + (o.budget ?? 0), 0)

      setResumo({
        obrasAtivas: obras.filter(o => o.active && o.status === 'ativa').length,
        totalOrcamento,
        custoReal,
        margem: totalOrcamento - custoReal,
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
