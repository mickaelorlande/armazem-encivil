import { supabase } from '@/integrations/supabase/client'
import type { Tool, ToolCategory, ToolStatus } from '@/app/types'

type FerramentaRow = {
  id: string
  codigo: string
  nome: string
  categoria: string
  numero_serie: string | null
  valor_estimado: number | null
  estado: ToolStatus
  ativo: boolean
  observacoes: string | null
  created_at: string
  updated_at: string
}

function toTool(row: FerramentaRow): Tool {
  return {
    id: row.id,
    code: row.codigo,
    name: row.nome,
    category: row.categoria as ToolCategory,
    serialNumber: row.numero_serie ?? undefined,
    estimatedValue: row.valor_estimado ?? undefined,
    status: row.estado,
    notes: row.observacoes ?? undefined,
    active: row.ativo,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function listarFerramentas(apenasAtivas = true): Promise<Tool[]> {
  let query = supabase.from('ferramentas').select('*').order('nome')
  if (apenasAtivas) query = query.eq('ativo', true)
  const { data, error } = await query
  if (error) throw error
  return (data as FerramentaRow[]).map(toTool)
}

export async function buscarFerramenta(id: string): Promise<Tool> {
  const { data, error } = await supabase
    .from('ferramentas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return toTool(data as FerramentaRow)
}

// 'code' nunca aparece aqui — código é gerado automaticamente pela coluna
// (DEFAULT com nextval) no momento do INSERT, e é imutável após criação.
export type NovaFerramenta = {
  name: string
  category: ToolCategory
  serialNumber?: string
  estimatedValue?: number
  notes?: string
}

export async function criarFerramenta(input: NovaFerramenta): Promise<Tool> {
  const { data, error } = await supabase
    .from('ferramentas')
    .insert({
      nome: input.name,
      categoria: input.category,
      numero_serie: input.serialNumber ?? null,
      valor_estimado: input.estimatedValue ?? null,
      observacoes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toTool(data as FerramentaRow)
}

export type AtualizarFerramenta = Partial<NovaFerramenta>

export async function atualizarFerramenta(id: string, input: AtualizarFerramenta): Promise<Tool> {
  const update: Record<string, unknown> = {}
  if (input.name !== undefined) update.nome = input.name
  if (input.category !== undefined) update.categoria = input.category
  if (input.serialNumber !== undefined) update.numero_serie = input.serialNumber || null
  if (input.estimatedValue !== undefined) update.valor_estimado = input.estimatedValue ?? null
  if (input.notes !== undefined) update.observacoes = input.notes

  const { data, error } = await supabase
    .from('ferramentas')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toTool(data as FerramentaRow)
}

export async function listarFerramentasArquivadas(): Promise<Tool[]> {
  const { data, error } = await supabase
    .from('ferramentas')
    .select('*')
    .eq('ativo', false)
    .order('nome')
  if (error) throw error
  return (data as FerramentaRow[]).map(toTool)
}

export async function arquivarFerramenta(id: string): Promise<void> {
  const { error } = await supabase
    .from('ferramentas')
    .update({ ativo: false })
    .eq('id', id)
  if (error) throw error
}

export async function restaurarFerramenta(id: string): Promise<void> {
  const { error } = await supabase
    .from('ferramentas')
    .update({ ativo: true })
    .eq('id', id)
  if (error) throw error
}

export async function gerarCodigoFerramentaPreview(): Promise<string> {
  const { data, error } = await supabase.rpc('gerar_codigo_ferramenta')
  if (error) throw error
  return data as string
}
