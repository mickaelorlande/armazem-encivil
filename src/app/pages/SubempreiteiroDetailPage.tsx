import { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ChevronLeft, Pencil, Trash2, CheckCircle2, FileEdit, ShieldCheck,
  Phone, Building2, Lock, Plus, Calendar, ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { fmtEuro, fmtNumber } from '../lib/format';
import { useRole } from '@/features/auth/useRole';
import {
  useSubempreiteiro,
  useValidarSubempreiteiro,
  useEliminarSubempreiteiro,
} from '@/features/subempreiteiros/hooks/useSubempreiteiros';
import { useAutos } from '@/features/autos/hooks/useAutos';

export function SubempreiteiroDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin, podeSubempreitadas } = useRole();
  const { sub, loading, reload } = useSubempreiteiro(id);
  const { autos, loading: autosLoading } = useAutos(id);
  const { validar, loading: validating } = useValidarSubempreiteiro();
  const { eliminar, loading: deleting } = useEliminarSubempreiteiro();
  const [confirmValidate, setConfirmValidate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Executado = soma dos autos validados. Autos em rascunho contam à parte (pendente).
  const executado = useMemo(() => autos.filter(a => a.status === 'validado').reduce((s, a) => s + a.periodValue, 0), [autos]);
  const pendente = useMemo(() => autos.filter(a => a.status === 'rascunho').reduce((s, a) => s + a.periodValue, 0), [autos]);

  if (loading) return <div className="max-w-2xl mx-auto p-8 text-center text-sm text-muted-foreground">A carregar…</div>;
  if (!sub) return <div className="max-w-2xl mx-auto p-8 text-center text-sm text-muted-foreground">Contratação não encontrada.</div>;

  const isValidado = sub.status === 'validado';
  const falta = sub.agreedValue - executado;

  const handleValidate = async () => {
    const result = await validar(sub.id);
    if (result) { toast.success('Contratação validada. Fica agora bloqueada para edição.'); setConfirmValidate(false); reload(); }
    else toast.error('Não foi possível validar. Verifique se tem valor/artigos e se é administrador.');
  };

  const handleDelete = async () => {
    const ok = await eliminar(sub.id);
    if (ok) { toast.success('Contratação eliminada.'); navigate('/subempreiteiros'); }
    else toast.error('Não foi possível eliminar.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold truncate">{sub.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" /> {sub.obraName ?? '—'}
          </p>
        </div>
        {isValidado ? (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Validado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning shrink-0">
            <FileEdit className="w-3.5 h-3.5" /> Rascunho
          </span>
        )}
      </div>

      {isValidado && (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-3 flex items-center gap-2.5 text-sm">
          <Lock className="w-4 h-4 text-success shrink-0" />
          <span className="text-muted-foreground">
            Contratação validada{sub.validatedAt ? ` em ${sub.validatedAt.toLocaleDateString('pt-PT')}` : ''} — bloqueada para edição.
          </span>
        </div>
      )}

      {/* Resumo financeiro */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Acordado</p>
          <p className="text-lg md:text-xl font-bold mt-1 text-primary">{fmtEuro(sub.agreedValue)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Executado</p>
          <p className="text-lg md:text-xl font-bold mt-1 text-success">{fmtEuro(executado)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Falta</p>
          <p className="text-lg md:text-xl font-bold mt-1">{fmtEuro(falta)}</p>
        </div>
      </div>
      {pendente > 0 && (
        <p className="text-xs text-muted-foreground text-center -mt-1">
          + {fmtEuro(pendente)} em autos por validar (ainda não contam para o executado).
        </p>
      )}

      {/* Autos de Medição */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Autos de Medição</h2>
          {isValidado && podeSubempreitadas && (
            <button
              onClick={() => navigate(`/subempreiteiros/${sub.id}/autos/novo`)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> Novo Auto
            </button>
          )}
        </div>
        {!isValidado ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            Valide a contratação para começar a lançar autos de medição.
          </p>
        ) : autosLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">A carregar…</p>
        ) : autos.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Ainda não há autos. Crie o primeiro com "Novo Auto".</p>
        ) : (
          <div className="divide-y divide-border">
            {autos.map(a => (
              <Link key={a.id} to={`/autos/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-semibold shrink-0">Nº {a.number}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.date.toLocaleDateString('pt-PT')}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {a.status === 'validado' ? (
                    <span className="text-[11px] font-semibold text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validado</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-warning flex items-center gap-1"><FileEdit className="w-3 h-3" /> Rascunho</span>
                  )}
                  <span className="text-sm font-bold">{fmtEuro(a.periodValue)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Dados da contratação */}
      <div className="bg-card rounded-2xl border border-border divide-y divide-border">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tipo de contrato</span>
          <span className="text-sm font-semibold">{sub.type === 'global' ? 'Preço fechado' : 'Preços unitários'}</span>
        </div>
        {sub.contact && (
          <div className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Contacto</span>
            <a href={`tel:${sub.contact}`} className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {sub.contact}
            </a>
          </div>
        )}
      </div>

      {/* Artigos (só tipo unitário) */}
      {sub.type === 'unitario' && sub.items && sub.items.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm">Artigos ({sub.items.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {['Descrição', 'Un.', 'Qtd', 'Preço', 'Subtotal'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sub.items.map(it => (
                  <tr key={it.id}>
                    <td className="px-3 py-2.5">
                      {it.description}
                      {it.isExtra && <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">extra</span>}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{it.unit}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{fmtNumber(it.plannedQuantity)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{fmtEuro(it.unitPrice)}</td>
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{fmtEuro(it.unitPrice * it.plannedQuantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Condições */}
      {sub.conditions && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-semibold text-sm mb-2">Condições Acordadas</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sub.conditions}</p>
        </div>
      )}

      {/* Ações */}
      {!isValidado && (
        <div className="flex flex-col gap-3">
          {isAdmin && (
            confirmValidate ? (
              <div className="bg-success/5 border border-success/30 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium">Validar esta contratação? Depois de validada, ninguém poderá alterá-la.</p>
                <div className="flex gap-3">
                  <button onClick={handleValidate} disabled={validating} className="flex-1 py-3 bg-success text-success-foreground rounded-xl font-bold hover:bg-success/90 transition-all disabled:opacity-60">
                    {validating ? 'A validar…' : 'Sim, validar'}
                  </button>
                  <button onClick={() => setConfirmValidate(false)} disabled={validating} className="px-4 py-3 bg-secondary/20 rounded-xl font-medium hover:bg-secondary/30 transition-all">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmValidate(true)} className="w-full py-3.5 bg-success text-success-foreground rounded-xl font-bold hover:bg-success/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Validar Contratação
              </button>
            )
          )}
          {podeSubempreitadas && (
            <div className="flex gap-3">
              <button onClick={() => navigate(`/subempreiteiros/${sub.id}/editar`)} className="flex-1 py-3 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 transition-all flex items-center justify-center gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </button>
              {confirmDelete ? (
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  <Trash2 className="w-4 h-4" /> {deleting ? 'A eliminar…' : 'Confirmar'}
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>
          )}
          {!isAdmin && (
            <p className="text-xs text-muted-foreground text-center">A validação da contratação é feita por um administrador.</p>
          )}
        </div>
      )}
    </div>
  );
}
