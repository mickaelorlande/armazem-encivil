import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, Printer, ChevronUp, ChevronDown, Minus, X, FileText,
} from 'lucide-react'
import { listarMovimentos } from '@/features/movimentos/services/movimentosService'
import { listarProdutos } from '@/features/produtos/services/produtosService'
import { getUnitLabel } from '../data/mockData'
import type { Movement, Product } from '../types'

/* ─── Tipos e helpers ───────────────────────────────────────────── */

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
  currFrom.setFullYear(currFrom.getFullYear() - 1)
  prevFrom.setFullYear(prevFrom.getFullYear() - 2)
  prevTo.setFullYear(prevTo.getFullYear() - 1)
  return { currFrom, prevFrom, prevTo, label: 'Este Ano', prevLabel: 'Ano anterior' }
}

function calcTrend(curr: number, prev: number) {
  if (prev === 0) return null
  const pct = ((curr - prev) / prev) * 100
  return { pct: Math.abs(Math.round(pct)), dir: pct > 1 ? 'up' : pct < -1 ? 'down' : 'neutral' } as const
}

function fmt(d: Date) {
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ─── Tooltip ───────────────────────────────────────────────────── */

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

/* ─── KPI Card (página normal) ──────────────────────────────────── */

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
            trend.dir === 'up'   ? 'bg-success/10 text-success' :
            trend.dir === 'down' ? 'bg-destructive/10 text-destructive' :
                                   'bg-muted/50 text-muted-foreground'
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
        <p className={`text-3xl font-bold ${valueColor}`}>{loading ? '…' : value}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
      </div>
    </div>
  )
}

/* ─── PRINT REPORT ──────────────────────────────────────────────── */

type PrintData = {
  current:    Movement[]
  previous:   Movement[]
  products:   Product[]
  period:     Period
  periodLabel: string
  prevLabel:  string
  activityData: Array<{ sortKey: string; label: string; Entradas: number; Saídas: number }>
  topProducts:  Array<{ name: string; qty: number }>
  stockHealth:  Array<{ name: string; value: number; color: string }>
  biggestExit:  Movement | null
}

