import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import { PWAInstallHint } from "./app/components/PWAInstallHint.tsx";
import "./styles/index.css";

// O Service Worker (skipWaiting+clientsClaim) ativa-se sozinho assim que o
// browser o encontra — mas por omissão o browser só verifica por uma versão
// nova a cada ~24h. Sem isto, um telemóvel que já tenha aberto a app fica
// preso no bundle antigo durante esse tempo todo após cada deploy.
const UPDATE_CHECK_INTERVAL_MS = 60_000;

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => { /* sem rede, tenta na próxima */ });
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  // Quando o novo SW assume o controlo, os módulos já carregados em memória
  // continuam a ser os antigos — recarregar é o que de facto traz o bundle novo.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// After a new deploy, Vite lazy-chunks get new hashes and old URLs 404.
// We clear SW caches before reloading so the SW doesn't serve stale chunks again.
// sessionStorage guard prevents an infinite reload loop if the file genuinely doesn't exist.
window.addEventListener('vite:preloadError', async () => {
  const GUARD_KEY = 'chunk_reload_ts';
  const lastReload = Number(sessionStorage.getItem(GUARD_KEY) ?? '0');
  if (Date.now() - lastReload < 15_000) return; // already reloaded within 15s — stop looping
  sessionStorage.setItem(GUARD_KEY, String(Date.now()));

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch { /* best effort */ }

  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster richColors position="top-right" />
    <PWAInstallHint />
  </>
);
