import { useState, useEffect, useCallback } from 'react'
import type { Movement } from '@/app/types'
import {
  listarMovimentos,
  registarMovimento,
  type FiltrosMovimentos,
  type RegistarMovimentoInput,
} from '../services/movimentosService'

export function useMovimentos(filtros: FiltrosMovimentos = {}) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable string key for change detection (Date objects become ISO strings — that's fine here)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtrosKey = JSON.stringify(filtros)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarMovimentos(filtros)
      setMovements(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar movimentos')
    } finally {
      setLoading(false)
    }
  // filtrosKey changes when filtros changes — load captures the current filtros via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey])

  useEffect(() => { load() }, [load])

  return { movements, loading, error, reload: load }
}

export function useRegistarMovimento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registar = async (input: RegistarMovimentoInput): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await registarMovimento(input)
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao registar movimento'
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { registar, loading, error }
}
