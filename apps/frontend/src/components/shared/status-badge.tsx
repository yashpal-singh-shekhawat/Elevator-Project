import { Badge } from '@/components/ui/badge';
import type { StatusRef } from '@lift-saas/shared-types';

// Backend master data stores a free-text color hint (e.g. "green", "amber");
// map the common ones to our badge variants, default to outline otherwise.
const COLOR_VARIANT_MAP: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
  green: 'success',
  amber: 'default',
  orange: 'default',
  red: 'destructive',
  blue: 'secondary',
  slate: 'outline'
};

export function StatusBadge({ status }: { status: StatusRef }) {
  const variant = COLOR_VARIANT_MAP[status.color ?? ''] ?? 'outline';
  return (
    <Badge variant={variant} className="font-mono">
      {status.label}
    </Badge>
  );
}