function PrintReport({ data, onClose }: { data: PrintData; onClose: () => void }) {
  /* Injeta CSS de impressão — esconde tudo menos o relatório */
  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'encivil-print-css'
    s.textContent = `
      @media print {
        body > *:not(#encivil-print-root) { display: none !important; }
        #encivil-print-root { display: block !important; position: static !important; overflow: visible !important; }
        #encivil-print-root * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .no-print { display: none !important; }
        @page { margin: 12mm 15mm; size: A4 portrait; }
        .page-break { page-break-before: always; }
      }
    `
    document.head.appendChild(s)
    return () => { document.getElementById('encivil-print-css')?.remove() }
  }, [])

  const {
    current, previous, products, periodLabel, prevLabel,
    activityData, topProducts, stockHealth, biggestExit,
  } = data

  const currEntries = current.filter(m => m.type === 'entrada').length
  const currExits   = current.filter(m => m.type === 'saida').length
  const prevEntries = previous.filter(m => m.type === 'entrada').length
  const prevExits   = previous.filter(m => m.type === 'saida').length
  const trendTotal   = calcTrend(current.length,  previous.length)
  const trendEntries = calcTrend(currEntries, prevEntries)
  const trendExits   = calcTrend(currExits,   prevExits)
  const lowCount     = products.filter(p => p.status !== 'normal').length
  const today        = fmt(new Date())

  const NAVY   = '#1e3a8a'
  const GREEN  = '#16a34a'
  const RED    = '#dc2626'
  const AMBER  = '#f59e0b'
  const SLATE  = '#64748b'
  const LIGHT  = '#f8fafc'
  const BORDER = '#e2e8f0'

  const sectionTitle = (text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 20, background: NAVY, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontWeight: 700, fontSize: 13, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {text}
      </span>
    </div>
  )

  const trendBadge = (t: ReturnType<typeof calcTrend>) => {
    if (!t) return <span style={{ color: SLATE, fontSize: 11 }}>sem dados anteriores</span>
    const color = t.dir === 'up' ? GREEN : t.dir === 'down' ? RED : SLATE
    const arrow = t.dir === 'up' ? '▲' : t.dir === 'down' ? '▼' : '●'
    return (
      <span style={{ color, fontSize: 11, fontWeight: 700 }}>
        {arrow} {t.pct}% vs período anterior
      </span>
    )
  }

  return createPortal(
    <div
      id="encivil-print-root"
      style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 9999, overflowY: 'auto' }}
    >
      {/* ── Barra de controlo (oculta na impressão) ────────── */}
      <div
        className="no-print"
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'white', borderBottom: `1px solid ${BORDER}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText style={{ width: 16, height: 16, color: NAVY }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
            Pré-visualização · Relatório Executivo ENCIVIL
          </span>
          <span style={{ fontSize: 12, color: SLATE, marginLeft: 8 }}>
            {periodLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13,
              background: 'white', cursor: 'pointer', color: '#374151',
            }}
          >
            <X style={{ width: 14, height: 14 }} /> Fechar
          </button>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
              background: NAVY, color: 'white', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Printer style={{ width: 14, height: 14 }} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* ── Documento A4 ────────────────────────────────────── */}
      <div style={{ maxWidth: 794, margin: '0 auto', background: 'white', padding: '0 0 40px' }}>

        {/* ── Cabeçalho do documento ───────────────────── */}
        <div style={{ background: NAVY, color: 'white', padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: 'white', borderRadius: 10, padding: 6, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/icone_oficial.png" alt="ENCIVIL" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.02em' }}>ENCIVIL</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Relatório Executivo de Armazém</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{periodLabel}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Gerado em {today}</div>
            </div>
          </div>
          {/* Linha info */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 28, fontSize: 12, opacity: 0.8 }}>
            <span>Movimentos: <strong>{current.length}</strong></span>
            <span>Entradas: <strong style={{ color: '#86efac' }}>{currEntries}</strong></span>
            <span>Saídas: <strong style={{ color: '#fca5a5' }}>{currExits}</strong></span>
            <span>Produtos em alerta: <strong style={{ color: '#fde68a' }}>{lowCount}</strong></span>
          </div>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ── Secção 1: KPIs ────────────────────────── */}
          <div>
            {sectionTitle('Indicadores Executivos')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total de Movimentos', value: current.length,  color: NAVY,  trend: trendTotal   },
                { label: 'Entradas no Período',  value: currEntries,     color: GREEN, trend: trendEntries },
                { label: 'Saídas no Período',    value: currExits,       color: RED,   trend: trendExits   },
                { label: 'Produtos em Alerta',   value: lowCount,        color: AMBER, trend: null         },
              ].map(k => (
                <div key={k.label} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', background: LIGHT }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: SLATE, marginTop: 6, lineHeight: 1.3, fontWeight: 500 }}>{k.label}</div>
                  <div style={{ marginTop: 8 }}>{trendBadge(k.trend)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Secção 2: Atividade diária ─────────────── */}
          <div>
            {sectionTitle(`Atividade ${data.period === 'ano' ? 'Mensal' : 'Diária'} — Entradas e Saídas`)}
            {activityData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: LIGHT, borderRadius: 10, border: `1px solid ${BORDER}`, color: SLATE, fontSize: 13 }}>
                Sem movimentos no período selecionado
              </div>
            ) : (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 8px 8px', background: 'white' }}>
                <LineChart width={698} height={220} data={activityData} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: SLATE }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: SLATE }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BORDER}` }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="Entradas" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3, fill: GREEN }} />
                  <Line type="monotone" dataKey="Saídas"   stroke={RED}   strokeWidth={2.5} dot={{ r: 3, fill: RED }}   />
                </LineChart>
              </div>
            )}
          </div>

          {/* ── Secção 3: Top produtos + Saúde do stock ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>

            {/* Top produtos */}
            <div>
              {sectionTitle('Top Produtos Consumidos')}
              {topProducts.length === 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: LIGHT, borderRadius: 10, border: `1px solid ${BORDER}`, color: SLATE, fontSize: 13 }}>
                  Sem saídas no período
                </div>
              ) : (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 8px 8px', background: 'white' }}>
                  <BarChart width={400} height={200} data={topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={BORDER} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: SLATE }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={105} tick={{ fontSize: 11, fill: '#1e293b' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BORDER}` }} />
                    <Bar dataKey="qty" name="Quantidade" fill={NAVY} radius={[0, 5, 5, 0]} maxBarSize={22} />
                  </BarChart>
                </div>
              )}
            </div>

            {/* Saúde do stock */}
            <div>
              {sectionTitle('Saúde do Stock')}
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px', background: 'white' }}>
                {stockHealth.length > 0 ? (
                  <>
                    <PieChart width={260} height={160}>
                      <Pie data={stockHealth} cx="50%" cy="50%" innerRadius={42} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {stockHealth.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BORDER}` }} />
                    </PieChart>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {stockHealth.map(s => (
                        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ color: SLATE }}>{s.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SLATE, fontSize: 13 }}>
                    Sem produtos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Secção 4: Resumo executivo ───────────────── */}
          <div>
            {sectionTitle('Resumo Executivo')}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: NAVY, color: 'white' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Indicador</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>Valor</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>Tendência</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Total de movimentos',        value: String(current.length),   trend: trendTotal   },
                  { label: 'Entradas no período',         value: String(currEntries),      trend: trendEntries },
                  { label: 'Saídas no período',           value: String(currExits),        trend: trendExits   },
                  { label: 'Produtos cadastrados',        value: String(products.length),  trend: null },
                  { label: 'Produtos com stock baixo',    value: String(products.filter(p => p.status === 'baixo').length), trend: null },
                  { label: 'Produtos sem stock',          value: String(products.filter(p => p.status === 'sem-stock').length), trend: null },
                  {
                    label: 'Taxa de saídas',
                    value: current.length > 0 ? `${Math.round((currExits / current.length) * 100)}%` : '—',
                    trend: null,
                  },
                  {
                    label: 'Maior saída do período',
                    value: biggestExit
                      ? `${biggestExit.productName} · ${biggestExit.quantity} ${getUnitLabel(biggestExit.unit)}`
                      : '—',
                    trend: null,
                  },
                ].map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? 'white' : LIGHT }}>
                    <td style={{ padding: '10px 16px', color: '#374151', borderBottom: `1px solid ${BORDER}` }}>
                      {row.label}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b', textAlign: 'right', borderBottom: `1px solid ${BORDER}` }}>
                      {row.value}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', borderBottom: `1px solid ${BORDER}` }}>
                      {trendBadge(row.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Secção 5: Top 10 movimentos do período ───── */}
          {current.length > 0 && (
            <div>
              {sectionTitle('Últimos Movimentos do Período')}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: NAVY, color: 'white' }}>
                    {['Data', 'Produto', 'Tipo', 'Quantidade', 'Responsável', 'Destino'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.slice(0, 15).map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? 'white' : LIGHT }}>
                      <td style={{ padding: '8px 12px', color: SLATE, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                        {fmt(m.date)}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#1e293b', borderBottom: `1px solid ${BORDER}` }}>
                        {m.productName}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: m.type === 'entrada' ? '#dcfce7' : '#fee2e2',
                          color: m.type === 'entrada' ? GREEN : RED,
                        }}>
                          {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b', borderBottom: `1px solid ${BORDER}` }}>
                        {m.quantity} {getUnitLabel(m.unit)}
                      </td>
                      <td style={{ padding: '8px 12px', color: SLATE, borderBottom: `1px solid ${BORDER}` }}>
                        {m.responsible}
                      </td>
                      <td style={{ padding: '8px 12px', color: SLATE, borderBottom: `1px solid ${BORDER}` }}>
                        {m.destination ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {current.length > 15 && (
                <p style={{ fontSize: 11, color: SLATE, marginTop: 6, textAlign: 'right' }}>
                  A mostrar os 15 movimentos mais recentes de {current.length} total
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Rodapé do documento ──────────────────────── */}
        <div style={{
          borderTop: `3px solid ${NAVY}`, margin: '0 32px', padding: '14px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: SLATE,
        }}>
          <span>Gerado automaticamente pelo Sistema de Controlo de Armazém ENCIVIL</span>
          <span style={{ fontWeight: 600 }}>© 2026 ENCIVIL</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Página principal ──────────────────────────────────────────── */

export function ReportsPage() {
  const [period, setPeriod]   = useState<Period>('mes')
  const [loading, setLoading] = useState(true)
  const [current,  setCurrent]  = useState<Movement[]>([])
  const [previous, setPrevious] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showPrint, setShowPrint] = useState(false)

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
        setCurrent(curr); setPrevious(prev); setProducts(prods)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period])

  /* Valores derivados */
  const currEntries = useMemo(() => current.filter(m => m.type === 'entrada').length, [current])
  const currExits   = useMemo(() => current.filter(m => m.type === 'saida').length,   [current])
  const prevEntries = useMemo(() => previous.filter(m => m.type === 'entrada').length, [previous])
  const prevExits   = useMemo(() => previous.filter(m => m.type === 'saida').length,   [previous])
  const trendTotal   = calcTrend(current.length,  previous.length)
  const trendEntries = calcTrend(currEntries, prevEntries)
  const trendExits   = calcTrend(currExits,   prevExits)
  const lowStockCount = useMemo(() => products.filter(p => p.status !== 'normal').length, [products])

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

  const stockHealth = useMemo(() => [
    { name: 'Normal',      value: products.filter(p => p.status === 'normal').length,    color: '#16a34a' },
    { name: 'Stock Baixo', value: products.filter(p => p.status === 'baixo').length,     color: '#f59e0b' },
    { name: 'Sem Stock',   value: products.filter(p => p.status === 'sem-stock').length, color: '#dc2626' },
  ].filter(d => d.value > 0), [products])

  const biggestExit = useMemo(() => {
    const exits = current.filter(m => m.type === 'saida')
    if (!exits.length) return null
    return exits.reduce((max, m) => m.quantity > max.quantity ? m : max, exits[0])
  }, [current])

  const { label: periodLabel, prevLabel } = getPeriodConfig(period)

  return (
    <div className="space-y-6 pb-8">

      {/* ── Banner ───────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 md:p-6 text-white shadow-lg">
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
              onClick={() => setShowPrint(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">{periodLabel} · comparado com {prevLabel}</p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Total de Movimentos" value={current.length} icon={BarChart3}       iconBg="bg-primary/10"     valueColor="text-primary"     trend={trendTotal}   loading={loading} />
        <KpiCard label="Entradas no Período" value={currEntries}    icon={ArrowDownCircle} iconBg="bg-success/10"     valueColor="text-success"     trend={trendEntries} loading={loading} />
        <KpiCard label="Saídas no Período"   value={currExits}      icon={ArrowUpCircle}   iconBg="bg-destructive/10" valueColor="text-destructive" trend={trendExits}   loading={loading} />
        <KpiCard label="Produtos em Alerta"  value={lowStockCount}  icon={AlertTriangle}   iconBg="bg-warning/10"     valueColor="text-warning"     trend={null}         loading={loading} />
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
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="Entradas" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Saídas"   stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top produtos + saúde do stock ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
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
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number"   tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#1e293b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="qty" name="Quantidade" fill="#1e3a8a" radius={[0, 6, 6, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

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
                    <Pie data={stockHealth} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {stockHealth.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
            { label: 'Produtos cadastrados',     value: String(products.length) },
            { label: 'Produtos com stock baixo', value: String(products.filter(p => p.status === 'baixo').length),    color: 'text-warning'     },
            { label: 'Produtos sem stock',       value: String(products.filter(p => p.status === 'sem-stock').length), color: 'text-destructive'  },
            { label: 'Taxa de saídas',           value: !loading && current.length > 0 ? `${Math.round((currExits / current.length) * 100)}%` : '—' },
            { label: 'Maior saída do período',   value: !loading && biggestExit ? `${biggestExit.productName} · ${biggestExit.quantity} ${getUnitLabel(biggestExit.unit)}` : '—' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm font-semibold text-right max-w-[60%] truncate ${row.color ?? 'text-foreground'}`}>
                {loading ? '…' : row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Print Report ─────────────────────────────────── */}
      {showPrint && (
        <PrintReport
          data={{
            current, previous, products, period,
            periodLabel, prevLabel,
            activityData, topProducts, stockHealth, biggestExit,
          }}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  )
}
