import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

interface ConfirmDialogProps {
  title:          string;
  description:    string;
  confirmLabel?:  string;
  variant?:       'danger' | 'warning';
  loading?:       boolean;
  onConfirm:      () => void;
  onCancel:       () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useLockBodyScroll(true);
  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 enc-fade-in">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl enc-scale-in">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDanger ? 'bg-destructive/10' : 'bg-warning/10'
          }`}>
            {isDanger
              ? <Trash2 className="w-6 h-6 text-destructive" />
              : <AlertTriangle className="w-6 h-6 text-warning" />
            }
          </div>
          <h3 className="text-base font-bold text-center mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 ${
              isDanger
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-warning text-warning-foreground hover:bg-warning/90'
            }`}
          >
            {loading ? 'A processar…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
