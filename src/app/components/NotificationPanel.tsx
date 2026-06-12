import { useNavigate } from 'react-router'
import { Bell, AlertTriangle, XCircle, Package, ChevronRight, X } from 'lucide-react'
import type { StockNotification } from '@/features/notificacoes/hooks/useNotifications'
import { getUnitLabel } from '@/app/data/mockData'

interface Props {
  notifications: StockNotification[]
  loading: boolean
  onClose: () => void
}

export function NotificationPanel({ notifications, loading, onClose }: Props) {
  const navigate = useNavigate()

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden enc-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-foreground" />
          <span className="font-semibold text-sm">Notificações</span>
          {notifications.length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
              {notifications.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Fechar notificações"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-72 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 flex flex-col items-center gap-2.5">
            <div className="w-11 h-11 bg-success/10 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Tudo em ordem</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sem alertas de stock pendentes</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { navigate(`/produtos/${n.productId}`); onClose() }}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-accent/50 active:bg-accent/80 text-left transition-colors"
              >
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  n.severity === 'sem-stock' ? 'bg-destructive/10' : 'bg-warning/10'
                }`}>
                  {n.severity === 'sem-stock'
                    ? <XCircle className="w-4 h-4 text-destructive" />
                    : <AlertTriangle className="w-4 h-4 text-warning" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{n.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className={n.severity === 'sem-stock' ? 'text-destructive font-medium' : 'text-warning font-medium'}>
                      {n.severity === 'sem-stock' ? 'Sem stock' : 'Stock baixo'}
                    </span>
                    {' · '}{n.currentStock} / {n.minStock} {getUnitLabel(n.unit)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border p-3">
          <button
            onClick={() => { navigate('/produtos'); onClose() }}
            className="w-full py-2 text-sm text-primary hover:text-primary/80 font-semibold transition-colors rounded-lg hover:bg-primary/5"
          >
            Ver todos os produtos →
          </button>
        </div>
      )}
    </div>
  )
}
