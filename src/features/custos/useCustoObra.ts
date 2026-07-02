import { useState, useEffect, useCallback } from 'react'
import { custoObra, type CustoObra } from './custosService'

export function useCustoObra(obraId: string | undefined, orcamento?: number) {
  const [custo, setCusto] = useState<CustoObra | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!obraId) { setLoading(false); return }
    setLoading(true)
    try { setCusto(await custoObra(obraId, orcamento)) }
    catch { setCusto(null) }
    finally { setLoading(false) }
  }, [obraId, orcamento])

  useEffect(() => { load() }, [load])

  return { custo, loading, reload: load }
}
