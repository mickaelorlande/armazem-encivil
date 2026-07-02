import { useState, useEffect, useCallback } from 'react'
import type { Measurement } from '@/app/types'
import {
  listarAutos,
  buscarAuto,
  criarAuto,
  atualizarAuto,
  eliminarAuto,
  validarAuto,
  type NovoAuto,
  type AtualizarAuto,
} from '../services/autosService'

export function useAutos(subId: string | undefined) {
  const [autos, setAutos] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!subId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      setAutos(await listarAutos(subId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar autos')
    } finally {
      setLoading(false)
    }
  }, [subId])

  useEffect(() => { load() }, [load])

  return { autos, loading, error, reload: load }
}

export function useAuto(id: string | undefined) {
  const [auto, setAuto] = useState<Measurement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      setAuto(await buscarAuto(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auto não encontrado')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { auto, loading, error, reload: load }
}

export function useGuardarAuto() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const criar = async (input: NovoAuto): Promise<Measurement | null> => {
    setLoading(true); setError(null)
    try { return await criarAuto(input) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar'); return null }
    finally { setLoading(false) }
  }

  const atualizar = async (id: string, input: AtualizarAuto): Promise<Measurement | null> => {
    setLoading(true); setError(null)
    try { return await atualizarAuto(id, input) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar'); return null }
    finally { setLoading(false) }
  }

  return { criar, atualizar, loading, error }
}

export function useValidarAuto() {
  const [loading, setLoading] = useState(false)
  const validar = async (id: string): Promise<Measurement | null> => {
    setLoading(true)
    try { return await validarAuto(id) }
    catch { return null }
    finally { setLoading(false) }
  }
  return { validar, loading }
}

export function useEliminarAuto() {
  const [loading, setLoading] = useState(false)
  const eliminar = async (id: string): Promise<boolean> => {
    setLoading(true)
    try { await eliminarAuto(id); return true }
    catch { return false }
    finally { setLoading(false) }
  }
  return { eliminar, loading }
}
