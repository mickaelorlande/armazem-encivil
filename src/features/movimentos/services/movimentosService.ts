import { supabase } from '@/integrations/supabase/client'
import type { Movement, MovementType, Unit } from '@/app/types'

type MovimentoRow = {
  id: string
  produto_id: string
  tipo: MovementType
  quantidade: number
  stock_antes: number
  stock_depois: number
  responsavel: string
  destino_obra: string | null
  observacoes: string | null
  created_at: string
  created_by: string
  produtos: { nome: string; unidade: string } | null
}

function toMovement(row: MovimentoRow): Movement {
  return {
    id: row.id,
    productId: row.produto_id,
    productName: row.produtos?.nome ?? '',
    type: row.tipo,
    quantity: row.quantidade,
    unit: (row.produtos?.unidade ?? '') as Unit,
    responsible: row.responsavel,
    destination: row.destino_obra ?? undefined,
    obra: row.destino_obra ?? undefined,
    notes: row.observacoes ?? undefined,
    date: new Date(row.created_at),
    previousStock: row.stock_antes,
    newStock: row.stock_depois,
  }
}

export type FiltrosMovimentos = {
  produtoId?: string
  tipo?: MovementType
  dataInicio?: Date
  dataFim?: Date
  limit?: number
  offset?: number
}

export async function listarMovimentos(filtros: FiltrosMovimentos = {}): Promise<Movement[]> {
  let query = supabase
    .from('movimentos_stock')
    .select('*, produtos(nome, unidade)')
    .order('created_at', { ascending: false })

  if (filtros.produtoId) query = query.eq('produto_id', filtros.produtoId)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.dataInicio) query = query.gte('created_at', filtros.dataInicio.toISOString())
  if (filtros.dataFim) {
    const fim = new Date(filtros.dataFim)
    fim.setDate(fim.getDate() + 1)
    query = query.lt('created_at', fim.toISOString())
  }
  if (filtros.limit) query = query.limit(filtros.limit)
  if (filtros.offset) query = query.range(filtros.offset, filtros.offset + (filtros.limit ?? 20) - 1)

  const { data, error } = await query
  if (error) throw error
  return (data as MovimentoRow[]).map(toMovement)
}

export type RegistarMovimentoInput = {
  produtoId: string
  tipo: MovementType
  quantidade: number
  responsavel: string
  destinoObra?: string
  observacoes?: string
}

export async function registarMovimento(input: RegistarMovimentoInput): Promise<void> {
  const { error } = await supabase.rpc('registar_movimento', {
    p_produto_id: input.produtoId,
    p_tipo: input.tipo,
    p_quantidade: input.quantidade,
    p_responsavel: input.responsavel,
    p_destino_obra: input.destinoObra ?? null,
    p_observacoes: input.observacoes ?? null,
  })
  if (error) throw error
}
