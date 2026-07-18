import { cn } from '@/lib/utils';
import { resolveAssetUrl } from '@/lib/assets';

interface TenantLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

// Square logo tile with a graceful initials fallback. Reused in the tenant
// table, the create/edit form preview, and the platform sidebar/header.
export function TenantLogo({ name, logoUrl, className }: TenantLogoProps) {
  const src = resolveAssetUrl(logoUrl);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-border bg-muted text-xs font-semibold text-muted-foreground',
        'h-9 w-9',
        className
      )}
      aria-hidden={!!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" />
      ) : (
        <span>{initials || '—'}</span>
      )}
    </div>
  );
}
