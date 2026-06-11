import { useNavigate } from 'react-router';
import { AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-medium mb-2">404</h1>
        <h2 className="text-xl mb-4">Página Não Encontrada</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          A página que procura não existe ou foi removida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}
