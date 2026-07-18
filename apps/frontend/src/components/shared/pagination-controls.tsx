'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@lift-saas/shared-types';

export function PaginationControls({
  meta,
  onPageChange
}: {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-1 py-3 text-sm text-muted-foreground">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.totalItems} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
