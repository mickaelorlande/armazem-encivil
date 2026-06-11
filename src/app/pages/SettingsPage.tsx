import { useState, useEffect } from 'react';
import { Building2, User, Bell, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useConfiguracoes } from '@/features/configuracoes/hooks/useConfiguracoes';

export function SettingsPage() {
  const { config, loading, saving, atualizar } = useConfiguracoes();

  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    responsavelArmazem: '',
    stockMinimoPadrao: '10',
    enableNotifications: true,
    notifyLowStock: true,
    notifyNewMovements: false,
  });

  useEffect(() => {
    if (config) {
      setFormData((prev) => ({
        ...prev,
        nomeEmpresa: config.nomeEmpresa,
        responsavelArmazem: config.responsavelArmazem ?? '',
        stockMinimoPadrao: String(config.stockMinimoPadrao),
      }));
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await atualizar({
      nomeEmpresa: formData.nomeEmpresa,
      responsavelArmazem: formData.responsavelArmazem || null,
      stockMinimoPadrao: parseFloat(formData.stockMinimoPadrao) || 10,
    });
    if (ok) toast.success('Configurações guardadas com sucesso!');
    else toast.error('Erro ao guardar configurações.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerir preferências do sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dados da Empresa
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
              <input
                type="text"
                value={formData.nomeEmpresa}
                onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Responsável pelo Armazém</label>
              <input
                type="text"
                value={formData.responsavelArmazem}
                onChange={(e) => setFormData({ ...formData, responsavelArmazem: e.target.value })}
                className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome do responsável"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Preferências de Stock
            </h3>
          </div>
          <div className="p-5">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Mínimo Padrão</label>
              <input
                type="number"
                value={formData.stockMinimoPadrao}
                onChange={(e) => setFormData({ ...formData, stockMinimoPadrao: e.target.value })}
                className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">Valor padrão para novos produtos</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { key: 'enableNotifications', label: 'Ativar Notificações', desc: 'Receber alertas do sistema', disabled: false },
              { key: 'notifyLowStock', label: 'Alertas de Stock Baixo', desc: 'Notificar quando produtos atingirem stock mínimo', disabled: !formData.enableNotifications },
              { key: 'notifyNewMovements', label: 'Notificações de Movimentos', desc: 'Receber confirmação de cada movimento registado', disabled: !formData.enableNotifications },
            ].map(({ key, label, desc, disabled }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="sr-only peer"
                    disabled={disabled}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary disabled:opacity-50"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-60"
          >
            <Save className="w-5 h-5" />
            {saving ? 'A guardar…' : 'Guardar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
