import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useObra, useCriarObra, useAtualizarObra } from '@/features/obras/hooks/useObras';
import type { ObraStatus } from '../types';

const inputCls = 'w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

export function ObraFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { obra, loading: obraLoading } = useObra(id);
  const { criar, loading: creating } = useCriarObra();
  const { atualizar, loading: updating } = useAtualizarObra();
  const saving = creating || updating;

  const [form, setForm] = useState({
    name: '',
    client: '',
    location: '',
    status: 'ativa' as ObraStatus,
    notes: '',
  });

  useEffect(() => {
    if (!isEdit || !obra) return;
    setForm({
      name: obra.name,
      client: obra.client ?? '',
      location: obra.location ?? '',
      status: obra.status,
      notes: obra.notes ?? '',
    });
  }, [isEdit, obra]);

  const set = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Indique o nome da obra.'); return; }
    const payload = {
      name: form.name.trim(),
      client: form.client,
      location: form.location,
      status: form.status,
      notes: form.notes,
    };
    const result = isEdit ? await atualizar(id!, payload) : await criar(payload);
    if (result) {
      toast.success(isEdit ? 'Obra atualizada.' : 'Obra criada.');
      navigate('/obras');
    } else {
      toast.error('Não foi possível guardar a obra.');
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    const ok = await atualizar(id, { active: false });
    if (ok) { toast.success('Obra arquivada.'); navigate('/obras'); }
    else toast.error('Não foi possível arquivar.');
  };

  if (isEdit && obraLoading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-sm text-muted-foreground">A carregar…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">{isEdit ? 'Editar Obra' : 'Nova Obra'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cadastro de obra da empresa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
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
            <textarea value={form.notes} onChange={e => set({ notes: e.target.value })} className={`${inputCls} resize-none`} rows={3} />
          </div>
        </div>

        <div className="sticky bottom-20 md:bottom-0 py-3 bg-background/80 backdrop-blur-sm md:bg-transparent flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
            {saving ? 'A guardar…' : isEdit ? 'Guardar Alterações' : 'Criar Obra'}
          </button>
          {isEdit && (
            <button type="button" onClick={handleArchive} disabled={saving} className="px-4 py-4 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 transition-all flex items-center gap-2">
              <Archive className="w-4 h-4" /> <span className="hidden sm:inline">Arquivar</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
