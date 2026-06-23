import { useState, useEffect, useCallback } from 'react'
import type { Tool } from '@/app/types'
import {
  listarFerramentas,
  listarFerramentasArquivadas,
  buscarFerramenta,
  criarFerramenta,
  atualizarFerramenta,
  arquivarFerramenta,
  restaurarFerramenta,
  type NovaFerramenta,
  type AtualizarFerramenta,
} from '../services/ferramentasService'

export function useFerramentas(apenasAtivas = true) {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarFerramentas(apenasAtivas)
      setTools(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar ferramentas')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivas])

  useEffect(() => { load() }, [load])

  return { tools, loading, error, reload: load }
}

export function useFerramenta(id: string | undefined) {
  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await buscarFerramenta(id)
      setTool(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ferramenta não encontrada')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { tool, loading, error, reload: load }
}

export function useCriarFerramenta() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const criar = async (input: NovaFerramenta): Promise<Tool | null> => {
    setLoading(true)
    setError(null)
    try {
      return await criarFerramenta(input)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar ferramenta'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { criar, loading, error }
}

export function useAtualizarFerramenta() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const atualizar = async (id: string, input: AtualizarFerramenta): Promise<Tool | null> => {
    setLoading(true)
    setError(null)
    try {
      return await atualizarFerramenta(id, input)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar ferramenta'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { atualizar, loading, error }
}

export function useFerramentasArquivadas() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setTools(await listarFerramentasArquivadas()) }
    catch { setTools([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  return { tools, loading, reload: load }
}

export function useArquivarFerramenta() {
  const [loading, setLoading] = useState(false)
  const arquivar = async (id: string): Promise<boolean> => {
    setLoading(true)
    try { await arquivarFerramenta(id); return true }
    catch { return false }
    finally { setLoading(false) }
  }
  return { arquivar, loading }
}

export function useRestaurarFerramenta() {
  const [loading, setLoading] = useState(false)
  const restaurar = async (id: string): Promise<boolean> => {
    setLoading(true)
    try { await restaurarFerramenta(id); return true }
    catch { return false }
    finally { setLoading(false) }
  }
  return { restaurar, loading }
}
