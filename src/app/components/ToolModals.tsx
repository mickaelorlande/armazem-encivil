import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useCriarFerramenta,
  useAtualizarFerramenta,
} from '@/features/ferramentas/hooks/useFerramentas';
import {
  useRegistarEmprestimo,
  useRegistarDevolucao,
} from '@/features/ferramentas/hooks/useEmprestimos';
import { useRole } from '@/features/auth/useRole';
import { ToolCombobox } from './ToolCombobox';
import { SignaturePad } from './SignaturePad';
import type { Tool, ToolCategory, ToolLoan, ReturnCondition } from '../types';

const inputCls = 'w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base';

const categoryOpts: [ToolCategory, string][] = [
  ['manual', 'Ferramenta Manual'],
  ['eletrica', 'Ferramenta Elétrica'],
  ['medicao', 'Medição'],
  ['seguranca', 'Equipamento de Segurança'],
  ['outro', 'Outro'],
];

/* ── Criar / Editar Ferramenta ─────────────────────────────────── */

export function ToolFormModal({ tool, onClose, onSuccess }: {
  tool?: Tool;
  onClose: () => void;
  onSuccess: (tool: Tool) => void;
}) {
  const isEdit = !!tool;
  const { criar, loading: creating } = useCriarFerramenta();
  const { atualizar, loading: updating } = useAtualizarFerramenta();
  const loading = creating || updating;

  const [formData, setFormData] = useState({
    name: tool?.name ?? '',
    category: tool?.category ?? ('outro' as ToolCategory),
    serialNumber: tool?.serialNumber ?? '',
    estimatedValue: tool?.estimatedValue ? String(tool.estimatedValue) : '',
    notes: tool?.notes ?? '',
  });

  const [codigoPreview, setCodigoPreview] = useState('');
  const [gerandoCodigo, setGerandoCodigo] = useState(!isEdit);

  useEffect(() => {
    if (isEdit) return;
    supabase.rpc('gerar_codigo_ferramenta').then(({ data }) => {
      if (data) setCodigoPreview(data);
      setGerandoCodigo(false);
    });
  }, [isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      name: formData.name,
      category: formData.category,
      serialNumber: formData.serialNumber || undefined,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      notes: formData.notes || undefined,
    };
    const result = isEdit
      ? await atualizar(tool!.id, input)
      : await criar(input);

    if (result) {
      toast.success(isEdit ? 'Ferramenta atualizada com sucesso!' : 'Ferramenta criada com sucesso!');
      onSuccess(result);
    } else {
      toast.error(isEdit ? 'Erro ao atualizar ferramenta.' : 'Erro ao criar ferramenta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 enc-fade-in">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto enc-scale-in">
        <div className="p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">{isEdit ? 'Editar Ferramenta' : 'Nova Ferramenta'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Atualizar dados da ferramenta' : 'Adicionar ferramenta/equipamento ao inventário'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código <span className="text-muted-foreground font-normal text-xs">(gerado automaticamente)</span></label>
              <input
                type="text"
                value={isEdit ? tool!.code : (gerandoCodigo ? 'A gerar…' : codigoPreview)}
                readOnly
                disabled
                className={`${inputCls} bg-muted text-muted-foreground cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="Ex: Berbequim Bosch GSB 13 RE" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ToolCategory })} className={inputCls}>
                {categoryOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nº de Série <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
              <input type="text" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} className={inputCls} placeholder="Ex: SN-48213" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Valor Estimado (€) <span className="text-muted-foreground font-normal text-xs">(opcional, referência para o termo de responsabilidade)</span></label>
            <input type="number" value={formData.estimatedValue} onChange={e => setFormData({ ...formData, estimatedValue: e.target.value })} className={inputCls} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observações <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`${inputCls} resize-none`} rows={2} placeholder="Acessórios incluídos, localização habitual, etc." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || gerandoCodigo} className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? 'A guardar…' : isEdit ? 'Guardar Alterações' : 'Criar Ferramenta'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3.5 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 active:scale-[0.98] transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Registar Empréstimo ───────────────────────────────────────── */

export function LoanToolModal({ tools, tool, onClose, onSuccess }: {
  tools: Tool[];
  tool?: Tool;
  onClose: () => void;
  onSuccess: (loan: ToolLoan) => void;
}) {
  const { nome } = useRole();
  const { registar, loading } = useRegistarEmprestimo();
  const [formData, setFormData] = useState({
    toolId: tool?.id ?? '',
    employeeName: '',
    employeeDocument: '',
    destination: '',
    expectedReturnDate: '',
    deliveryCondition: 'Bom estado',
    deliveredBy: nome,
    notes: '',
  });
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (nome) setFormData(prev => ({ ...prev, deliveredBy: prev.deliveredBy || nome }));
  }, [nome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.toolId) { toast.error('Selecione uma ferramenta.'); return; }
    if (!signature) { toast.error('A assinatura do funcionário é obrigatória.'); return; }
    const result = await registar({
      toolId: formData.toolId,
      employeeName: formData.employeeName,
      deliveredBy: formData.deliveredBy,
      signature,
      employeeDocument: formData.employeeDocument || undefined,
      destination: formData.destination || undefined,
      expectedReturnDate: formData.expectedReturnDate || undefined,
      deliveryCondition: formData.deliveryCondition || undefined,
      notes: formData.notes || undefined,
    });
    if (result) {
      toast.success('Empréstimo registado com sucesso!');
      onSuccess(result);
    } else {
      toast.error('Erro ao registar empréstimo. A ferramenta pode já não estar disponível.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 enc-fade-in">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto enc-scale-in">
        <div className="p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">Registar Empréstimo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Entregar ferramenta a um funcionário</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ferramenta</label>
            <ToolCombobox tools={tools} value={formData.toolId} onChange={id => setFormData({ ...formData, toolId: id })} disabled={!!tool} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Funcionário</label>
              <input type="text" value={formData.employeeName} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} className={inputCls} placeholder="Nome completo" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CC / NIF <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
              <input type="text" value={formData.employeeDocument} onChange={e => setFormData({ ...formData, employeeDocument: e.target.value })} className={inputCls} placeholder="Documento de identificação" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Destino / Obra <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
              <input type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className={inputCls} placeholder="Onde vai ser usada" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Devolução Prevista <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
              <input type="date" value={formData.expectedReturnDate} onChange={e => setFormData({ ...formData, expectedReturnDate: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Responsável pela Entrega</label>
            <input type="text" value={formData.deliveredBy} onChange={e => setFormData({ ...formData, deliveredBy: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observações <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`${inputCls} resize-none`} rows={2} />
          </div>
          <SignaturePad
            label="Assinatura do Funcionário (confirma a receção da ferramenta)"
            value={signature}
            onChange={setSignature}
          />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !signature} className="flex-1 py-3.5 bg-warning text-white rounded-xl font-bold hover:bg-warning/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? 'A registar…' : 'Confirmar Empréstimo'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3.5 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 active:scale-[0.98] transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Registar Devolução ────────────────────────────────────────── */

const returnConditionOpts: [ReturnCondition, string][] = [
  ['bom_estado', 'Bom Estado'],
  ['danificada', 'Danificada'],
  ['perdida', 'Perdida / Extraviada'],
];

export function ReturnToolModal({ loan, onClose, onSuccess }: {
  loan: ToolLoan;
  onClose: () => void;
  onSuccess: (loan: ToolLoan) => void;
}) {
  const { nome } = useRole();
  const { devolver, loading } = useRegistarDevolucao();
  const [formData, setFormData] = useState({
    returnCondition: 'bom_estado' as ReturnCondition,
    receivedBy: nome,
    notes: '',
  });
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (nome) setFormData(prev => ({ ...prev, receivedBy: prev.receivedBy || nome }));
  }, [nome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) { toast.error('A assinatura do funcionário é obrigatória.'); return; }
    const result = await devolver({
      loanId: loan.id,
      returnCondition: formData.returnCondition,
      receivedBy: formData.receivedBy,
      signature,
      returnNotes: formData.notes || undefined,
    });
    if (result) {
      toast.success('Devolução registada com sucesso!');
      onSuccess(result);
    } else {
      toast.error('Erro ao registar devolução.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 enc-fade-in">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-lg max-h-[92vh] overflow-y-auto enc-scale-in">
        <div className="p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">Registar Devolução</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loan.toolCode} · {loan.toolName} — emprestada a {loan.employeeName}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Estado na Devolução</label>
            <select value={formData.returnCondition} onChange={e => setFormData({ ...formData, returnCondition: e.target.value as ReturnCondition })} className={inputCls}>
              {returnConditionOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {formData.returnCondition === 'danificada' && (
              <p className="text-xs text-warning mt-1.5">A ferramenta passará para o estado "Em Manutenção".</p>
            )}
            {formData.returnCondition === 'perdida' && (
              <p className="text-xs text-destructive mt-1.5">A ferramenta será marcada como "Inativa".</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Recebido por</label>
            <input type="text" value={formData.receivedBy} onChange={e => setFormData({ ...formData, receivedBy: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observações <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`${inputCls} resize-none`} rows={2} placeholder="Detalhes sobre o estado, danos, etc." />
          </div>
          <SignaturePad
            label="Assinatura do Funcionário (confirma a devolução da ferramenta)"
            value={signature}
            onChange={setSignature}
          />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !signature} className="flex-1 py-3.5 bg-success text-success-foreground rounded-xl font-bold hover:bg-success/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? 'A registar…' : 'Confirmar Devolução'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3.5 bg-secondary/20 text-foreground rounded-xl font-medium hover:bg-secondary/30 active:scale-[0.98] transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
