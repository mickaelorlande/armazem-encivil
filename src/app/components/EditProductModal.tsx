import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAtualizarProduto } from '@/features/produtos/hooks/useProdutos';
import type { Product, ProductCategory, Unit } from '../types';

interface Props {
  product:   Product;
  hasMovements: boolean;
  onClose:   () => void;
  onSuccess: (updated: Product) => void;
}

const CATEGORIES: [ProductCategory, string][] = [
  ['cimento',      'Cimento'],
  ['areia-brita',  'Areia e Brita'],
  ['tijolo-bloco', 'Tijolo e Bloco'],
  ['tinta',        'Tinta'],
  ['tubagem',      'Tubagem'],
  ['ferragem',     'Ferragem'],
  ['ferramenta',   'Ferramentas'],
  ['madeira',      'Madeira'],
  ['outro',        'Outro'],
];

const UNITS: [Unit, string][] = [
  ['saco',    'Saco'],
  ['unidade', 'Unidade'],
  ['kg',      'Quilograma (kg)'],
  ['litro',   'Litro'],
  ['caixa',   'Caixa'],
  ['metro',   'Metro linear'],
  ['m2',      'Metro quadrado (m²)'],
  ['m3',      'Metro cúbico (m³)'],
];

export function EditProductModal({ product, hasMovements, onClose, onSuccess }: Props) {
  const { atualizar, loading } = useAtualizarProduto();

  const [form, setForm] = useState({
    name:     product.name,
    category: product.category,
    unit:     product.unit,
    minStock: String(product.minStock),
    notes:    product.notes ?? '',
  });

  const unitChanged = form.unit !== product.unit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await atualizar(product.id, {
      name:     form.name,
      category: form.category as ProductCategory,
      unit:     form.unit as Unit,
      minStock: parseFloat(form.minStock) || 0,
      notes:    form.notes || undefined,
    });
    if (updated) {
      toast.success('Produto atualizado com sucesso!');
      onSuccess(updated);
    } else {
      toast.error('Erro ao atualizar. O código pode já estar em uso.');
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 enc-fade-in">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto enc-scale-in">

        <div className="p-5 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold">Editar Produto</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{product.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Stock atual — read only reminder */}
          <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary leading-relaxed">
              <strong>Stock atual: {product.currentStock}</strong> — Para alterar o stock,
              use <strong>Correção de Inventário</strong> em "Novo Movimento".
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Código <span className="text-muted-foreground font-normal text-xs">(gerado automaticamente, fixo)</span>
              </label>
              <input
                type="text"
                value={product.code}
                readOnly
                disabled
                className={`${inputCls} bg-muted text-muted-foreground cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Produto</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as ProductCategory })}
                className={inputCls}
              >
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unidade</label>
              <select
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value as Unit })}
                className={inputCls}
              >
                {UNITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {unitChanged && hasMovements && (
                <p className="text-xs text-warning mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Atenção: há movimentos com a unidade anterior
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Stock Mínimo <span className="text-muted-foreground font-normal text-xs">(para alertas)</span>
            </label>
            <input
              type="number"
              value={form.minStock}
              onChange={e => setForm({ ...form, minStock: e.target.value })}
              className={inputCls}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Observações <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Localização no armazém, fornecedor, etc."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? 'A guardar…' : 'Guardar Alterações'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
