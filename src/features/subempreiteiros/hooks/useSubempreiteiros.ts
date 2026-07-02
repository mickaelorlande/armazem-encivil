import { useState, useEffect, useCallback } from 'react'
import type { Subcontractor } from '@/app/types'
import {
  listarSubempreiteiros,
  buscarSubempreiteiro,
  criarSubempreiteiro,
  atualizarSubempreiteiro,
  eliminarSubempreiteiro,
  validarSubempreiteiro,
  type NovoSubempreiteiro,
  type AtualizarSubempreiteiro,
} from '../services/subempreiteirosService'

export function useSubempreiteiros(obraId?: string) {
  const [subs, setSubs] = useState<Subcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSubs(await listarSubempreiteiros(obraId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar subempreiteiros')
    } finally {
      setLoading(false)
    }
  }, [obraId])

  useEffect(() => { load() }, [load])

  return { subs, loading, error, reload: load }
}

export function useSubempreiteiro(id: string | undefined) {
  const [sub, setSub] = useState<Subcontractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setSub(await buscarSubempreiteiro(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Contratação não encontrada')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { sub, loading, error, reload: load }
}

export function useGuardarSubempreiteiro() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const criar = async (input: NovoSubempreiteiro): Promise<Subcontractor | null> => {
    setLoading(true); setError(null)
    try { return await criarSubempreiteiro(input) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar'); return null }
    finally { setLoading(false) }
  }

  const atualizar = async (id: string, input: AtualizarSubempreiteiro): Promise<Subcontractor | null> => {
    setLoading(true); setError(null)
    try { return await atualizarSubempreiteiro(id, input) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar'); return null }
    finally { setLoading(false) }
  }

  return { criar, atualizar, loading, error }
}

export function useValidarSubempreiteiro() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validar = async (id: string): Promise<Subcontractor | null> => {
    setLoading(true); setError(null)
    try { return await validarSubempreiteiro(id) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao validar'); return null }
    finally { setLoading(false) }
  }

  return { validar, loading, error }
}

export function useEliminarSubempreiteiro() {
  const [loading, setLoading] = useState(false)
  const eliminar = async (id: string): Promise<boolean> => {
    setLoading(true)
    try { await eliminarSubempreiteiro(id); return true }
    catch { return false }
    finally { setLoading(false) }
  }
  return { eliminar, loading }
}
