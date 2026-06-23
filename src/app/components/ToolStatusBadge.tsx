import { ToolStatus } from '../types';
import { getToolStatusLabel } from '../data/mockData';

interface ToolStatusBadgeProps {
  status: ToolStatus;
}

export function ToolStatusBadge({ status }: ToolStatusBadgeProps) {
  const styles: Record<ToolStatus, string> = {
    'disponivel':  'bg-success/10 text-success border-success/20',
    'emprestada':  'bg-warning/10 text-warning border-warning/20',
    'manutencao':  'bg-destructive/10 text-destructive border-destructive/20',
    'inativa':     'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {getToolStatusLabel(status)}
    </span>
  );
}
