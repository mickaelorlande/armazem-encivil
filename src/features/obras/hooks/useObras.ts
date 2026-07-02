import { useState, useEffect, useCallback } from 'react'
import type { Obra } from '@/app/types'
import {
  listarObras,
  criarObra,
  atualizarObra,
  type NovaObra,
  type AtualizarObra,
} from '../services/obrasService'

export function useObras(apenasAtivas = true) {
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setObras(await listarObras(apenasAtivas))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar obras')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivas])

  useEffect(() => { load() }, [load])

  return { obras, loading, error, reload: load }
}

export function useCriarObra() {
  const [loading, setLoading] = useState(false)
  const criar = async (input: NovaObra): Promise<Obra | null> => {
    setLoading(true)
    try { return await criarObra(input) }
    catch { return null }
    finally { setLoading(false) }
  }
  return { criar, loading }
}

export function useAtualizarObra() {
  const [loading, setLoading] = useState(false)
  const atualizar = async (id: string, input: AtualizarObra): Promise<Obra | null> => {
    setLoading(true)
    try { return await atualizarObra(id, input) }
    catch { return null }
    finally { setLoading(false) }
  }
  return { atualizar, loading }
}
