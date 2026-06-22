import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { getUnitLabel } from '../data/mockData';
import type { Product } from '../types';

interface Props {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  excludeIds?: string[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ProductCombobox({ products, value, onChange, excludeIds = [], loading, disabled, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = products.find(p => p.id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const available = products.filter(p => !excludeIds.includes(p.id) || p.id === value);
  const filtered = query.trim() === ''
    ? available
    : available.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase())
      );

  const inputCls = 'w-full px-4 py-3.5 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => { setOpen(o => !o); setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); }}
        className={`${inputCls} flex items-center justify-between text-left disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {loading ? 'A carregar…' : selected ? `${selected.name} — ${selected.currentStock} ${getUnitLabel(selected.unit)}` : (placeholder ?? 'Selecione um produto')}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Pesquisar por nome ou código…"
                className="w-full pl-8 pr-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onChange(p.id); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.code} · {p.currentStock} {getUnitLabel(p.unit)}</p>
                  </div>
                  {p.id === value && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
