import { useState, useEffect, useCallback } from 'react'
import type { ToolLoan } from '@/app/types'
import {
  listarEmprestimos,
  listarEmprestimosPaginados,
  registarEmprestimo,
  registarDevolucao,
  LOANS_PAGE_SIZE,
  type FiltrosEmprestimos,
  type RegistarEmprestimoInput,
  type RegistarDevolucaoInput,
} from '../services/emprestimosService'

export function useEmprestimos(filtros: FiltrosEmprestimos = {}) {
  const [loans, setLoans] = useState<ToolLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtrosKey = JSON.stringify(filtros)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarEmprestimos(filtros)
      setLoans(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar empréstimos')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey])

  useEffect(() => { load() }, [load])

  return { loans, loading, error, reload: load }
}

export function useEmprestimosPaginados(filtros: FiltrosEmprestimos = {}) {
  const [loans, setLoans] = useState<ToolLoan[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtrosKey = JSON.stringify(filtros)
  useEffect(() => { setPage(0) }, [filtrosKey])

  const load = useCallback(async (targetPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await listarEmprestimosPaginados(filtros, targetPage)
      setLoans(result.data)
      setCount(result.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar empréstimos')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey])

  useEffect(() => { load(page) }, [load, page])

  const totalPages = Math.ceil(count / LOANS_PAGE_SIZE)

  return {
    loans,
    count,
    page,
    totalPages,
    loading,
    error,
    setPage,
    reload: () => load(page),
  }
}

export function useRegistarEmprestimo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registar = async (input: RegistarEmprestimoInput): Promise<ToolLoan | null> => {
    setLoading(true)
    setError(null)
    try {
      return await registarEmprestimo(input)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao registar empréstimo'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { registar, loading, error }
}

export function useRegistarDevolucao() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const devolver = async (input: RegistarDevolucaoInput): Promise<ToolLoan | null> => {
    setLoading(true)
    setError(null)
    try {
      return await registarDevolucao(input)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao registar devolução'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { devolver, loading, error }
}
