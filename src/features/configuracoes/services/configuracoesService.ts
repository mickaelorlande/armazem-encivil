import { supabase } from '@/integrations/supabase/client'

export type Configuracoes = {
  id: string
  nomeEmpresa: string
  logoUrl: string | null
  responsavelArmazem: string | null
  stockMinimoPadrao: number
}

type ConfigRow = {
  id: string
  nome_empresa: string
  logo_url: string | null
  responsavel_armazem: string | null
  stock_minimo_padrao: number
}

function toConfig(row: ConfigRow): Configuracoes {
  return {
    id: row.id,
    nomeEmpresa: row.nome_empresa,
    logoUrl: row.logo_url,
    responsavelArmazem: row.responsavel_armazem,
    stockMinimoPadrao: row.stock_minimo_padrao,
  }
}

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  const { data, error } = await supabase
    .from('configuracoes_empresa')
    .select('*')
    .limit(1)
    .single()
  if (error) throw error
  return toConfig(data as ConfigRow)
}

export type AtualizarConfiguracoes = {
  nomeEmpresa?: string
  responsavelArmazem?: string | null
  stockMinimoPadrao?: number
}

export async function atualizarConfiguracoes(
  id: string,
  input: AtualizarConfiguracoes
): Promise<Configuracoes> {
  const update: Record<string, unknown> = {}
  if (input.nomeEmpresa !== undefined) update.nome_empresa = input.nomeEmpresa
  if (input.responsavelArmazem !== undefined) update.responsavel_armazem = input.responsavelArmazem
  if (input.stockMinimoPadrao !== undefined) update.stock_minimo_padrao = input.stockMinimoPadrao

  const { data, error } = await supabase
    .from('configuracoes_empresa')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toConfig(data as ConfigRow)
}
