import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Terminar sessão?')) {
      await signOut();
      navigate('/login');
    }
  };

  const displayName = user?.email?.split('@')[0] ?? 'Utilizador';

  return (
    <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3">

        {/* Mobile: hamburger + logo oficial */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={onMenuOpen}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/icone_oficial.png"
              alt="ENCIVIL"
              className="w-8 h-8 object-contain"
              draggable={false}
            />
            <span className="font-semibold text-sm text-foreground">ENCIVIL</span>
          </div>
        </div>

        {/* Desktop: data */}
        <div className="hidden md:block">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-PT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Ações direita */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors relative" aria-label="Notificações">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* User info (só desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <User className="w-5 h-5 text-foreground" />
            <div className="text-sm">
              <p className="font-medium capitalize">{displayName}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
            title="Terminar sessão"
            aria-label="Terminar sessão"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
