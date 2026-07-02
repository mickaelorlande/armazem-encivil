import type { VehicleType, FuelType, CounterUnit } from '@/app/types'

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'viatura', label: 'Viatura' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'gerador', label: 'Gerador' },
  { value: 'outro',   label: 'Outro' },
]

export const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'gasoleo',  label: 'Gasóleo' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'adblue',   label: 'AdBlue' },
  { value: 'eletrico', label: 'Elétrico' },
  { value: 'outro',    label: 'Outro' },
]

export const COUNTER_UNITS: { value: CounterUnit; label: string }[] = [
  { value: 'km',    label: 'Quilómetros (km)' },
  { value: 'horas', label: 'Horas' },
]

export const getVehicleTypeLabel = (t: VehicleType) => VEHICLE_TYPES.find(x => x.value === t)?.label ?? t
export const getFuelTypeLabel    = (t: FuelType)    => FUEL_TYPES.find(x => x.value === t)?.label ?? t
