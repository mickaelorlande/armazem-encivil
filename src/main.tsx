import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import { PWAInstallHint } from "./app/components/PWAInstallHint.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster richColors position="top-right" />
    <PWAInstallHint />
  </>
);
