import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, Printer, ChevronUp, ChevronDown, Minus,
} from 'lucide-react'
import { listarMovimentos } from '@/features/movimentos/services/movimentosService'
import { listarProdutos } from '@/features/produtos/services/produtosService'
import { getCategoryLabel, getUnitLabel } from '../data/mockData'
import type { Movement, Product } from '../types'

/* ── Tipos e helpers ─────────────────────────────────────────── */

type Period = 'hoje' | 'semana' | 'mes' | 'ano'

function getPeriodConfig(p: Period) {
  const now = new Date()
  const currFrom = new Date(now)
  const prevFrom = new Date(now)
  const prevTo   = new Date(now)

  if (p === 'hoje') {
    currFrom.setHours(0, 0, 0, 0)
    prevFrom.setDate(prevFrom.getDate() - 1); prevFrom.setHours(0, 0, 0, 0)
    prevTo.setDate(prevTo.getDate() - 1); prevTo.setHours(23, 59, 59, 999)
    return { currFrom, prevFrom, prevTo, label: 'Hoje', prevLabel: 'Ontem' }
  }
  if (p === 'semana') {
    currFrom.setDate(currFrom.getDate() - 7)
    prevFrom.setDate(prevFrom.getDate() - 14)
    prevTo.setDate(prevTo.getDate() - 7)
    return { currFrom, prevFrom, prevTo, label: 'Esta Semana', prevLabel: 'Semana anterior' }
  }
  if (p === 'mes') {
    currFrom.setMonth(currFrom.getMonth() - 1)
    prevFrom.setMonth(prevFrom.getMonth() - 2)
    prevTo.setMonth(prevTo.getMonth() - 1)
    return { currFrom, prevFrom, prevTo, label: 'Este Mês', prevLabel: 'Mês anterior' }
  }
  // ano
  currFrom.setFullYear(currFrom.getFullYear() - 1)
  prevFrom.setFullYear(prevFrom.getFullYear() - 2)
  prevTo.setFullYear(prevTo.getFullYear() - 1)
  return { currFrom, prevFrom, prevTo, label: 'Este Ano', prevLabel: 'Ano anterior' }
}

function calcTrend(curr: number, prev: number) {
  if (prev === 0) return null
  const pct = ((curr - prev) / prev) * 100
  return {
    pct: Math.abs(Math.round(pct)),
    dir: pct > 1 ? 'up' : pct < -1 ? 'down' : 'neutral',
  } as const
}

/* ── KPI Card ────────────────────────────────────────────────── */

function KpiCard({
  label, value, icon: Icon, iconBg, valueColor, trend, loading,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  valueColor: string
  trend: ReturnType<typeof calcTrend>
  loading: boolean
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${valueColor}`} />
        </div>
        {trend ? (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
            trend.dir === 'up'
              ? 'bg-success/10 text-success'
              : trend.dir === 'down'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {trend.dir === 'up'   ? <ChevronUp   className="w-3 h-3" /> :
             trend.dir === 'down' ? <ChevronDown className="w-3 h-3" /> :
                                    <Minus        className="w-3 h-3" />}
            {trend.pct}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-bold ${valueColor}`}>
          {loading ? '…' : value}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
      </div>
    </div>
  )
}

