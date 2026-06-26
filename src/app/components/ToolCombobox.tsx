import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { getToolCategoryLabel } from '../data/mockData';
import type { Tool } from '../types';

interface Props {
  tools: Tool[];
  value: string;
  onChange: (toolId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ToolCombobox({ tools, value, onChange, loading, disabled, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = tools.find(t => t.id === value);

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

  // Posiciona o painel com `fixed`, ancorado ao botão via getBoundingClientRect.
  // Necessário porque o combobox vive dentro do contentor `overflow-y-auto` do
  // modal — com `absolute` o painel seria cortado em vez de flutuar por cima.
  useLayoutEffect(() => {
    if (!open) { setPanelStyle(null); return; }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(320, Math.max(120, (openUpward ? spaceAbove : spaceBelow) - 12));

      setPanelStyle({
        left: rect.left,
        width: rect.width,
        top: openUpward ? rect.top - maxHeight - 6 : rect.bottom + 6,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const disponiveis = tools.filter(t => t.status === 'disponivel' || t.id === value);
  const filtered = query.trim() === ''
    ? disponiveis
    : disponiveis.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.code.toLowerCase().includes(query.toLowerCase())
      );

  const inputCls = 'w-full px-4 py-3.5 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => { setOpen(o => !o); setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); }}
        className={`${inputCls} flex items-center justify-between text-left disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {loading ? 'A carregar…' : selected ? `${selected.code} — ${selected.name}` : (placeholder ?? 'Selecione uma ferramenta')}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && panelStyle && (
        <div
          className="fixed z-[60] bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col"
          style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width, maxHeight: panelStyle.maxHeight }}
        >
          <div className="p-2 border-b border-border shrink-0">
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
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma ferramenta disponível encontrada.</p>
            ) : (
              filtered.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onChange(t.id); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.code} · {getToolCategoryLabel(t.category)}</p>
                  </div>
                  {t.id === value && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
