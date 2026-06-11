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
  const movFiltros = useMemo(() => ({ produtoId: id, limit: 10 }), [id]);
  const { movements, loading: loadingMovements } = useMovimentos(movFiltros);

  const last7Days = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        entradas: 0,
        saidas: 0,
      };
    });
    movements.forEach((m) => {
      const dateStr = m.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      const day = days.find((d) => d.date === dateStr);
      if (day) {
        if (m.type === 'entrada') day.entradas += m.quantity;
        else if (m.type === 'saida') day.saidas += m.quantity;
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
        <button
          onClick={() => navigate('/produtos')}
          className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg"
        >
          Voltar para Produtos
        </button>
      </div>
    );
  }

  const totalEntries = movements.filter((m) => m.type === 'entrada').length;
  const totalExits   = movements.filter((m) => m.type === 'saida').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/produtos')}
          className="p-2 hover:bg-accent rounded-lg transition-colors mt-0.5 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Código: {product.code} · {getCategoryLabel(product.category)}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/novo-movimento')}
            className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Entrada
          </button>
          <button
            onClick={() => navigate('/novo-movimento')}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Saída
          </button>
        </div>
      </div>

      {/* Mobile: botões de acção */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/novo-movimento')}
          className="flex items-center justify-center gap-2 py-3 bg-success text-success-foreground rounded-xl text-sm font-medium"
        >
          <ArrowDownCircle className="w-4 h-4" />
          Registar Entrada
        </button>
        <button
          onClick={() => navigate('/novo-movimento')}
          className="flex items-center justify-center gap-2 py-3 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium"
        >
          <ArrowUpCircle className="w-4 h-4" />
          Registar Saída
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Stock Atual</p>
          <p className="text-2xl font-semibold mb-1">{product.currentStock}</p>
          <p className="text-xs text-muted-foreground">{getUnitLabel(product.unit)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Stock Mínimo</p>
          <p className="text-2xl font-semibold mb-1">{product.minStock}</p>
          <p className="text-xs text-muted-foreground">{getUnitLabel(product.unit)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Entradas</p>
          <p className="text-2xl font-semibold text-success mb-1">{loadingMovements ? '…' : totalEntries}</p>
          <p className="text-xs text-muted-foreground">movimentos</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Saídas</p>
          <p className="text-2xl font-semibold text-destructive mb-1">{loadingMovements ? '…' : totalExits}</p>
          <p className="text-xs text-muted-foreground">movimentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold">Movimentação dos Últimos 7 Dias</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="entradas" fill="#16a34a" name="Entradas" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saidas" fill="#dc2626" name="Saídas" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Informações</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estado</p>
              <StockBadge status={product.status} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Categoria</p>
              <p className="text-sm font-medium">{getCategoryLabel(product.category)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Unidade</p>
              <p className="text-sm font-medium">{getUnitLabel(product.unit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Data de Criação</p>
              <p className="text-sm font-medium">{product.createdAt.toLocaleDateString('pt-PT')}</p>
            </div>
            {product.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{product.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Histórico do Produto</h3>
        </div>
        {loadingMovements ? (
          <div className="p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center">
            <PackageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Ainda não existem movimentos para este produto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {['Data/Hora','Tipo','Quantidade','Stk. Anterior','Stk. Novo','Responsável','Destino'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <div>{m.date.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' })}</div>
                      <div className="text-xs text-muted-foreground">{m.date.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><MovementTypeBadge type={m.type} /></td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">{m.quantity} {getUnitLabel(m.unit)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-muted-foreground">{m.previousStock}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">{m.newStock}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">{m.responsible}</td>
                    <td className="px-5 py-4 text-sm">{m.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
