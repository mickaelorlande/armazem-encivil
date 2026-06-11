import { useState, useMemo } from 'react';
import { History, Filter, ChevronDown } from 'lucide-react';
import { MovementTypeBadge } from '../components/MovementTypeBadge';
import { EmptyState } from '../components/EmptyState';
import { getUnitLabel } from '../data/mockData';
import type { MovementType } from '../types';
import { useMovimentos } from '@/features/movimentos/hooks/useMovimentos';
import type { FiltrosMovimentos } from '@/features/movimentos/services/movimentosService';

export function HistoryPage() {
  const [filterType, setFilterType]     = useState<MovementType | 'todos'>('todos');
  const [filterPeriod, setFilterPeriod] = useState<string>('todos');
  const [filtersOpen, setFiltersOpen]   = useState(false);

  const filtros = useMemo((): FiltrosMovimentos => {
    const f: FiltrosMovimentos = {}
    if (filterType !== 'todos') f.tipo = filterType as MovementType
    if (filterPeriod === 'hoje') {
      const d = new Date(); d.setHours(0, 0, 0, 0)
      f.dataInicio = d
    } else if (filterPeriod === 'semana') {
      const d = new Date(); d.setDate(d.getDate() - 7)
      f.dataInicio = d
    } else if (filterPeriod === 'mes') {
      const d = new Date(); d.setMonth(d.getMonth() - 1)
      f.dataInicio = d
    }
    return f
  }, [filterType, filterPeriod])

  const { movements, loading } = useMovimentos(filtros);

  const selectCls = "px-3 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'A carregar…' : `${movements.length} movimento(s)`}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        {/* Toggle filtros (mobile) */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="md:hidden w-full p-4 flex items-center justify-between text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filtros
            {(filterType !== 'todos' || filterPeriod !== 'todos') && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">activo</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block p-4 border-t md:border-t-0 border-border`}>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-2">
              <Filter className="hidden md:block w-4 h-4 text-muted-foreground shrink-0" />
              <span className="hidden md:block text-sm font-medium shrink-0">Filtros:</span>
            </div>
            <div className="grid grid-cols-2 md:flex md:items-center gap-3">
              <div className="md:flex md:items-center md:gap-2">
                <label className="block text-xs text-muted-foreground mb-1 md:mb-0 md:shrink-0">Período</label>
                <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className={selectCls}>
                  <option value="todos">Todos</option>
                  <option value="hoje">Hoje</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mês</option>
                </select>
              </div>
              <div className="md:flex md:items-center md:gap-2">
                <label className="block text-xs text-muted-foreground mb-1 md:mb-0 md:shrink-0">Tipo</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as MovementType | 'todos')} className={selectCls}>
                  <option value="todos">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                  <option value="ajuste">Ajustes</option>
                </select>
              </div>
            </div>
            {(filterType !== 'todos' || filterPeriod !== 'todos') && (
              <button
                onClick={() => { setFilterType('todos'); setFilterPeriod('todos'); }}
                className="text-xs text-primary hover:underline text-left md:ml-auto"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : movements.length === 0 ? (
          <div className="border-t border-border">
            <EmptyState icon={History} title="Nenhum movimento encontrado" description="Tente alterar os filtros." />
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden border-t border-border divide-y divide-border">
              {movements.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MovementTypeBadge type={m.type} />
                      <span className="text-sm font-medium">{m.productName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {m.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Qtd: <strong className="text-foreground">{m.quantity} {getUnitLabel(m.unit)}</strong></span>
                    <span>Responsável: <strong className="text-foreground">{m.responsible}</strong></span>
                    {m.destination && <span className="col-span-2">Destino: <strong className="text-foreground">{m.destination}</strong></span>}
                    <span>Stock: {m.previousStock} → <strong className="text-foreground">{m.newStock}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block border-t border-border overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {['Data/Hora','Produto','Tipo','Quantidade','Stk. Ant.','Stk. Novo','Responsável','Destino/Obra'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-sm">
                        <div>{m.date.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' })}</div>
                        <div className="text-xs text-muted-foreground">{m.date.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}</div>
                      </td>
                      <td className="px-5 py-3 text-sm">{m.productName}</td>
                      <td className="px-5 py-3 whitespace-nowrap"><MovementTypeBadge type={m.type} /></td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-medium">{m.quantity} {getUnitLabel(m.unit)}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-muted-foreground">{m.previousStock}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-medium">{m.newStock}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm">{m.responsible}</td>
                      <td className="px-5 py-3 text-sm">{m.destination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
