import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { getUnitLabel } from '@/app/data/mockData'
import { useRole } from '@/features/auth/useRole'

export type NotificationKind = 'stock' | 'tool-overdue' | 'pending'
export type NotificationSeverity = 'danger' | 'warning' | 'info'

export type AppNotification = {
  id: string
  kind: NotificationKind
  title: string
  subtitle: string
  severity: NotificationSeverity
  link: string
}

export function useNotifications() {
  const { podeValidar } = useRole()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [produtosRes, atrasoRes, subsPend, autosPend] = await Promise.all([
      supabase.from('produtos').select('id, nome, unidade, stock_atual, stock_minimo').eq('ativo', true),
      supabase
        .from('emprestimos_ferramentas')
        .select('id, ferramenta_id, funcionario_nome, data_prevista_devolucao, ferramentas(nome, codigo)')
        .eq('estado', 'ativo')
        .not('data_prevista_devolucao', 'is', null)
        .lt('data_prevista_devolucao', today),
      podeValidar
        ? supabase.from('subempreiteiros').select('id', { count: 'exact', head: true }).eq('estado', 'rascunho')
        : Promise.resolve({ count: 0 }),
      podeValidar
        ? supabase.from('autos_medicao').select('id', { count: 'exact', head: true }).eq('estado', 'rascunho')
        : Promise.resolve({ count: 0 }),
    ])

    const notifs: AppNotification[] = []

    // 1. Stock baixo / sem stock
    type ProdRow = { id: string; nome: string; unidade: string; stock_atual: number; stock_minimo: number }
    ;(((produtosRes.data ?? []) as ProdRow[])
      .filter(p => p.stock_atual <= p.stock_minimo)
      .sort((a, b) => a.stock_atual - b.stock_atual))
      .forEach(p => {
        const semStock = p.stock_atual <= 0
        notifs.push({
          id: `stock-${p.id}`,
          kind: 'stock',
          title: p.nome,
          subtitle: `${semStock ? 'Sem stock' : 'Stock baixo'} · ${p.stock_atual} / ${p.stock_minimo} ${getUnitLabel(p.unidade)}`,
          severity: semStock ? 'danger' : 'warning',
          link: `/produtos/${p.id}`,
        })
      })

    // 2. Ferramentas em atraso
    type LoanRow = { id: string; ferramenta_id: string; funcionario_nome: string; data_prevista_devolucao: string; ferramentas: { nome: string } | null }
    ;((atrasoRes.data ?? []) as LoanRow[]).forEach(l => {
      notifs.push({
        id: `tool-${l.id}`,
        kind: 'tool-overdue',
        title: l.ferramentas?.nome ?? 'Ferramenta',
        subtitle: `Em atraso · ${l.funcionario_nome} · desde ${new Date(l.data_prevista_devolucao).toLocaleDateString('pt-PT')}`,
        severity: 'danger',
        link: `/ferramentas/${l.ferramenta_id}`,
      })
    })

    // 3. Validações pendentes (só admin)
    const porValidar = (subsPend.count ?? 0) + (autosPend.count ?? 0)
    if (porValidar > 0) {
      notifs.push({
        id: 'pending-validation',
        kind: 'pending',
        title: `${porValidar} ${porValidar === 1 ? 'item aguarda' : 'itens aguardam'} validação`,
        subtitle: [
          (subsPend.count ?? 0) > 0 ? `${subsPend.count} contrato${subsPend.count !== 1 ? 's' : ''}` : '',
          (autosPend.count ?? 0) > 0 ? `${autosPend.count} auto${autosPend.count !== 1 ? 's' : ''}` : '',
        ].filter(Boolean).join(' · '),
        severity: 'info',
        link: '/subempreiteiros',
      })
    }

    setItems(notifs)
    setLoading(false)
  }, [podeValidar])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  return { notifications: items, count: items.length, loading, reload: load }
}
