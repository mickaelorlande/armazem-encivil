import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

// Verifica por uma nova versão a cada 60s e sempre que a app volta a primeiro
// plano — importante num PWA, que fica aberto/suspenso durante muito tempo e,
// por omissão, só verificaria a cada ~24h.
const UPDATE_CHECK_INTERVAL_MS = 60_000;

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const check = () => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => { /* sem rede — tenta na próxima */ });
      };

      setInterval(check, UPDATE_CHECK_INTERVAL_MS);

      // Ao reabrir/voltar o foco ao PWA, verifica logo (o setInterval não corre
      // enquanto a app está suspensa em segundo plano, sobretudo no iOS).
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('focus', check);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 flex justify-center pointer-events-none pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-md bg-card border border-border shadow-lg rounded-2xl p-4 flex items-center gap-3 enc-scale-in">
        <div className="bg-primary/10 rounded-xl p-2 shrink-0">
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Nova versão disponível</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atualize para ter as últimas melhorias e correções.
          </p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          Atualizar
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dispensar"
          className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
