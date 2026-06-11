import { useState } from 'react';
import { Plus, Search, Eye, Edit, Package as PackageIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { StockBadge } from '../components/StockBadge';
import { EmptyState } from '../components/EmptyState';
import { getCategoryLabel, getUnitLabel } from '../data/mockData';
import { useProdutos, useCriarProduto } from '@/features/produtos/hooks/useProdutos';
import { useRole } from '@/features/auth/useRole';
import type { ProductCategory, Unit } from '../types';

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { products, loading, reload } = useProdutos();
  const { isAdmin } = useRole();

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerir produtos do armazém</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 active:scale-95 transition-all text-sm font-medium shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome ou código..."
              className="w-full pl-10 pr-4 py-3 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">A carregar produtos…</div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="Nenhum produto encontrado"
            description={searchTerm ? 'Não existem produtos correspondentes à sua pesquisa.' : 'Adicione o primeiro produto ao armazém.'}
          />
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-border">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/produtos/${p.id}`)}
                  className="p-4 flex items-center gap-3 active:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="bg-accent rounded-lg p-2.5 shrink-0">
                    <PackageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.code} · {getCategoryLabel(p.category)}
                    </p>
                    <p className="text-xs mt-1 font-medium">
                      {p.currentStock} {getUnitLabel(p.unit)}
                      <span className="text-muted-foreground font-normal"> (mín: {p.minStock})</span>
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
                    {['Código', 'Produto', 'Categoria', 'Unidade', 'Stock Atual', 'Mínimo', 'Estado', 'Ações'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">{p.code}</td>
                      <td className="px-5 py-4 text-sm">{p.name}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">{getCategoryLabel(p.category)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">{getUnitLabel(p.unit)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">{p.currentStock}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-muted-foreground">{p.minStock}</td>
                      <td className="px-5 py-4 whitespace-nowrap"><StockBadge status={p.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/produtos/${p.id}`)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                              title="Editar"
                              onClick={() => setShowAddModal(true)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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

function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { criar, loading } = useCriarProduto();
  const [formData, setFormData] = useState({
    name: '', code: '', category: 'outro' as ProductCategory, unit: 'unidade' as Unit,
    initialStock: '', minStock: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await criar({
      code: formData.code || `PROD${Date.now()}`,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      currentStock: parseFloat(formData.initialStock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      notes: formData.notes || undefined,
    });
    if (result) {
      toast.success('Produto criado com sucesso!');
      onSuccess();
    } else {
      toast.error('Erro ao criar produto. Verifique o código — deve ser único.');
    }
  };

  const inputCls = "w-full px-4 py-3 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl">
          <h2 className="text-lg font-semibold">Novo Produto</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Adicionar novo produto ao armazém</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código <span className="text-muted-foreground font-normal">(único)</span></label>
              <input type="text" value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={inputCls} placeholder="Ex: CIM001" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Produto</label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls} placeholder="Ex: Cimento Portland 25kg" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
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
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as Unit })}
                className={inputCls}>
                {[['saco','Saco'],['unidade','Unidade'],['kg','kg'],['litro','Litro'],
                  ['caixa','Caixa'],['metro','Metro'],['m2','m²'],['m3','m³']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Inicial</label>
              <input type="number" value={formData.initialStock}
                onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                className={inputCls} placeholder="0" min="0" step="0.01" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stock Mínimo</label>
              <input type="number" value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className={inputCls} placeholder="0" min="0" step="0.01" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observações <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={inputCls} rows={3} placeholder="Informações adicionais..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60">
              {loading ? 'A guardar…' : 'Guardar Produto'}
            </button>
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 active:scale-95 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
