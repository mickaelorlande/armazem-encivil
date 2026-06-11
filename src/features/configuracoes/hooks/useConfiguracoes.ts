import { useState, useEffect, useCallback } from 'react'
import {
  buscarConfiguracoes,
  atualizarConfiguracoes,
  type Configuracoes,
  type AtualizarConfiguracoes,
} from '../services/configuracoesService'

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await buscarConfiguracoes()
      setConfig(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const atualizar = async (input: AtualizarConfiguracoes): Promise<boolean> => {
    if (!config) return false
    setSaving(true)
    try {
      const updated = await atualizarConfiguracoes(config.id, input)
      setConfig(updated)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar configurações')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { config, loading, saving, error, atualizar, reload: load }
}
