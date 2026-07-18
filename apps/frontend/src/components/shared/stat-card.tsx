import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  accent?: 'primary' | 'success' | 'muted' | 'destructive';
}

const ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive'
};

// KPI tile for the platform dashboard. Icon chip + big number + optional hint.
export function StatCard({ label, value, icon: Icon, hint, accent = 'primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)]', ACCENT[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
