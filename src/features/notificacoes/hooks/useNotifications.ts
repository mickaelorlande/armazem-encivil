import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type StockNotification = {
  id: string
  productId: string
  productName: string
  currentStock: number
  minStock: number
  unit: string
  severity: 'sem-stock' | 'baixo'
}

export function useNotifications() {
  const [items, setItems] = useState<StockNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, unidade, stock_atual, stock_minimo')
      .eq('ativo', true)

    if (data) {
      const alerts = data
        .filter(p => p.stock_atual <= p.stock_minimo)
        .map(p => ({
          id: p.id,
          productId: p.id,
          productName: p.nome,
          currentStock: p.stock_atual,
          minStock: p.stock_minimo,
          unit: p.unidade,
          severity: (p.stock_atual <= 0 ? 'sem-stock' : 'baixo') as 'sem-stock' | 'baixo',
        }))
        .sort((a, b) => {
          if (a.severity === 'sem-stock' && b.severity !== 'sem-stock') return -1
          if (a.severity !== 'sem-stock' && b.severity === 'sem-stock') return 1
          return 0
        })
      setItems(alerts)
    }
    setLoading(false)
  }, [])

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
