import { useState } from 'react';
import { Plus, Search, Package as PackageIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { StockBadge } from '../components/StockBadge';
import { EmptyState } from '../components/EmptyState';
import { getCategoryLabel, getUnitLabel } from '../data/mockData';
import { useProdutos, useCriarProduto } from '@/features/produtos/hooks/useProdutos';
import { useRole } from '@/features/auth/useRole';
import type { ProductCategory, Unit, StockStatus } from '../types';

type StatusFilter = 'todos' | StockStatus;

const statusFilters: { value: StatusFilter; label: string; cls: string }[] = [
  { value: 'todos',     label: 'Todos',      cls: 'bg-accent text-foreground hover:bg-accent/80' },
  { value: 'normal',    label: '✓ Normal',   cls: 'bg-success/10 text-success hover:bg-success/20 border-success/30' },
  { value: 'baixo',     label: '⚠ Baixo',    cls: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/30' },
  { value: 'sem-stock', label: '✕ Sem Stock', cls: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30' },
];

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchTerm,    setSearchTerm]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('todos');
  const [showAddModal,  setShowAddModal]  = useState(false);
  const { products, loading, reload } = useProdutos();
  const { isAdmin } = useRole();

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /* Contagem por estado para badges nos filtros */
  const counts = {
    normal:    products.filter(p => p.status === 'normal').length,
    baixo:     products.filter(p => p.status === 'baixo').length,
    'sem-stock': products.filter(p => p.status === 'sem-stock').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'A carregar…' : `${products.length} produto${products.length !== 1 ? 's' : ''} no armazém`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 active:scale-95 transition-all text-sm font-semibold shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">

        {/* Barra de pesquisa */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome ou código…"
              className="w-full pl-10 pr-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* Filtros por estado */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilters.map(f => {
              const count = f.value !== 'todos' ? counts[f.value as StockStatus] : products.length;
              const isActive = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? `${f.cls} border-current ring-2 ring-current/20`
                      : `${f.cls} border-transparent`
                  }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-current/20' : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">A carregar produtos…</div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="Nenhum produto encontrado"
            description={
              searchTerm || statusFilter !== 'todos'
                ? 'Tente alterar a pesquisa ou o filtro.'
                : 'Adicione o primeiro produto ao armazém.'
            }
          />
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-border">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/produtos/${p.id}`)}
                  className="p-4 flex items-center gap-3 active:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className={`rounded-xl p-2.5 shrink-0 ${
                    p.status === 'sem-stock' ? 'bg-destructive/10' :
                    p.status === 'baixo'     ? 'bg-warning/10'     : 'bg-accent'
                  }`}>
                    <PackageIcon className={`w-5 h-5 ${
                      p.status === 'sem-stock' ? 'text-destructive' :
                      p.status === 'baixo'     ? 'text-warning'     : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.code} · {getCategoryLabel(p.category)}
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-semibold">{p.currentStock} {getUnitLabel(p.unit)}</span>
                      <span className="text-muted-foreground"> · mín: {p.minStock}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StockBadge status={p.status} />
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {['Código', 'Produto', 'Categoria', 'Unidade', 'Stock Atual', 'Mínimo', 'Estado', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/produtos/${p.id}`)}
                      className="hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-mono font-medium text-muted-foreground">{p.code}</td>
                      <td className="px-5 py-4 text-sm font-medium">{p.name}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-muted-foreground">{getCategoryLabel(p.category)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-muted-foreground">{getUnitLabel(p.unit)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${
                          p.status === 'sem-stock' ? 'text-destructive' :
                          p.status === 'baixo'     ? 'text-warning'     : 'text-foreground'
                        }`}>
                          {p.currentStock}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-muted-foreground">{p.minStock}</td>
                      <td className="px-5 py-4 whitespace-nowrap"><StockBadge status={p.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showAddModal && isAdmin && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); reload(); }}
        />
      )}
    </div>
  );
}

/* ── Modal novo produto ──────────────────────────────────────────── */

function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { criar, loading } = useCriarProduto();
  const [formData, setFormData] = useState({
    name: '', code: '', category: 'outro' as ProductCategory, unit: 'unidade' as Unit,
    initialStock: '', minStock: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await criar({
      code:         formData.code || `PROD${Date.now()}`,
      name:         formData.name,
      category:     formData.category,
      unit:         formData.unit,
      currentStock: parseFloat(formData.initialStock) || 0,
      minStock:     parseFloat(formData.minStock) || 0,
      notes:        formData.notes || undefined,
    });
    if (result) {
      toast.success('Produto criado com sucesso!');
      onSuccess();
    } else {
      toast.error('Erro ao criar produto. O código já existe ou há um erro de ligação.');
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl sm:rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">Novo Produto</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Adicionar novo produto ao armazém</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Código <span className="text-muted-foreground font-normal text-xs">(único)</span>
              </label>
              <input type="text" value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={inputCls} placeholder="Ex: CIM001" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Produto</label>
              <input type="text" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={inputCls} placeholder="Ex: Cimento Portland 25kg" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className={inputCls}>
                {[['cimento','Cimento'],['areia-brita','Areia e Brita'],['tijolo-bloco','Tijolo e Bloco'],
                  ['tinta','Tinta'],['tubagem','Tubagem'],['ferragem','Ferragem'],
                  ['ferramenta','Ferramentas'],['madeira','Madeira'],['outro','Outro']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unidade</label>
              <select value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}
                className={inputCls}>
                {[['saco','Saco'],['unidade','Unidade'],['kg','Quilograma (kg)'],['litro','Litro'],
                  ['caixa','Caixa'],['metro','Metro linear'],['m2','Metro quadrado (m²)'],['m3','Metro cúbico (m³)']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Inicial</label>
              <input type="number" value={formData.initialStock}
                onChange={e => setFormData({ ...formData, initialStock: e.target.value })}
                className={inputCls} placeholder="0" min="0" step="0.01" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Stock Mínimo
                <span className="text-muted-foreground font-normal text-xs ml-1">(para alertas)</span>
              </label>
              <input type="number" value={formData.minStock}
                onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                className={inputCls} placeholder="0" min="0" step="0.01" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Observações <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className={`${inputCls} resize-none`} rows={2}
              placeholder="Localização no armazém, fornecedor habitual, etc." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? 'A guardar…' : 'Criar Produto'}
            </button>
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 py-3.5 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 active:scale-[0.98] transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
