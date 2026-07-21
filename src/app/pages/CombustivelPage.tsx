import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { Fuel, Plus, Truck, Droplet, Building2, Gauge, Pencil, QrCode, Printer, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { fmtEuro, fmtNumber } from '../lib/format';
import { getVehicleTypeLabel, getFuelTypeLabel } from '@/features/combustivel/labels';
import { useAbastecimentos, useVeiculos } from '@/features/combustivel/hooks/useCombustivel';
import { usePendentes } from '@/features/combustivel/hooks/usePendentes';
import { useRole } from '@/features/auth/useRole';

type Tab = 'abastecimentos' | 'veiculos' | 'pendentes';

export function CombustivelPage() {
  const navigate = useNavigate();
  const { podeCombustivel } = useRole();
  const [tab, setTab] = useState<Tab>('abastecimentos');
  const [actionId, setActionId] = useState<string | null>(null);

  const { entries, loading } = useAbastecimentos();
  const { vehicles, loading: vLoading } = useVeiculos(true);
  const { items: pendentes, loading: pLoading, error: pError, aprovar, rejeitar } = usePendentes();

  const totalGasto  = useMemo(() => entries.reduce((s, e) => s + e.totalCost, 0), [entries]);
  const totalLitros = useMemo(() => entries.reduce((s, e) => s + e.liters, 0), [entries]);

  const abrirQR = (id: string, name: string, code: string) => {
    const url = `/pub/imprimir-qr?v=${id}&vn=${encodeURIComponent(name)}&vc=${encodeURIComponent(code)}`;
    window.open(url, '_blank');
  };

  const handleAprovar = async (id: string) => {
    setActionId(id);
    await aprovar(id);
    setActionId(null);
  };

  const handleRejeitar = async (id: string) => {
    if (!window.confirm('Rejeitar este abastecimento? Será eliminado permanentemente.')) return;
    setActionId(id);
    await rejeitar(id);
    setActionId(null);
  };

  const subtitleMap: Record<Tab, string> = {
    abastecimentos: loading ? 'A carregar…' : `${entries.length} abastecimento${entries.length !== 1 ? 's' : ''} · ${fmtEuro(totalGasto)} · ${fmtNumber(totalLitros)} L`,
    veiculos:       vLoading ? 'A carregar…' : `${vehicles.length} viatura${vehicles.length !== 1 ? 's' : ''}/máquina${vehicles.length !== 1 ? 's' : ''}`,
    pendentes:      pLoading ? 'A carregar…' : `${pendentes.length} pendente${pendentes.length !== 1 ? 's' : ''} por aprovação`,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Combustível</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitleMap[tab]}</p>
        </div>
        {podeCombustivel && tab !== 'pendentes' && (
          <button
            onClick={() => navigate(tab === 'abastecimentos' ? '/combustivel/abastecimento' : '/combustivel/veiculo')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{tab === 'abastecimentos' ? 'Novo Abastecimento' : 'Nova Viatura'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {([
          ['abastecimentos', 'Abastecimentos', Droplet],
          ['veiculos',       'Viaturas & Máquinas', Truck],
          ['pendentes',      'Pendentes', Clock],
        ] as const).map(([v, label, Icon]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === v ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {v === 'pendentes' && pendentes.length > 0 && (
              <span className="ml-0.5 bg-warning text-warning-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                {pendentes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Abastecimentos ─────────────────────────────── */}
      {tab === 'abastecimentos' && (
        loading ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : entries.length === 0 ? (
          <EmptyState icon={Fuel} title="Sem abastecimentos" description="Registe o primeiro abastecimento de uma viatura ou máquina." />
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {entries.map(e => (
              <Link key={e.id} to={`/combustivel/abastecimento/${e.id}/editar`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.vehicleName ?? '—'} <span className="text-xs text-muted-foreground font-normal">{e.vehicleCode}</span></p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{e.date.toLocaleDateString('pt-PT')}</span>
                    {e.obraName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {e.obraName}</span>}
                    <span>{fmtNumber(e.liters)} L · {fmtEuro(e.pricePerLiter)}/L</span>
                  </p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap">{fmtEuro(e.totalCost)}</span>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ── Viaturas & Máquinas ────────────────────────── */}
      {tab === 'veiculos' && (
        vLoading ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : vehicles.length === 0 ? (
          <EmptyState icon={Truck} title="Sem viaturas registadas" description="Adicione as viaturas e máquinas da empresa para poder registar abastecimentos." />
        ) : (
          <>
            {/* Dica QR */}
            <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-sm">
              <QrCode className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                Clique em <strong className="text-foreground">Imprimir QR</strong> em cada viatura, imprima e cole no interior.
                O motorista lê o QR code, lança o nome e os dados do abastecimento — sem precisar de login.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vehicles.map(v => (
                <div key={v.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{v.name} <span className="text-xs text-muted-foreground font-normal">{v.code}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">{getVehicleTypeLabel(v.type)} · {getFuelTypeLabel(v.fuelType)}</p>
                      {v.identification && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Gauge className="w-3 h-3" /> {v.identification}</p>}
                    </div>
                    {podeCombustivel && (
                      <button onClick={() => navigate(`/combustivel/veiculo/${v.id}/editar`)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors shrink-0">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => abrirQR(v.id, v.name, v.code ?? '')}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir QR
                  </button>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* ── Pendentes ──────────────────────────────────── */}
      {tab === 'pendentes' && (
        pLoading ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : pError ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{pError}</p>
          </div>
        ) : pendentes.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Sem pendentes" description="Quando os motoristas registarem abastecimentos via QR code, aparecem aqui para aprovação." />
        ) : (
          <div className="space-y-3">
            {pendentes.map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.veiculo_nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      por <span className="font-medium text-foreground">{p.funcionario_nome}</span>
                      {' · '}{new Date(p.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-base font-bold whitespace-nowrap">{fmtEuro(p.custo_total)}</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Fuel className="w-3.5 h-3.5" /> {fmtNumber(p.litros)} L
                  </span>
                  {p.local && <span className="text-muted-foreground truncate">{p.local}</span>}
                  {p.contador != null && <span className="text-muted-foreground">{fmtNumber(p.contador)} km/h</span>}
                </div>

                {podeCombustivel && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAprovar(p.id)}
                      disabled={actionId === p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-semibold hover:bg-success/90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionId === p.id ? 'A processar…' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => handleRejeitar(p.id)}
                      disabled={actionId === p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold hover:bg-destructive/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
