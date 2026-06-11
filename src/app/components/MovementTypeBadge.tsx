import { MovementType } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Edit3 } from 'lucide-react';

interface MovementTypeBadgeProps {
  type: MovementType;
}

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  const config = {
    entrada: {
      label: 'Entrada',
      className: 'bg-success/10 text-success border-success/20',
      icon: ArrowDownCircle,
    },
    saida: {
      label: 'Saída',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: ArrowUpCircle,
    },
    ajuste: {
      label: 'Ajuste',
      className: 'bg-primary/10 text-primary border-primary/20',
      icon: Edit3,
    },
  };

  const { label, className, icon: Icon } = config[type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
