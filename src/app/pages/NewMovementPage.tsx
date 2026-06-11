import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowDownCircle, ArrowUpCircle, Edit3, AlertTriangle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getUnitLabel } from '../data/mockData';
import type { MovementType } from '../types';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import { useRegistarMovimento } from '@/features/movimentos/hooks/useMovimentos';
import { useAuth } from '@/features/auth/AuthContext';

export function NewMovementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProdutos();
  const { registar, loading: saving } = useRegistarMovimento();

  const [formData, setFormData] = useState({
    type: 'saida' as MovementType,
    productId: '',
    quantity: '',
    responsible: user?.email?.split('@')[0] ?? '',
    destination: '',
    notes: '',
  });

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const insufficientStock =
    formData.type === 'saida' &&
    selectedProduct &&
    parseFloat(formData.quantity || '0') > selectedProduct.currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (insufficientStock) {
      toast.error(`Stock insuficiente! Disponível: ${selectedProduct.currentStock} ${getUnitLabel(selectedProduct.unit)}`);
      return;
    }
    if (!formData.productId) {
      toast.error('Selecione um produto.');
      return;
    }

    const ok = await registar({
      produtoId: formData.productId,
      tipo: formData.type,
      quantidade: parseFloat(formData.quantity),
      responsavel: formData.responsible,
      destinoObra: formData.destination || undefined,
      observacoes: formData.notes || undefined,
    });

    if (ok) {
      toast.success('Movimento registado com sucesso!');
      setFormData({ ...formData, productId: '', quantity: '', destination: '', notes: '' });
      setTimeout(() => navigate('/'), 1200);
    } else {
      toast.error('Erro ao registar movimento. Verifique o stock disponível.');
    }
  };

  const movTypes = [
    { type: 'entrada' as MovementType, label: 'Entrada',  icon: ArrowDownCircle, color: 'success' },
    { type: 'saida'   as MovementType, label: 'Saída',    icon: ArrowUpCircle,   color: 'destructive' },
    { type: 'ajuste'  as MovementType, label: 'Ajuste',   icon: Edit3,           color: 'primary' },
  ] as const;

  const inputCls = "w-full px-4 py-3.5 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base";

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Novo Movimento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registar entrada, saída ou ajuste de stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Tipo de Movimento */}
        <div className="bg-card rounded-xl border border-border p-4">
          <label className="block text-sm font-medium mb-3">Tipo de Movimento</label>
          <div className="grid grid-cols-3 gap-2">
            {movTypes.map(({ type, label, icon: Icon, color }) => {
              const isActive = formData.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`
                    py-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all active:scale-95
                    ${isActive
                      ? `border-${color} bg-${color}/10 text-${color}`
                      : `border-border hover:border-${color}/40 text-muted-foreground`}
                  `}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Produto + Quantidade */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Produto</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className={inputCls}
              required
              disabled={productsLoading}
            >
              <option value="">{productsLoading ? 'A carregar…' : 'Selecione um produto'}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} (Stock: {p.currentStock} {getUnitLabel(p.unit)})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-accent rounded-xl text-center">
              <div>
                <p className="text-xs text-muted-foreground">Stock Atual</p>
                <p className="text-lg font-bold text-foreground">{selectedProduct.currentStock}</p>
                <p className="text-xs text-muted-foreground">{getUnitLabel(selectedProduct.unit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mínimo</p>
                <p className="text-lg font-semibold text-warning">{selectedProduct.minStock}</p>
                <p className="text-xs text-muted-foreground">{getUnitLabel(selectedProduct.unit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unidade</p>
                <p className="text-base font-semibold">{getUnitLabel(selectedProduct.unit)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Quantidade</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={`${inputCls} text-2xl font-bold text-center`}
              placeholder="0"
              min="0.01"
              step="0.01"
              required
              inputMode="decimal"
            />
            {insufficientStock && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  Stock insuficiente! Disponível: {selectedProduct?.currentStock} {selectedProduct && getUnitLabel(selectedProduct.unit)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Campos adicionais */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Responsável</label>
            <input
              type="text"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {formData.type === 'entrada' ? 'Fornecedor' : 'Destino / Obra'}
              {formData.type === 'saida' && <span className="text-destructive ml-1">*</span>}
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className={inputCls}
              placeholder={formData.type === 'entrada' ? 'Nome do fornecedor' : 'Destino ou nome da obra'}
              required={formData.type === 'saida'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observações <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Informações adicionais sobre o movimento..."
            />
          </div>
        </div>

        {/* Botão sticky */}
        <div className="sticky bottom-20 md:bottom-0 py-3 bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!!insufficientStock || saving}
              className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? 'A guardar…' : 'Guardar Movimento'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="px-5 py-4 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
