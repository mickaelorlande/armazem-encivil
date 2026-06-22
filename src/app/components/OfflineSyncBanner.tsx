import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineQueue } from '@/features/movimentos/hooks/useOfflineQueue';

export function OfflineSyncBanner() {
  const { pendingCount, syncing, flushNow } = useOfflineQueue();

  if (pendingCount === 0) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2.5 flex items-center justify-center gap-2.5 text-xs sm:text-sm">
      {syncing ? (
        <RefreshCw className="w-4 h-4 text-warning animate-spin shrink-0" />
      ) : (
        <WifiOff className="w-4 h-4 text-warning shrink-0" />
      )}
      <span className="text-foreground">
        {syncing
          ? 'A sincronizar movimentos pendentes…'
          : `${pendingCount} movimento${pendingCount !== 1 ? 's' : ''} guardado${pendingCount !== 1 ? 's' : ''} sem ligação — será${pendingCount !== 1 ? 'ão' : ''} enviado${pendingCount !== 1 ? 's' : ''} automaticamente.`}
      </span>
      {!syncing && (
        <button
          onClick={() => flushNow()}
          className="text-warning font-semibold hover:underline shrink-0"
        >
          Tentar agora
        </button>
      )}
    </div>
  );
}
