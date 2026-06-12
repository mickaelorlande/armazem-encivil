import { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  title:    string;
  value:    string | number;
  icon:     LucideIcon;
  trend?:   string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?:   'delay-50' | 'delay-100' | 'delay-150' | 'delay-200';
}

function AnimatedNumber({ value }: { value: number }) {
  const display = useCountUp(value);
  if (display === undefined) return <span className="inline-block h-8 w-14 skeleton rounded" />;
  return <>{display}</>;
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay }: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger:  'bg-destructive/10 text-destructive',
  };

  return (
    <div className={`bg-card rounded-xl border border-border p-4 md:p-5 enc-fade-up card-lift ${delay ?? ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 leading-tight">{title}</p>
          <p className="text-2xl md:text-3xl font-semibold text-card-foreground">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={`p-2.5 md:p-3 rounded-lg shrink-0 ${variantStyles[variant]}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
}
