import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Package as PackageIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StockBadge } from '../components/StockBadge';
import { MovementTypeBadge } from '../components/MovementTypeBadge';
import { getCategoryLabel, getUnitLabel } from '../data/mockData';
import { useProduto } from '@/features/produtos/hooks/useProdutos';
import { useMovimentos } from '@/features/movimentos/hooks/useMovimentos';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { product, loading: loadingProduct } = useProduto(id);
  /* Sem limit — carrega todos os movimentos do produto para totais correctos */
  const movFiltros = useMemo(() => ({ produtoId: id }), [id]);
  const { movements, loading: loadingMovements } = useMovimentos(movFiltros);

  const last7Days = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date:     date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        Entradas: 0,
        Saídas:   0,
      };
    });
    movements.forEach(m => {
      const dateStr = m.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      const day = days.find(d => d.date === dateStr);
      if (day) {
        if (m.type === 'entrada') day.Entradas += m.quantity;
        else if (m.type === 'saida') day.Saídas += m.quantity;
      }
    });
    return days;
  }, [movements]);

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold">Produto não encontrado</h2>
        <button onClick={() => navigate('/produtos')}
          className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl">
          Voltar para Produtos
        </button>
      </div>
    );
  }

  const totalEntries = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const totalExits   = movements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/produtos')}
          className="p-2 hover:bg-accent rounded-lg transition-colors mt-0.5 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold">{product.name}</h1>
            <StockBadge status={product.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {product.code} · {getCategoryLabel(product.category)}
          </p>
        </div>
      </div>

      {/* Botões de acção — pré-preenchidos com este produto */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate(`/novo-movimento?produto=${product.id}&tipo=entrada`)}
          className="flex items-center justify-center gap-2 py-3.5 bg-success text-success-foreground rounded-xl font-semibold text-sm hover:bg-success/90 active:scale-[0.98] transition-all shadow-sm"
        >
          <ArrowDownCircle className="w-5 h-5" />
          Registar Entrada
        </button>
        <button
          onClick={() => navigate(`/novo-movimento?produto=${product.id}&tipo=saida`)}
          className="flex items-center justify-center gap-2 py-3.5 bg-destructive text-destructive-foreground rounded-xl font-semibold text-sm hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-sm"
        >
          <ArrowUpCircle className="w-5 h-5" />
          Registar Saída
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stock Atual</p>
          <p className={`text-3xl font-bold ${
            product.status === 'sem-stock' ? 'text-destructive' :
            product.status === 'baixo'     ? 'text-warning'     : 'text-foreground'
          }`}>{product.currentStock}</p>
          <p className="text-xs text-muted-foreground mt-1">{getUnitLabel(product.unit)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stock Mínimo</p>
          <p className="text-3xl font-bold text-warning">{product.minStock}</p>
          <p className="text-xs text-muted-foreground mt-1">{getUnitLabel(product.unit)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Total Entrado</p>
          <p className="text-3xl font-bold text-success">{loadingMovements ? '…' : totalEntries}</p>
          <p className="text-xs text-muted-foreground mt-1">{getUnitLabel(product.unit)} (histórico)</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Total Saído</p>
          <p className="text-3xl font-bold text-destructive">{loadingMovements ? '…' : totalExits}</p>
          <p className="text-xs text-muted-foreground mt-1">{getUnitLabel(product.unit)} (histórico)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Gráfico 7 dias */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold">Movimentação — Últimos 7 Dias</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quantidade por dia</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: 12 }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="Entradas" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Saídas"   fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Informações do produto */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4">Informações</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
              <StockBadge status={product.status} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Categoria</p>
              <p className="text-sm font-medium">{getCategoryLabel(product.category)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Unidade</p>
              <p className="text-sm font-medium">{getUnitLabel(product.unit)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Criado em</p>
              <p className="text-sm font-medium">{product.createdAt.toLocaleDateString('pt-PT')}</p>
            </div>
            {product.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico completo */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Histórico Completo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loadingMovements ? 'A carregar…' : `${movements.length} movimento${movements.length !== 1 ? 's' : ''} registado${movements.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loadingMovements ? (
          <div className="p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center">
            <PackageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Ainda não existem movimentos para este produto</p>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-border">
              {movements.slice(0, 20).map(m => (
                <div key={m.id} className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <MovementTypeBadge type={m.type} />
                      <span className="text-sm font-bold">{m.quantity} {getUnitLabel(m.unit)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {m.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>Stock: <strong className="text-foreground">{m.newStock}</strong> {getUnitLabel(m.unit)}</span>
                    {m.responsible && <span>{m.responsible}</span>}
                    {m.destination && <span>→ {m.destination}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {['Data/Hora','Tipo','Quantidade','Stock Anterior','Novo Stock','Responsável','Destino'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-sm">
                        <div className="font-medium">{m.date.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' })}</div>
                        <div className="text-xs text-muted-foreground">{m.date.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap"><MovementTypeBadge type={m.type} /></td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-bold">{m.quantity} {getUnitLabel(m.unit)}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-muted-foreground">{m.previousStock}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold">{m.newStock}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-muted-foreground">{m.responsible}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{m.destination ?? '—'}</td>
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
