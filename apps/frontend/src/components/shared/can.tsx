'use client';

import { usePermissions } from '@/hooks/use-permissions';

interface CanProps {
  // A single permission code, or a list. With a list, `mode` controls whether
  // the user needs ANY (default) or ALL of them.
  permission: string | string[];
  mode?: 'any' | 'all';
  children: React.ReactNode;
  // Optional fallback shown when the user lacks the permission.
  fallback?: React.ReactNode;
}

// Permission gate. Renders children only when the current user's permission
// snapshot satisfies the requirement — used to build role/permission-adaptive
// dashboards and hide actions the user can't perform.
export function Can({ permission, mode = 'any', children, fallback = null }: CanProps) {
  const { can, canAny, canAll } = usePermissions();
  const codes = Array.isArray(permission) ? permission : [permission];
  const allowed = codes.length === 1 ? can(codes[0]) : mode === 'all' ? canAll(codes) : canAny(codes);
  return <>{allowed ? children : fallback}</>;
}
