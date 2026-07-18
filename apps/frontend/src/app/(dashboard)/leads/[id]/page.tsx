'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLead } from '@/hooks/queries/use-leads';
import { useQuotations } from '@/hooks/queries/use-quotations';
import { usePermissions } from '@/hooks/use-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { WorkflowTimeline } from '@/components/shared/workflow-timeline';
import { AssignLeadDialog } from './assign-lead-dialog';
import { TransitionLeadDialog } from './transition-lead-dialog';
import { CreateQuotationDialog } from './create-quotation-dialog';
import { DeleteLeadDialog } from './delete-lead-dialog';
import { QuotationRow } from './quotation-row';

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const leadId = Number(params.id);

  const { data: lead, isLoading } = useLead(leadId);
  const { data: quotations } = useQuotations({ leadId, limit: 100 });
  const { can } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!lead) {
    return <p className="text-sm text-muted-foreground">Lead not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/leads" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{lead.contactName ?? lead.leadCode}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {lead.leadCode} · {lead.vertical}
              {lead.source ? ` · ${lead.source}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <AssignLeadDialog leadId={lead.id} />
            <TransitionLeadDialog lead={lead} />
            {can('lead.manage') && (
              <DeleteLeadDialog leadId={lead.id} leadLabel={lead.contactName ?? lead.leadCode} />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>{lead.contactPhone ?? '—'}</p>
            <p>{lead.contactEmail ?? '—'}</p>
            {lead.assignedTo && (
              <p className="text-muted-foreground">
                Assigned: {lead.assignedTo.firstName} {lead.assignedTo.lastName}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer &amp; Site</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>{lead.customer?.name ?? 'New / unlinked'}</p>
            <p className="text-muted-foreground">{lead.site?.name ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{lead.notes ?? 'No notes.'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Quotations</CardTitle>
          <CreateQuotationDialog leadId={lead.id} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {quotations?.items.length === 0 && <p className="text-sm text-muted-foreground">No quotations yet.</p>}
          {quotations?.items.map((q) => (
            <QuotationRow key={q.id} quotation={q} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowTimeline entityType="LEAD" entityId={lead.id} />
        </CardContent>
      </Card>
    </div>
  );
}
