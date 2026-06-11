import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const NewMovementPage = lazy(() => import('./pages/NewMovementPage').then(m => ({ default: m.NewMovementPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const DocsPage = lazy(() => import('./pages/DocsPage').then(m => ({ default: m.DocsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        Component: MainLayout,
        children: [
          { index: true, element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
          { path: 'produtos', element: <Suspense fallback={<PageLoader />}><ProductsPage /></Suspense> },
          { path: 'produtos/:id', element: <Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense> },
          { path: 'novo-movimento', element: <Suspense fallback={<PageLoader />}><NewMovementPage /></Suspense> },
          { path: 'historico', element: <Suspense fallback={<PageLoader />}><HistoryPage /></Suspense> },
          { path: 'relatorios', element: <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense> },
          { path: 'configuracoes', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
          { path: 'ajuda', element: <Suspense fallback={<PageLoader />}><HelpPage /></Suspense> },
          { path: 'documentacao', element: <Suspense fallback={<PageLoader />}><DocsPage /></Suspense> },
          { path: '*', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