/* ── Tooltip customizado ─────────────────────────────────────── */

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-foreground mb-1.5">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('mes')
  const [loading, setLoading] = useState(true)
  const [current,  setCurrent]  = useState<Movement[]>([])
  const [previous, setPrevious] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])

  /* Fetch: período atual + anterior + produtos */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const { currFrom, prevFrom, prevTo } = getPeriodConfig(period)

    Promise.all([
      listarMovimentos({ dataInicio: currFrom }),
      listarMovimentos({ dataInicio: prevFrom, dataFim: prevTo }),
      listarProdutos(false),
    ])
      .then(([curr, prev, prods]) => {
        if (cancelled) return
        setCurrent(curr)
        setPrevious(prev)
        setProducts(prods)
      })
      .catch(() => {/* erros silenciosos — dados ficam em branco */})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [period])

  /* ── Cálculos derivados ──────────────────────────────────── */

  const currEntries = useMemo(() => current.filter(m => m.type === 'entrada').length, [current])
  const currExits   = useMemo(() => current.filter(m => m.type === 'saida').length,   [current])
  const prevEntries = useMemo(() => previous.filter(m => m.type === 'entrada').length, [previous])
  const prevExits   = useMemo(() => previous.filter(m => m.type === 'saida').length,   [previous])

  const trendTotal   = calcTrend(current.length,  previous.length)
  const trendEntries = calcTrend(currEntries, prevEntries)
  const trendExits   = calcTrend(currExits,   prevExits)

  const lowStockCount = useMemo(
    () => products.filter(p => p.status !== 'normal').length,
    [products],
  )

  /* Atividade diária / mensal */
  const activityData = useMemo(() => {
    const byYear = period === 'ano'
    const buckets = new Map<string, { sortKey: string; label: string; Entradas: number; Saídas: number }>()

    current.forEach(m => {
      const sortKey = byYear
        ? `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`
        : m.date.toISOString().split('T')[0]
      const label = byYear
        ? m.date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
        : m.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })

      const existing = buckets.get(sortKey) ?? { sortKey, label, Entradas: 0, Saídas: 0 }
      if (m.type === 'entrada') existing.Entradas++
      else if (m.type === 'saida') existing.Saídas++
      buckets.set(sortKey, existing)
    })

    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [current, period])

  /* Top 5 produtos consumidos */
  const topProducts = useMemo(() =>
    current
      .filter(m => m.type === 'saida')
      .reduce((acc, m) => {
        const e = acc.find(i => i.name === m.productName)
        if (e) e.qty += m.quantity
        else acc.push({ name: m.productName.length > 22 ? m.productName.slice(0, 21) + '…' : m.productName, qty: m.quantity })
        return acc
      }, [] as Array<{ name: string; qty: number }>)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5),
  [current])

  /* Saúde do stock (donut) */
  const stockHealth = useMemo(() => [
    { name: 'Normal',     value: products.filter(p => p.status === 'normal').length,     color: '#16a34a' },
    { name: 'Stock Baixo', value: products.filter(p => p.status === 'baixo').length,     color: '#f59e0b' },
    { name: 'Sem Stock',  value: products.filter(p => p.status === 'sem-stock').length,  color: '#dc2626' },
  ].filter(d => d.value > 0), [products])

  /* Maior saída do período */
  const biggestExit = useMemo(() => {
    const exits = current.filter(m => m.type === 'saida')
    if (!exits.length) return null
    return exits.reduce((max, m) => m.quantity > max.quantity ? m : max, exits[0])
  }, [current])

  const { label: periodLabel, prevLabel } = getPeriodConfig(period)

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-6 pb-8 print:space-y-4">

      {/* ── Banner ───────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 md:p-6 text-white shadow-lg print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2.5 shrink-0">
              <img src="/icone_oficial.png" alt="ENCIVIL" className="w-10 h-10 object-contain" draggable={false} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">Relatório Executivo</h1>
              <p className="text-white/70 text-sm mt-0.5">Análise de armazém · ENCIVIL</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as Period)}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="hoje"   className="text-foreground bg-card">Hoje</option>
              <option value="semana" className="text-foreground bg-card">Esta Semana</option>
              <option value="mes"    className="text-foreground bg-card">Este Mês</option>
              <option value="ano"    className="text-foreground bg-card">Este Ano</option>
            </select>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>
        {/* Período comparado */}
        <p className="text-white/60 text-xs mt-3">
          {periodLabel} · comparado com {prevLabel}
        </p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          label="Total de Movimentos"
          value={current.length}
          icon={BarChart3}
          iconBg="bg-primary/10"
          valueColor="text-primary"
          trend={trendTotal}
          loading={loading}
        />
        <KpiCard
          label="Entradas no Período"
          value={currEntries}
          icon={ArrowDownCircle}
          iconBg="bg-success/10"
          valueColor="text-success"
          trend={trendEntries}
          loading={loading}
        />
        <KpiCard
          label="Saídas no Período"
          value={currExits}
          icon={ArrowUpCircle}
          iconBg="bg-destructive/10"
          valueColor="text-destructive"
          trend={trendExits}
          loading={loading}
        />
        <KpiCard
          label="Produtos em Alerta"
          value={lowStockCount}
          icon={AlertTriangle}
          iconBg="bg-warning/10"
          valueColor="text-warning"
          trend={null}
          loading={loading}
        />
      </div>

      {/* ── Atividade diária ─────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-base">Atividade {period === 'ano' ? 'Mensal' : 'Diária'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Entradas e saídas ao longo do período</p>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">A carregar…</div>
        ) : activityData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sem movimentos no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              <Line
                type="monotone"
                dataKey="Entradas"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#16a34a' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Saídas"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#dc2626' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top produtos + saúde do stock ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">

        {/* Top 5 produtos consumidos */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-base">Top Produtos Consumidos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Maior volume de saídas no período</p>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">A carregar…</div>
          ) : topProducts.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2">
              <TrendingDown className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sem saídas no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: '#1e293b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="qty" name="Quantidade" fill="#1e3a8a" radius={[0, 6, 6, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Saúde do stock */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 flex flex-col">
          <div className="mb-5">
            <h2 className="font-semibold text-base">Saúde do Stock</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Estado atual dos produtos</p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">A carregar…</div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Sem produtos</div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stockHealth}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {stockHealth.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda */}
              <div className="space-y-2 mt-2">
                {stockHealth.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Resumo executivo ─────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-base">Resumo Executivo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
        </div>
        <div className="divide-y divide-border">
          {[
            {
              label: 'Produtos ativos cadastrados',
              value: loading ? '…' : String(products.filter(p => p.status !== undefined).length),
              accent: false,
            },
            {
              label: 'Produtos com stock baixo',
              value: loading ? '…' : String(products.filter(p => p.status === 'baixo').length),
              accent: products.filter(p => p.status === 'baixo').length > 0,
              accentColor: 'text-warning',
            },
            {
              label: 'Produtos sem stock',
              value: loading ? '…' : String(products.filter(p => p.status === 'sem-stock').length),
              accent: products.filter(p => p.status === 'sem-stock').length > 0,
              accentColor: 'text-destructive',
            },
            {
              label: 'Taxa de saídas sobre total',
              value: loading || current.length === 0
                ? '—'
                : `${Math.round((currExits / current.length) * 100)}%`,
              accent: false,
            },
            {
              label: 'Maior saída do período',
              value: loading
                ? '…'
                : biggestExit
                ? `${biggestExit.productName} · ${biggestExit.quantity} ${getUnitLabel(biggestExit.unit)}`
                : '—',
              accent: false,
            },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm font-semibold text-right max-w-[60%] truncate ${row.accent ? row.accentColor : 'text-foreground'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
