import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { Fuel, Plus, Truck, Droplet, Building2, Gauge, Pencil } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { fmtEuro, fmtNumber } from '../lib/format';
import { getVehicleTypeLabel, getFuelTypeLabel } from '@/features/combustivel/labels';
import { useAbastecimentos, useVeiculos } from '@/features/combustivel/hooks/useCombustivel';
import { useRole } from '@/features/auth/useRole';

type Tab = 'abastecimentos' | 'veiculos';

export function CombustivelPage() {
  const navigate = useNavigate();
  const { podeCombustivel } = useRole();
  const [tab, setTab] = useState<Tab>('abastecimentos');

  const { entries, loading } = useAbastecimentos();
  const { vehicles, loading: vLoading } = useVeiculos(true);

  const totalGasto = useMemo(() => entries.reduce((s, e) => s + e.totalCost, 0), [entries]);
  const totalLitros = useMemo(() => entries.reduce((s, e) => s + e.liters, 0), [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Combustível</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tab === 'abastecimentos'
              ? (loading ? 'A carregar…' : `${entries.length} abastecimento${entries.length !== 1 ? 's' : ''} · ${fmtEuro(totalGasto)} · ${fmtNumber(totalLitros)} L`)
              : (vLoading ? 'A carregar…' : `${vehicles.length} viatura${vehicles.length !== 1 ? 's' : ''}/máquina${vehicles.length !== 1 ? 's' : ''}`)}
          </p>
        </div>
        {podeCombustivel && (
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
      <div className="flex border-b border-border">
        {([['abastecimentos', 'Abastecimentos', Droplet], ['veiculos', 'Viaturas & Máquinas', Truck]] as const).map(([v, label, Icon]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === v ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Abastecimentos */}
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

      {/* Veículos */}
      {tab === 'veiculos' && (
        vLoading ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">A carregar…</div>
        ) : vehicles.length === 0 ? (
          <EmptyState icon={Truck} title="Sem viaturas registadas" description="Adicione as viaturas e máquinas da empresa para poder registar abastecimentos." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map(v => (
              <div key={v.id} className="bg-card rounded-2xl border border-border p-4 flex items-start justify-between gap-2">
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
            ))}
          </div>
        )
      )}
    </div>
  );
}
