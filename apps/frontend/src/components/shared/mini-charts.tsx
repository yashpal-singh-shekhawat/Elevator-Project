import { cn } from '@/lib/utils';

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  className?: string;
  valueFormatter?: (v: number) => string;
}

// Dependency-free horizontal bar chart (no recharts). Pure CSS widths so it
// renders identically server + client and adds zero bundle weight.
export function HorizontalBarChart({ data, className, valueFormatter }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate font-medium text-foreground">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {valueFormatter ? valueFormatter(d.value) : d.value}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DonutProps {
  segments: Array<{ label: string; value: number; className: string }>;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

// Dependency-free donut using stacked SVG circle stroke-dasharray.
export function DonutChart({ segments, centerLabel, centerValue, className }: DonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex items-center gap-5', className)}>
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="12" className="stroke-muted" />
        {segments.map((s) => {
          const length = (s.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              className={s.className}
            />
          );
          offset += length;
          return el;
        })}
        {(centerValue !== undefined || centerLabel) && (
          <g className="rotate-90" transform="rotate(90 50 50)">
            {centerValue !== undefined && (
              <text x="50" y="48" textAnchor="middle" className="fill-foreground text-[16px] font-semibold">
                {centerValue}
              </text>
            )}
            {centerLabel && (
              <text x="50" y="62" textAnchor="middle" className="fill-muted-foreground text-[8px]">
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>

      <div className="flex flex-col gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className={cn('h-2.5 w-2.5 rounded-sm', s.className.replace('stroke-', 'bg-'))} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
