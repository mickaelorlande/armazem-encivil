import { supabase } from '@/integrations/supabase/client'
import type { TablesUpdate } from '@/integrations/supabase/types'
import type { Obra, ObraStatus } from '@/app/types'

type ObraRow = {
  id: string
  nome: string
  cliente: string | null
  localizacao: string | null
  estado: ObraStatus
  orcamento: number | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

function toObra(row: ObraRow): Obra {
  return {
    id: row.id,
    name: row.nome,
    client: row.cliente ?? undefined,
    location: row.localizacao ?? undefined,
    status: row.estado,
    budget: row.orcamento ?? undefined,
    notes: row.observacoes ?? undefined,
    active: row.ativo,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function listarObras(apenasAtivas = true): Promise<Obra[]> {
  let query = supabase.from('obras').select('*').order('nome')
  if (apenasAtivas) query = query.eq('ativo', true)
  const { data, error } = await query
  if (error) throw error
  return (data as ObraRow[]).map(toObra)
}

export async function buscarObra(id: string): Promise<Obra> {
  const { data, error } = await supabase.from('obras').select('*').eq('id', id).single()
  if (error) throw error
  return toObra(data as ObraRow)
}

export type NovaObra = {
  name: string
  client?: string
  location?: string
  status?: ObraStatus
  budget?: number
  notes?: string
}

export async function criarObra(input: NovaObra): Promise<Obra> {
  const { data, error } = await supabase
    .from('obras')
    .insert({
      nome: input.name,
      cliente: input.client ?? null,
      localizacao: input.location ?? null,
      estado: input.status ?? 'ativa',
      orcamento: input.budget ?? null,
      observacoes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toObra(data as ObraRow)
}

export type AtualizarObra = Partial<NovaObra> & { active?: boolean }

export async function atualizarObra(id: string, input: AtualizarObra): Promise<Obra> {
  const update: Record<string, unknown> = {}
  if (input.name !== undefined)     update.nome = input.name
  if (input.client !== undefined)   update.cliente = input.client || null
  if (input.location !== undefined) update.localizacao = input.location || null
  if (input.status !== undefined)   update.estado = input.status
  if (input.budget !== undefined)   update.orcamento = input.budget ?? null
  if (input.notes !== undefined)    update.observacoes = input.notes || null
  if (input.active !== undefined)   update.ativo = input.active

  const { data, error } = await supabase
    .from('obras')
    .update(update as TablesUpdate<'obras'>)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toObra(data as ObraRow)
}
