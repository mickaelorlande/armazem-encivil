import { useEffect } from 'react';
import { createBrowserRouter, Navigate, useRouteError } from 'react-router';

function RouteErrorPage() {
  const error = useRouteError() as Error | undefined;
  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed');

  useEffect(() => {
    if (!isChunkError) return;
    const GUARD_KEY = 'chunk_reload_ts';
    const lastReload = Number(sessionStorage.getItem(GUARD_KEY) ?? '0');
    if (Date.now() - lastReload < 15_000) return;
    sessionStorage.setItem(GUARD_KEY, String(Date.now()));

    const clearAndReload = async () => {
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
    };
    void clearAndReload();
  }, [isChunkError]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        {isChunkError ? (
          <>
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">Nova versão disponível</h2>
            <p className="text-sm text-muted-foreground mb-6">
              O app foi atualizado. Recarregue para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Recarregar App
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">Algo correu mal</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.assign('/')}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Voltar ao Início
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { MainLayout } from './layouts/MainLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ToolsPage } from './pages/ToolsPage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { ToolFormPage } from './pages/ToolFormPage';
import { ToolLoanPage } from './pages/ToolLoanPage';
import { ToolReturnPage } from './pages/ToolReturnPage';
import { ObrasPage } from './pages/ObrasPage';
import { SubempreiteirosPage } from './pages/SubempreiteirosPage';
import { SubempreiteiroFormPage } from './pages/SubempreiteiroFormPage';
import { SubempreiteiroDetailPage } from './pages/SubempreiteiroDetailPage';
import { NewMovementPage } from './pages/NewMovementPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DocsPage } from './pages/DocsPage';
import { HelpPage } from './pages/HelpPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    element: <AuthGuard />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/',
        Component: MainLayout,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true,           element: <DashboardPage /> },
          { path: 'produtos',      element: <ProductsPage /> },
          { path: 'produtos/:id',  element: <ProductDetailPage /> },
          { path: 'ferramentas',             element: <ToolsPage /> },
          { path: 'ferramentas/nova',         element: <ToolFormPage /> },
          { path: 'ferramentas/emprestimo',   element: <ToolLoanPage /> },
          { path: 'ferramentas/:id',          element: <ToolDetailPage /> },
          { path: 'ferramentas/:id/editar',    element: <ToolFormPage /> },
          { path: 'ferramentas/:id/devolucao', element: <ToolReturnPage /> },
          { path: 'obras',                    element: <ObrasPage /> },
          { path: 'subempreiteiros',          element: <SubempreiteirosPage /> },
          { path: 'subempreiteiros/novo',     element: <SubempreiteiroFormPage /> },
          { path: 'subempreiteiros/:id',      element: <SubempreiteiroDetailPage /> },
          { path: 'subempreiteiros/:id/editar', element: <SubempreiteiroFormPage /> },
          { path: 'novo-movimento', element: <NewMovementPage /> },
          { path: 'historico',     element: <HistoryPage /> },
          { path: 'relatorios',    element: <ReportsPage /> },
          { path: 'configuracoes', element: <RoleGuard require="admin"><SettingsPage /></RoleGuard> },
          { path: 'ajuda',         element: <HelpPage /> },
          { path: 'documentacao',  element: <DocsPage /> },
          { path: '*',             element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
