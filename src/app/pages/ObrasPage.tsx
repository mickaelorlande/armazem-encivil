import { useState } from 'react';
import { Building2, Plus, X, Pencil, Archive, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { useObras, useCriarObra, useAtualizarObra } from '@/features/obras/hooks/useObras';
import type { Obra, ObraStatus } from '../types';

const inputCls = 'w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

export function ObrasPage() {
  const { obras, loading, reload } = useObras(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);

  const openNew  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (o: Obra) => { setEditing(o); setModalOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Obras</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'A carregar…' : `${obras.length} obra${obras.length !== 1 ? 's' : ''} ativa${obras.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova Obra</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">A carregar…</div>
      ) : obras.length === 0 ? (
        <EmptyState icon={Building2} title="Ainda não há obras" description="Crie a primeira obra para organizar subempreiteiros, medições, stock e ferramentas." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {obras.map(o => (
            <div key={o.id} className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-primary/10 rounded-lg p-2 shrink-0"><Building2 className="w-4 h-4 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{o.name}</p>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                      o.status === 'concluida' ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success'
                    }`}>
                      {o.status === 'concluida' ? 'Concluída' : 'Ativa'}
                    </span>
                  </div>
                </div>
                <button onClick={() => openEdit(o)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              {o.client && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5 shrink-0" /> {o.client}</p>
              )}
              {o.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> {o.location}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ObraModal obra={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); reload(); }} />
      )}
    </div>
  );
}

function ObraModal({ obra, onClose, onSaved }: { obra: Obra | null; onClose: () => void; onSaved: () => void }) {
  const { criar, loading: creating } = useCriarObra();
  const { atualizar, loading: updating } = useAtualizarObra();
  const loading = creating || updating;

  const [form, setForm] = useState({
    name: obra?.name ?? '',
    client: obra?.client ?? '',
    location: obra?.location ?? '',
    status: (obra?.status ?? 'ativa') as ObraStatus,
    notes: obra?.notes ?? '',
  });

  const set = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Indique o nome da obra.'); return; }
    const payload = { name: form.name.trim(), client: form.client, location: form.location, status: form.status, notes: form.notes };
    const result = obra ? await atualizar(obra.id, payload) : await criar(payload);
    if (result) { toast.success(obra ? 'Obra atualizada.' : 'Obra criada.'); onSaved(); }
    else toast.error('Não foi possível guardar a obra.');
  };

  const handleArchive = async () => {
    if (!obra) return;
    const ok = await atualizar(obra.id, { active: false });
    if (ok) { toast.success('Obra arquivada.'); onSaved(); }
    else toast.error('Não foi possível arquivar.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 enc-fade-in">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-lg max-h-[92vh] overflow-y-auto enc-scale-in">
        <div className="p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10 flex items-center justify-between">
          <h2 className="text-lg font-bold">{obra ? 'Editar Obra' : 'Nova Obra'}</h2>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome da Obra <span className="text-destructive">*</span></label>
            <input type="text" value={form.name} onChange={e => set({ name: e.target.value })} className={inputCls} placeholder="Ex: Moradia em Cascais" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cliente <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
              <input type="text" value={form.client} onChange={e => set({ client: e.target.value })} className={inputCls} placeholder="Dono da obra" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select value={form.status} onChange={e => set({ status: e.target.value as ObraStatus })} className={inputCls}>
                <option value="ativa">Ativa</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Localização <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
            <input type="text" value={form.location} onChange={e => set({ location: e.target.value })} className={inputCls} placeholder="Morada / zona" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observações <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
            <textarea value={form.notes} onChange={e => set({ notes: e.target.value })} className={`${inputCls} resize-none`} rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? 'A guardar…' : obra ? 'Guardar' : 'Criar Obra'}
            </button>
            {obra && (
              <button type="button" onClick={handleArchive} disabled={loading} className="px-4 py-3.5 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 transition-all flex items-center gap-2">
                <Archive className="w-4 h-4" /> <span className="hidden sm:inline">Arquivar</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
