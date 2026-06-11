import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import { PWAInstallHint } from "./app/components/PWAInstallHint.tsx";
import "./styles/index.css";

// After a new deploy, Vite lazy-chunks get new hashes and old URLs 404.
// This fires before React Router even sees the error — reload fetches fresh index.html.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster richColors position="top-right" />
    <PWAInstallHint />
  </>
);
