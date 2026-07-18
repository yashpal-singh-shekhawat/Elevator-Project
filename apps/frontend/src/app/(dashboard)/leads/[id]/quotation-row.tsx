'use client';

import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import type { QuotationDto } from '@lift-saas/shared-types';
import { useApproveQuotation, useRejectQuotation, useReviseQuotation } from '@/hooks/queries/use-quotations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';

export function QuotationRow({ quotation }: { quotation: QuotationDto }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const approveQuotation = useApproveQuotation();
  const rejectQuotation = useRejectQuotation();
  const reviseQuotation = useReviseQuotation();

  const isDecided = Boolean(quotation.approvedAt || quotation.rejectionReason);

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {quotation.quotationCode} · v{quotation.version} {quotation.tier ? `· ${quotation.tier}` : ''}
          </p>
          <p className="text-sm font-medium">
            {quotation.totalAmount ? `₹${quotation.totalAmount.toLocaleString('en-IN')}` : 'Amount not set'}
          </p>
        </div>
        <StatusBadge status={quotation.status} />
      </div>

      {quotation.rejectionReason && <p className="text-xs text-destructive">Rejected: {quotation.rejectionReason}</p>}
      {quotation.notes && <p className="text-xs text-muted-foreground">{quotation.notes}</p>}

      {!isDecided && !rejecting && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => approveQuotation.mutate({ id: quotation.id })}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => reviseQuotation.mutate(quotation.id)}>
            <Copy className="h-3.5 w-3.5" /> Revise
          </Button>
        </div>
      )}

      {rejecting && (
        <div className="flex gap-2">
          <Input
            placeholder="Rejection reason…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={!rejectionReason.trim()}
            onClick={() => {
              rejectQuotation.mutate({ id: quotation.id, rejectionReason });
              setRejecting(false);
            }}
          >
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
