import { useState, useEffect, useCallback } from 'react'
import type { Vehicle, FuelEntry } from '@/app/types'
import {
  listarVeiculos, buscarVeiculo, criarVeiculo, atualizarVeiculo,
  type NovoVeiculo, type AtualizarVeiculo,
} from '../services/veiculosService'
import {
  listarAbastecimentos, buscarAbastecimento, criarAbastecimento,
  atualizarAbastecimento, eliminarAbastecimento,
  type FiltrosAbastecimentos, type NovoAbastecimento, type AtualizarAbastecimento,
} from '../services/abastecimentosService'

/* ── Veículos ──────────────────────────────────────────────────── */

export function useVeiculos(apenasAtivos = true) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try { setVehicles(await listarVeiculos(apenasAtivos)) }
    catch { setVehicles([]) }
    finally { setLoading(false) }
  }, [apenasAtivos])
  useEffect(() => { load() }, [load])
  return { vehicles, loading, reload: load }
}

export function useVeiculo(id: string | undefined) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    try { setVehicle(await buscarVeiculo(id)) }
    catch { setVehicle(null) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])
  return { vehicle, loading, reload: load }
}

export function useGuardarVeiculo() {
  const [loading, setLoading] = useState(false)
  const criar = async (input: NovoVeiculo): Promise<Vehicle | null> => {
    setLoading(true)
    try { return await criarVeiculo(input) } catch { return null } finally { setLoading(false) }
  }
  const atualizar = async (id: string, input: AtualizarVeiculo): Promise<Vehicle | null> => {
    setLoading(true)
    try { return await atualizarVeiculo(id, input) } catch { return null } finally { setLoading(false) }
  }
  return { criar, atualizar, loading }
}

/* ── Abastecimentos ────────────────────────────────────────────── */

export function useAbastecimentos(filtros: FiltrosAbastecimentos = {}) {
  const [entries, setEntries] = useState<FuelEntry[]>([])
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const key = JSON.stringify(filtros)
  const load = useCallback(async () => {
    setLoading(true)
    try { setEntries(await listarAbastecimentos(filtros)) }
    catch { setEntries([]) }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  useEffect(() => { load() }, [load])
  return { entries, loading, reload: load }
}

export function useAbastecimento(id: string | undefined) {
  const [entry, setEntry] = useState<FuelEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    try { setEntry(await buscarAbastecimento(id)) }
    catch { setEntry(null) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])
  return { entry, loading, reload: load }
}

export function useGuardarAbastecimento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const criar = async (input: NovoAbastecimento): Promise<FuelEntry | null> => {
    setLoading(true); setError(null)
    try { return await criarAbastecimento(input) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar'); return null }
    finally { setLoading(false) }
  }
  const atualizar = async (id: string, input: AtualizarAbastecimento): Promise<FuelEntry | null> => {
    setLoading(true); setError(null)
    try { return await atualizarAbastecimento(id, input) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar'); return null }
    finally { setLoading(false) }
  }
  return { criar, atualizar, loading, error }
}

export function useEliminarAbastecimento() {
  const [loading, setLoading] = useState(false)
  const eliminar = async (id: string): Promise<boolean> => {
    setLoading(true)
    try { await eliminarAbastecimento(id); return true } catch { return false } finally { setLoading(false) }
  }
  return { eliminar, loading }
}
