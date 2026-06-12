import { useState, useEffect, useCallback } from 'react'
import type { Movement } from '@/app/types'
import {
  listarMovimentos,
  listarMovimentosPaginados,
  registarMovimento,
  PAGE_SIZE,
  type FiltrosMovimentos,
  type RegistarMovimentoInput,
} from '../services/movimentosService'

export function useMovimentos(filtros: FiltrosMovimentos = {}) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable string key for change detection
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
  // filtrosKey drives the effect; filtros is captured via closure at call time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey])

  useEffect(() => { load() }, [load])

  return { movements, loading, error, reload: load }
}

export function useMovimentosPaginados(filtros: FiltrosMovimentos = {}) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset to page 0 whenever filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtrosKey = JSON.stringify(filtros)
  useEffect(() => { setPage(0) }, [filtrosKey])

  const load = useCallback(async (targetPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await listarMovimentosPaginados(filtros, targetPage)
      setMovements(result.data)
      setCount(result.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar movimentos')
    } finally {
      setLoading(false)
    }
  // filtrosKey + targetPage drive re-fetches; filtros is captured via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey])

  useEffect(() => { load(page) }, [load, page])

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return {
    movements,
    count,
    page,
    totalPages,
    loading,
    error,
    setPage,
    reload: () => load(page),
  }
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
