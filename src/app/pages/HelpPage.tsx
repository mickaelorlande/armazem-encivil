import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Smartphone,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Share,
  Plus,
  BookOpen,
  CircleHelp,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useRole } from '@/features/auth/useRole';

/* ─── Tipos ─────────────────────────────────────────── */
type Step = { text: string; note?: string };

type Guide = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  color: string;           // bg da bolinha do ícone
  iconColor: string;       // cor do ícone
  borderColor: string;     // borda esquerda do card
  steps: Step[];
  tip?: string;
};

/* ─── Conteúdo dos guias ─────────────────────────────── */
const guides: Guide[] = [
  {
    id: 'saida',
    icon: ArrowUpCircle,
    title: 'Registar uma Saída',
    subtitle: 'Enviar material para uma obra ou destino',
    color: 'bg-destructive/10',
    iconColor: 'text-destructive',
    borderColor: 'border-l-destructive',
    steps: [
      { text: 'No menu inferior toque em  +  (Movimento)' },
      { text: 'Selecione o tipo  Saída' },
      { text: 'Escolha o produto na lista suspensa' },
      { text: 'Introduza a quantidade a saír', note: 'O sistema alerta se o stock for insuficiente' },
      { text: 'Preencha o campo  Destino / Obra  (obrigatório)' },
      { text: 'Toque em  Guardar Movimento' },
    ],
    tip: 'O stock é atualizado imediatamente após guardar.',
  },
  {
    id: 'entrada',
    icon: ArrowDownCircle,
    title: 'Registar uma Entrada',
    subtitle: 'Receber material de um fornecedor',
    color: 'bg-success/10',
    iconColor: 'text-success',
    borderColor: 'border-l-success',
    steps: [
      { text: 'No menu inferior toque em  +  (Movimento)' },
      { text: 'Selecione o tipo  Entrada' },
      { text: 'Escolha o produto na lista suspensa' },
      { text: 'Introduza a quantidade recebida' },
      { text: 'Indique o fornecedor no campo  Fornecedor  (opcional)' },
      { text: 'Toque em  Guardar Movimento' },
    ],
    tip: 'Pode adicionar observações como número de fatura ou nota de entrega.',
  },
  {
    id: 'alertas',
    icon: AlertTriangle,
    title: 'Alertas de Stock',
    subtitle: 'Como interpretar os estados dos produtos',
    color: 'bg-warning/10',
    iconColor: 'text-warning',
    borderColor: 'border-l-warning',
    steps: [
      { text: 'Verde  —  Stock Normal', note: 'Quantidade acima do mínimo definido' },
      { text: 'Laranja  —  Stock Baixo', note: 'Quantidade abaixo do mínimo — encomendar brevemente' },
      { text: 'Vermelho  —  Sem Stock', note: 'Stock esgotado — encomendar com urgência' },
    ],
    tip: 'O Dashboard mostra um painel de alertas com todos os produtos em risco. Verifique-o diariamente.',
  },
  {
    id: 'iphone',
    icon: Smartphone,
    title: 'Instalar no iPhone',
    subtitle: 'Aceder como app nativa, sem App Store',
    color: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-l-primary',
    steps: [
      { text: 'Abra este sistema no  Safari  (não Chrome)', note: 'Apenas o Safari suporta instalação PWA no iPhone' },
      { text: 'Toque no botão  Partilhar  (ícone de caixa com seta)' },
      { text: 'Percorra a lista e selecione  Adicionar ao Ecrã Inicial' },
      { text: 'Confirme tocando em  Adicionar' },
    ],
    tip: 'Após instalar, a app abre sem barra de URL — idêntica a uma app nativa.',
  },
  {
    id: 'android',
    icon: Smartphone,
    title: 'Instalar no Android',
    subtitle: 'Aceder como app nativa, sem Play Store',
    color: 'bg-success/10',
    iconColor: 'text-success',
    borderColor: 'border-l-success',
    steps: [
      { text: 'Abra este sistema no  Chrome', note: 'Outros browsers Android também podem suportar, mas o Chrome é o mais fiável' },
      { text: 'Toque no menu  ⋮  (três pontos) no canto superior direito' },
      { text: 'Selecione  Instalar aplicação  ou  Adicionar ao ecrã principal' },
      { text: 'Confirme tocando em  Instalar' },
    ],
    tip: 'O Chrome também pode mostrar um banner automático "Instalar app" — basta tocar nele.',
  },
];

