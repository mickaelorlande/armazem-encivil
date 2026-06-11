import { useState, useMemo } from 'react';
import { BarChart3, Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getCategoryLabel } from '../data/mockData';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import { useMovimentos } from '@/features/movimentos/hooks/useMovimentos';
import type { FiltrosMovimentos } from '@/features/movimentos/services/movimentosService';

export function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState<string>('mes');

  const filtros = useMemo((): FiltrosMovimentos => {
    if (reportPeriod === 'hoje') {
      const d = new Date(); d.setHours(0, 0, 0, 0)
      return { dataInicio: d }
    }
    if (reportPeriod === 'semana') {
      const d = new Date(); d.setDate(d.getDate() - 7)
      return { dataInicio: d }
    }
    if (reportPeriod === 'mes') {
      const d = new Date(); d.setMonth(d.getMonth() - 1)
      return { dataInicio: d }
    }
    if (reportPeriod === 'ano') {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1)
      return { dataInicio: d }
    }
    return {}
  }, [reportPeriod])

  const { products, loading: loadingProducts } = useProdutos(false);
  const { movements, loading: loadingMovements } = useMovimentos(filtros);

  const loading = loadingProducts || loadingMovements;

  const categoryData = useMemo(() =>
    products.reduce((acc, p) => {
      const cat = getCategoryLabel(p.category);
      const existing = acc.find((i) => i.name === cat);
      if (existing) existing.value += 1;
      else acc.push({ name: cat, value: 1 });
      return acc;
    }, [] as Array<{ name: string; value: number }>),
  [products])

  const movementsByProduct = useMemo(() =>
    movements
      .filter((m) => m.type === 'saida')
      .reduce((acc, m) => {
        const existing = acc.find((i) => i.name === m.productName);
        if (existing) existing.quantidade += m.quantity;
        else acc.push({ name: m.productName, quantidade: m.quantity });
        return acc;
      }, [] as Array<{ name: string; quantidade: number }>)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5),
  [movements])

  const totalEntries = movements.filter((m) => m.type === 'entrada').length;
  const totalExits   = movements.filter((m) => m.type === 'saida').length;

  const COLORS = ['#1e3a8a', '#16a34a', '#dc2626', '#f59e0b', '#64748b'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise e estatísticas do armazém</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
          </select>
          <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Movimentos</p>
              <p className="text-3xl font-semibold">{loading ? '…' : movements.length}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg"><BarChart3 className="w-5 h-5 text-primary" /></div>
          </div>
          <p className="text-xs text-muted-foreground">Registos no período selecionado</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Entradas</p>
              <p className="text-3xl font-semibold text-success">{loading ? '…' : totalEntries}</p>
            </div>
            <div className="p-2.5 bg-success/10 rounded-lg"><TrendingDown className="w-5 h-5 text-success" /></div>
          </div>
          <p className="text-xs text-muted-foreground">Movimentos de entrada</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Saídas</p>
              <p className="text-3xl font-semibold text-destructive">{loading ? '…' : totalExits}</p>
            </div>
            <div className="p-2.5 bg-destructive/10 rounded-lg"><TrendingUp className="w-5 h-5 text-destructive" /></div>
          </div>
          <p className="text-xs text-muted-foreground">Movimentos de saída</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-5">Produtos Mais Consumidos</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">A carregar…</div>
          ) : movementsByProduct.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">Sem dados no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={movementsByProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="quantidade" fill="#1e3a8a" radius={[8, 8, 0, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-5">Distribuição por Categoria</h3>
          {loadingProducts || categoryData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              {loadingProducts ? 'A carregar…' : 'Sem produtos cadastrados'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Resumo do Período</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-destructive" />
                Produtos Mais Consumidos
              </h4>
              {movementsByProduct.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem saídas no período</p>
              ) : (
                <div className="space-y-3">
                  {movementsByProduct.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.quantidade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Estatísticas Gerais
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-accent rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Produtos cadastrados</span>
                  <span className="text-sm font-semibold">{loadingProducts ? '…' : products.length}</span>
                </div>
                <div className="p-3 bg-accent rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock baixo</span>
                  <span className="text-sm font-semibold text-warning">
                    {loadingProducts ? '…' : products.filter((p) => p.status === 'baixo').length}
                  </span>
                </div>
                <div className="p-3 bg-accent rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sem stock</span>
                  <span className="text-sm font-semibold text-destructive">
                    {loadingProducts ? '…' : products.filter((p) => p.status === 'sem-stock').length}
                  </span>
                </div>
                <div className="p-3 bg-accent rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de saídas</span>
                  <span className="text-sm font-semibold">
                    {loadingMovements || movements.length === 0 ? '—' : `${((totalExits / movements.length) * 100).toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
