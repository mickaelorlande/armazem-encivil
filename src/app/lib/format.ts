// Formatação partilhada para o módulo de obras/subempreiteiros.

const euroFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
})

export function fmtEuro(value: number | null | undefined): string {
  return euroFormatter.format(Number(value ?? 0))
}

const numberFormatter = new Intl.NumberFormat('pt-PT', {
  maximumFractionDigits: 3,
})

export function fmtNumber(value: number | null | undefined): string {
  return numberFormatter.format(Number(value ?? 0))
}

// Unidades típicas de medição em obra (para artigos de subempreitada).
export const UNIDADES_OBRA = ['un', 'vg', 'm', 'm²', 'm³', 'kg', 'ton', 'h', 'dia', 'mês'] as const