/* ─── Componente de card de guia ─────────────────────── */
function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(guide.id === 'saida');
  const Icon = guide.icon;

  return (
    <div className={`bg-card rounded-2xl border border-border border-l-4 ${guide.borderColor} shadow-sm overflow-hidden`}>
      {/* Cabeçalho — sempre visível */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-accent/30 active:bg-accent/50 transition-colors"
      >
        <div className={`${guide.color} p-3 rounded-xl shrink-0`}>
          <Icon className={`w-6 h-6 ${guide.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm md:text-base">{guide.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{guide.subtitle}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Corpo — expansível */}
      {open && (
        <div className="px-5 pb-5">
          <div className="pt-1 pb-4 space-y-3">
            {guide.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`${guide.color} ${guide.iconColor} w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-snug"
                     dangerouslySetInnerHTML={{ __html: step.text.replace(/ {2}(.+?) {2}/g, ' <strong class="text-foreground">$1</strong> ') }}
                  />
                  {step.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dica */}
          {guide.tip && (
            <div className={`${guide.color} rounded-xl p-3 flex items-start gap-2.5`}>
              <CheckCircle2 className={`w-4 h-4 ${guide.iconColor} shrink-0 mt-0.5`} />
              <p className="text-xs text-foreground leading-snug">{guide.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ───────────────────────────────── */
export function HelpPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();

  const firstName = user?.email?.split('@')[0]
    ?.split('.')[0]
    ?.replace(/\d+/g, '')
    ?? 'utilizador';

  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 shrink-0">
            <img
              src="/icone_oficial.png"
              alt="ENCIVIL"
              className="w-12 h-12 object-contain"
              draggable={false}
            />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">Bem-vindo, {displayName}</p>
            <h1 className="text-xl font-bold leading-tight">Centro de Ajuda</h1>
            <p className="text-white/70 text-xs mt-0.5">Tudo o que precisa para usar o sistema</p>
          </div>
        </div>
      </div>

      {/* ── Ações rápidas ─────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Ações rápidas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/novo-movimento')}
            className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center gap-2 hover:border-destructive/50 hover:bg-destructive/5 active:scale-95 transition-all shadow-sm"
          >
            <div className="bg-destructive/10 p-2.5 rounded-xl">
              <ArrowUpCircle className="w-6 h-6 text-destructive" />
            </div>
            <span className="text-xs font-semibold text-foreground">Registar Saída</span>
          </button>
          <button
            onClick={() => navigate('/novo-movimento')}
            className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center gap-2 hover:border-success/50 hover:bg-success/5 active:scale-95 transition-all shadow-sm"
          >
            <div className="bg-success/10 p-2.5 rounded-xl">
              <ArrowDownCircle className="w-6 h-6 text-success" />
            </div>
            <span className="text-xs font-semibold text-foreground">Registar Entrada</span>
          </button>
        </div>
      </div>

      {/* ── Guias ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Guias passo a passo
        </p>
        <div className="space-y-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>

      {/* ── Contacto / Suporte ────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <CircleHelp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Precisa de ajuda adicional?</p>
            <p className="text-xs text-muted-foreground">Contacte o administrador do sistema</p>
          </div>
        </div>
        <a
          href="mailto:mickael.encivil@hotmail.com"
          className="flex items-center justify-between w-full py-3 px-4 bg-accent rounded-xl hover:bg-accent/80 active:scale-[0.98] transition-all"
        >
          <span className="text-sm font-medium text-foreground">mickael.encivil@hotmail.com</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      {/* ── Documentação técnica (admin only) ─────────── */}
      {isAdmin && (
        <div className="pt-2">
          <button
            onClick={() => navigate('/documentacao')}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-dashed border-border hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Documentação técnica completa
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

    </div>
  );
}
