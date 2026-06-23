import { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Wrench, Pencil, MoreVertical, Archive, FileText, Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ToolStatusBadge } from '../components/ToolStatusBadge';
import { ToolFormModal, LoanToolModal, ReturnToolModal } from '../components/ToolModals';
import { ToolLoanTermPrint } from '../components/ToolLoanTermPrint';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getToolCategoryLabel } from '../data/mockData';
import { useFerramenta, useArquivarFerramenta } from '@/features/ferramentas/hooks/useFerramentas';
import { useEmprestimos } from '@/features/ferramentas/hooks/useEmprestimos';
import { useConfiguracoes } from '@/features/configuracoes/hooks/useConfiguracoes';
import { useRole } from '@/features/auth/useRole';
import type { ToolLoan } from '../types';

type Modal = 'edit' | 'loan' | 'return' | 'archive' | null;

export function ToolDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isAdmin, isGestor } = useRole();
  const canOperate  = isAdmin || isGestor;

  const { tool, loading: loadingTool, reload } = useFerramenta(id);
  const loanFiltros = useMemo(() => ({ ferramentaId: id, limit: 30 }), [id]);
  const { loans, loading: loadingLoans, reload: reloadLoans } = useEmprestimos(loanFiltros);
  const { config } = useConfiguracoes();

  const { arquivar, loading: archiving } = useArquivarFerramenta();

  const [modal, setModal] = useState<Modal>(null);
  const [termLoan, setTermLoan] = useState<ToolLoan | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const activeLoan = loans.find(l => l.status === 'ativo');

  const reloadAll = () => { reload(); reloadLoans(); };

  const handleArchive = async () => {
    if (!id) return;
    const ok = await arquivar(id);
    if (ok) {
      toast.success(`"${tool?.name}" arquivada com sucesso.`);
      navigate('/ferramentas');
    } else {
      toast.error('Erro ao arquivar ferramenta.');
    }
    setModal(null);
  };

  if (loadingTool) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold">Ferramenta não encontrada</h2>
        <button onClick={() => navigate('/ferramentas')} className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/ferramentas')} className="p-2 hover:bg-accent rounded-lg transition-colors mt-0.5 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold">{tool.name}</h1>
            <ToolStatusBadge status={tool.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{tool.code} · {getToolCategoryLabel(tool.category)}</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setModal('edit')} className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors text-sm font-semibold">
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(v => !v)} className="p-2 hover:bg-accent rounded-xl transition-colors" aria-label="Mais ações">
                <MoreVertical className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden enc-slide-down">
                  <button
                    onClick={() => { setMenuOpen(false); setModal('archive'); }}
                    disabled={tool.status === 'emprestada'}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors text-warning font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Archive className="w-4 h-4" />
                    Arquivar ferramenta
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botões de acção */}
      {canOperate && (
        <div className="grid grid-cols-1 gap-3">
          {tool.status === 'disponivel' && (
            <button
              onClick={() => setModal('loan')}
              className="flex items-center justify-center gap-2 py-3.5 bg-warning text-white rounded-xl font-semibold text-sm hover:bg-warning/90 active:scale-[0.98] transition-all shadow-sm"
            >
              <Wrench className="w-5 h-5" />
              Registar Empréstimo
            </button>
          )}
          {tool.status === 'emprestada' && activeLoan && (
            <button
              onClick={() => setModal('return')}
              className="flex items-center justify-center gap-2 py-3.5 bg-success text-success-foreground rounded-xl font-semibold text-sm hover:bg-success/90 active:scale-[0.98] transition-all shadow-sm"
            >
              <Undo2 className="w-5 h-5" />
              Registar Devolução
            </button>
          )}
        </div>
      )}

      {/* Empréstimo ativo */}
      {activeLoan && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold">Atualmente com {activeLoan.employeeName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Desde {activeLoan.loanDate.toLocaleDateString('pt-PT')}
              {activeLoan.expectedReturnDate && <> · devolução prevista {activeLoan.expectedReturnDate.toLocaleDateString('pt-PT')}</>}
              {activeLoan.destination && <> · {activeLoan.destination}</>}
            </p>
          </div>
          <button onClick={() => setTermLoan(activeLoan)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0">
            <FileText className="w-3.5 h-3.5" /> Ver Termo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info da ferramenta */}
        <div className="bg-card rounded-2xl border border-border p-5 lg:col-span-1">
          <h3 className="font-semibold mb-4">Informações</h3>
          <div className="space-y-4">
            {[
              { label: 'Estado',          value: <ToolStatusBadge status={tool.status} /> },
              { label: 'Categoria',       value: getToolCategoryLabel(tool.category) },
              { label: 'Nº de Série',     value: tool.serialNumber || '—' },
              { label: 'Valor Estimado',  value: tool.estimatedValue ? `${tool.estimatedValue.toFixed(2)} €` : '—' },
              { label: 'Criada em',       value: tool.createdAt.toLocaleDateString('pt-PT') },
            ].map(row => (
              <div key={row.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{row.label}</p>
                <div className="text-sm font-medium">{row.value}</div>
              </div>
            ))}
            {tool.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de empréstimos */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold">Histórico de Empréstimos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loadingLoans ? 'A carregar…' : `${loans.length} empréstimo${loans.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {loadingLoans ? (
            <div className="p-8 text-center text-sm text-muted-foreground">A carregar…</div>
          ) : loans.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Ainda não existem empréstimos para esta ferramenta</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {loans.map(l => (
                <div key={l.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">{l.employeeName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {l.loanDate.toLocaleDateString('pt-PT')}
                      {l.returnDate ? <> → {l.returnDate.toLocaleDateString('pt-PT')}</> : ' · em curso'}
                      {l.destination && <> · {l.destination}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      l.status === 'devolvido' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {l.status === 'devolvido' ? 'Devolvido' : 'Em curso'}
                    </span>
                    <button onClick={() => setTermLoan(l)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      <FileText className="w-3.5 h-3.5" /> Termo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {modal === 'edit' && (
        <ToolFormModal tool={tool} onClose={() => setModal(null)} onSuccess={() => { setModal(null); reload(); }} />
      )}
      {modal === 'loan' && (
        <LoanToolModal tools={[tool]} tool={tool} onClose={() => setModal(null)} onSuccess={loan => { setModal(null); reloadAll(); setTermLoan(loan); }} />
      )}
      {modal === 'return' && activeLoan && (
        <ReturnToolModal loan={activeLoan} onClose={() => setModal(null)} onSuccess={loan => { setModal(null); reloadAll(); setTermLoan(loan); }} />
      )}
      {termLoan && (
        <ToolLoanTermPrint loan={termLoan} tool={tool} config={config} onClose={() => setTermLoan(null)} />
      )}
      {modal === 'archive' && (
        <ConfirmDialog
          title={`Arquivar "${tool.name}"?`}
          description="A ferramenta ficará oculta no catálogo ativo. Pode ser restaurada a qualquer momento."
          confirmLabel="Arquivar Ferramenta"
          variant="warning"
          loading={archiving}
          onConfirm={handleArchive}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
