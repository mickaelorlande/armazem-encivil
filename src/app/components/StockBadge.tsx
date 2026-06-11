import { StockStatus } from '../types';

interface StockBadgeProps {
  status: StockStatus;
}

export function StockBadge({ status }: StockBadgeProps) {
  const styles = {
    'normal': 'bg-success/10 text-success border-success/20',
    'baixo': 'bg-warning/10 text-warning border-warning/20',
    'sem-stock': 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const labels = {
    'normal': 'Normal',
    'baixo': 'Stock Baixo',
    'sem-stock': 'Sem Stock',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
