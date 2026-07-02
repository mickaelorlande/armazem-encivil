// Rótulos de apresentação (categorias, unidades, estados). Os dados reais vêm
// do Supabase — os antigos arrays mock (mockProducts/mockMovements) foram
// removidos por estarem sem uso.

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'cimento': 'Cimento',
    'areia-brita': 'Areia e Brita',
    'tijolo-bloco': 'Tijolo e Bloco',
    'tinta': 'Tinta',
    'tubagem': 'Tubagem',
    'ferragem': 'Ferragem',
    'ferramenta': 'Ferramentas',
    'madeira': 'Madeira',
    'outro': 'Outro',
  };
  return labels[category] || category;
};

export const getUnitLabel = (unit: string): string => {
  const labels: Record<string, string> = {
    'saco': 'saco(s)',
    'unidade': 'un.',
    'kg': 'kg',
    'litro': 'L',
    'caixa': 'cx.',
    'metro': 'm',
    'm2': 'm²',
    'm3': 'm³',
  };
  return labels[unit] || unit;
};

export const getToolCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'manual': 'Ferramenta Manual',
    'eletrica': 'Ferramenta Elétrica',
    'medicao': 'Medição',
    'seguranca': 'Equipamento de Segurança',
    'outro': 'Outro',
  };
  return labels[category] || category;
};

export const getToolStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'disponivel': 'Disponível',
    'emprestada': 'Emprestada',
    'manutencao': 'Em Manutenção',
    'inativa': 'Inativa',
  };
  return labels[status] || status;
};

export const getReturnConditionLabel = (condition: string): string => {
  const labels: Record<string, string> = {
    'bom_estado': 'Bom Estado',
    'danificada': 'Danificada',
    'perdida': 'Perdida/Extraviada',
  };
  return labels[condition] || condition;
};
