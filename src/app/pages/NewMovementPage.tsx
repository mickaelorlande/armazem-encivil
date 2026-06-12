import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowDownCircle, ArrowUpCircle, AlertTriangle,
  ChevronLeft, ClipboardEdit, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUnitLabel } from '../data/mockData';
import type { MovementType } from '../types';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import { useRegistarMovimento } from '@/features/movimentos/hooks/useMovimentos';
import { useRole } from '@/features/auth/useRole';

export function NewMovementPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { nome }   = useRole();
  const { products, loading: productsLoading } = useProdutos();
  const { registar, loading: saving } = useRegistarMovimento();

  /* Pré-preenchimento via URL params  (/novo-movimento?produto=ID&tipo=saida) */
  const params     = new URLSearchParams(location.search);
  const paramProd  = params.get('produto') ?? '';
  const rawTipo    = params.get('tipo') ?? 'saida';
  const validTypes: MovementType[] = ['entrada', 'saida', 'ajuste'];
  const paramTipo  = validTypes.includes(rawTipo as MovementType)
    ? rawTipo as MovementType
    : 'saida';

  const [showAjuste, setShowAjuste] = useState(paramTipo === 'ajuste');
  const [formData, setFormData] = useState({
    type:        paramTipo,
    productId:   paramProd,
    quantity:    '',
    responsible: nome,
    destination: '',
    notes:       '',
  });

  // Sync responsible field once the profile is loaded (nome may arrive after first render)
  useEffect(() => {
    if (nome) setFormData(prev => ({ ...prev, responsible: prev.responsible || nome }));
  }, [nome]);

  const set = (patch: Partial<typeof formData>) =>
    setFormData(prev => ({ ...prev, ...patch }));

  const selectedProduct = products.find(p => p.id === formData.productId);

  const insufficientStock =
    formData.type === 'saida' &&
    selectedProduct &&
    parseFloat(formData.quantity || '0') > selectedProduct.currentStock;

  /* Ajuste: preview em tempo real */
  const ajusteNew   = formData.type === 'ajuste' && formData.quantity !== ''
    ? parseFloat(formData.quantity)
    : null;
  const ajusteDelta = ajusteNew !== null && selectedProduct
    ? ajusteNew - selectedProduct.currentStock
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) { toast.error('Selecione um produto.'); return; }
    if (insufficientStock) {
      toast.error(`Stock insuficiente! Disponível: ${selectedProduct!.currentStock} ${getUnitLabel(selectedProduct!.unit)}`);
      return;
    }
    if (formData.type === 'ajuste' && !formData.notes.trim()) {
      toast.error('Indique o motivo da correção de inventário.');
      return;
    }

    const ok = await registar({
      produtoId:    formData.productId,
      tipo:         formData.type as MovementType,
      quantidade:   parseFloat(formData.quantity),
      responsavel:  formData.responsible,
      destinoObra:  formData.type !== 'ajuste' ? (formData.destination || undefined) : undefined,
      observacoes:  formData.notes || undefined,
    });

    if (ok) {
      toast.success('Movimento registado com sucesso!');
      setTimeout(() => navigate(-1), 1000);
    } else {
      toast.error('Erro ao registar. Verifique o stock disponível.');
    }
  };

  const inputCls = 'w-full px-4 py-3.5 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

  /* Cor do botão de submissão */
  const submitCls =
    formData.type === 'saida'   ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
    formData.type === 'entrada' ? 'bg-success text-success-foreground hover:bg-success/90' :
                                  'bg-warning text-white hover:bg-warning/90';

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Novo Movimento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registar entrada ou saída de material</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Seletor de tipo ─────────────────────── */}
        {!showAjuste ? (
          <div>
            <p className="text-sm font-semibold mb-3 px-0.5">O que vai registar?</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Saída */}
              <button
                type="button"
                onClick={() => set({ type: 'saida' })}
                className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all active:scale-95 ${
                  formData.type === 'saida'
                    ? 'border-destructive bg-destructive/8'
                    : 'border-border hover:border-destructive/40 hover:bg-destructive/5'
                }`}
              >
                <div className={`p-3 rounded-2xl ${formData.type === 'saida' ? 'bg-destructive/15' : 'bg-muted'}`}>
                  <ArrowUpCircle className={`w-7 h-7 ${formData.type === 'saida' ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-center">
                  <p className={`font-bold text-base ${formData.type === 'saida' ? 'text-destructive' : 'text-foreground'}`}>
                    Saída
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">Material para obra<br/>ou destino</p>
                </div>
              </button>

              {/* Entrada */}
              <button
                type="button"
                onClick={() => set({ type: 'entrada' })}
                className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all active:scale-95 ${
                  formData.type === 'entrada'
                    ? 'border-success bg-success/8'
                    : 'border-border hover:border-success/40 hover:bg-success/5'
                }`}
              >
                <div className={`p-3 rounded-2xl ${formData.type === 'entrada' ? 'bg-success/15' : 'bg-muted'}`}>
                  <ArrowDownCircle className={`w-7 h-7 ${formData.type === 'entrada' ? 'text-success' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-center">
                  <p className={`font-bold text-base ${formData.type === 'entrada' ? 'text-success' : 'text-foreground'}`}>
                    Entrada
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">Receção de material<br/>de fornecedor</p>
                </div>
              </button>
            </div>

            {/* Link discreto para correção de inventário */}
            <button
              type="button"
              onClick={() => { setShowAjuste(true); set({ type: 'ajuste', destination: '' }); }}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2.5 rounded-xl hover:bg-accent transition-colors border border-dashed border-border"
            >
              <ClipboardEdit className="w-3.5 h-3.5" />
              Fazer uma correção de inventário
            </button>
          </div>
        ) : (
          /* ── Modo Ajuste / Correção ─────────────── */
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setShowAjuste(false); set({ type: 'saida' }); }}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold">Correção de Inventário</p>
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">O stock é definido directamente</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Use apenas após contar fisicamente o armazém. O valor que introduzir
                  <strong> substitui</strong> o stock actual — não é somado nem subtraído.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Produto + Quantidade ────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">

          {/* Seletor de produto */}
          <div>
            <label className="block text-sm font-medium mb-2">Produto</label>
            <select
              value={formData.productId}
              onChange={e => set({ productId: e.target.value })}
              className={inputCls}
              required
              disabled={productsLoading}
            >
              <option value="">{productsLoading ? 'A carregar…' : 'Selecione um produto'}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.currentStock} {getUnitLabel(p.unit)}
                </option>
              ))}
            </select>
          </div>

          {/* Info do produto selecionado */}
          {selectedProduct && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-accent/50 rounded-xl text-center">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Stock Atual</p>
                <p className={`text-xl font-bold mt-0.5 ${
                  selectedProduct.status === 'sem-stock' ? 'text-destructive' :
                  selectedProduct.status === 'baixo'     ? 'text-warning'     : 'text-foreground'
                }`}>
                  {selectedProduct.currentStock}
                </p>
                <p className="text-[10px] text-muted-foreground">{getUnitLabel(selectedProduct.unit)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mínimo</p>
                <p className="text-xl font-bold mt-0.5 text-warning">{selectedProduct.minStock}</p>
                <p className="text-[10px] text-muted-foreground">{getUnitLabel(selectedProduct.unit)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Unidade</p>
                <p className="text-lg font-bold mt-1">{getUnitLabel(selectedProduct.unit)}</p>
              </div>
            </div>
          )}

          {/* Quantidade / Novo Stock */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-sm font-medium">
                {formData.type === 'ajuste' ? 'Novo Stock Real' : 'Quantidade'}
              </label>
              {formData.type === 'ajuste' && selectedProduct && (
                <span className="text-xs text-muted-foreground">
                  Actual: <strong>{selectedProduct.currentStock} {getUnitLabel(selectedProduct.unit)}</strong>
                </span>
              )}
            </div>

            <input
              type="number"
              value={formData.quantity}
              onChange={e => set({ quantity: e.target.value })}
              className={`${inputCls} text-2xl font-bold text-center`}
              placeholder="0"
              min="0"
              step="0.01"
              required
              inputMode="decimal"
            />

            {/* Preview ao vivo do ajuste */}
            {formData.type === 'ajuste' && ajusteNew !== null && selectedProduct && (
              <div className={`mt-2 p-3 rounded-xl border flex items-center justify-center gap-2.5 ${
                ajusteDelta === 0
                  ? 'bg-muted/30 border-border'
                  : ajusteDelta! > 0
                  ? 'bg-success/10 border-success/20'
                  : 'bg-destructive/10 border-destructive/20'
              }`}>
                <span className="text-base font-semibold text-muted-foreground">
                  {selectedProduct.currentStock}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className={`text-base font-bold ${
                  ajusteDelta === 0 ? 'text-foreground' :
                  ajusteDelta! > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {ajusteNew}
                </span>
                <span className="text-xs text-muted-foreground">{getUnitLabel(selectedProduct.unit)}</span>
                {ajusteDelta !== 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    ajusteDelta! > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {ajusteDelta! > 0 ? '+' : ''}{ajusteDelta}
                  </span>
                )}
              </div>
            )}

            {/* Aviso stock insuficiente */}
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

        {/* ── Campos adicionais ───────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Responsável</label>
            <input
              type="text"
              value={formData.responsible}
              onChange={e => set({ responsible: e.target.value })}
              className={inputCls}
              required
            />
          </div>

          {/* Destino/Fornecedor — oculto no ajuste */}
          {formData.type !== 'ajuste' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.type === 'entrada' ? 'Fornecedor' : 'Destino / Obra'}
                {formData.type === 'saida' && <span className="text-destructive ml-1">*</span>}
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={e => set({ destination: e.target.value })}
                className={inputCls}
                placeholder={formData.type === 'entrada' ? 'Nome do fornecedor (opcional)' : 'Destino ou nome da obra'}
                required={formData.type === 'saida'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              {formData.type === 'ajuste' ? (
                <>Motivo da Correção <span className="text-destructive">*</span></>
              ) : (
                <>Observações <span className="text-muted-foreground font-normal">(opcional)</span></>
              )}
            </label>
            <textarea
              value={formData.notes}
              onChange={e => set({ notes: e.target.value })}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder={
                formData.type === 'ajuste'
                  ? 'Ex: Contagem física realizada. Diferença detectada por quebra/perda.'
                  : 'Notas adicionais sobre este movimento…'
              }
              required={formData.type === 'ajuste'}
            />
          </div>
        </div>

        {/* ── Botões de ação ──────────────────────── */}
        <div className="sticky bottom-20 md:bottom-0 py-3 bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!!insufficientStock || saving}
              className={`flex-1 py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${submitCls}`}
            >
              {saving
                ? 'A guardar…'
                : formData.type === 'ajuste'
                ? 'Confirmar Correção'
                : `Guardar ${formData.type === 'entrada' ? 'Entrada' : 'Saída'}`}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="px-5 py-4 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
