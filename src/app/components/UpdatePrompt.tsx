import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const CHECK_INTERVAL_MS = 30_000;

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const check = () => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => {});
      };

      setInterval(check, CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('focus', check);
    },
  });

  // Auto-atualizar 8 segundos depois de detetar nova versão.
  // O utilizador vê o banner brevemente e a app recarrega sozinha.
  useEffect(() => {
    if (!needRefresh) return;
    const t = setTimeout(() => updateServiceWorker(true), 8_000);
    return () => clearTimeout(t);
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    // Fica acima da bottom nav mobile (h-16 = 64px) + safe area
    <div className="fixed inset-x-0 z-[60] flex justify-center px-3 pointer-events-none"
         style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.5rem)' }}>
      <div className="pointer-events-auto w-full max-w-md bg-primary text-primary-foreground shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Nova versão — a atualizar…</p>
          <p className="text-xs opacity-80 mt-0.5">O app vai recarregar automaticamente.</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 bg-white/20 hover:bg-white/30 text-sm font-bold px-3 py-1.5 rounded-xl transition-colors"
        >
          Já
        </button>
      </div>
    </div>
  );
}
