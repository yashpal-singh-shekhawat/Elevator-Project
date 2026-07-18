'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAmcContract } from '@/hooks/queries/use-amc-contracts';
import { useAmcSchedules } from '@/hooks/queries/use-amc-schedules';
import { useAmcVisits } from '@/hooks/queries/use-amc-visits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { GenerateScheduleDialog } from './generate-schedule-dialog';
import { AddVisitDialog } from './add-visit-dialog';
import { VisitRow } from './visit-row';
import { EditTierDialog } from './edit-tier-dialog';

const TIER_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  PREMIUM: 'default',
  STANDARD: 'secondary',
  BASIC: 'outline'
};

export default function AmcContractDetailPage({ params }: { params: { id: string } }) {
  const contractId = Number(params.id);

  const { data: contract, isLoading } = useAmcContract(contractId);
  const { data: schedules } = useAmcSchedules({ amcContractId: contractId, limit: 100 });
  const { data: visits } = useAmcVisits({ amcContractId: contractId, limit: 100 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!contract) {
    return <p className="text-sm text-muted-foreground">Contract not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/amc-contracts" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to contracts
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{contract.contractNumber}</h1>
          <StatusBadge status={contract.status} />
          {contract.tier && <Badge variant={TIER_VARIANT[contract.tier] ?? 'outline'}>{contract.tier}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {contract.customer.name} · Lift <span className="font-mono">{contract.lift.serialNumber}</span> · {contract.serviceType.name}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <InfoCard label="Start date" value={new Date(contract.startDate).toLocaleDateString()} />
        <InfoCard label="End date" value={new Date(contract.endDate).toLocaleDateString()} />
        <InfoCard label="Services / year" value={String(contract.numberOfServicesPerYear)} />
        <InfoCard label="Auto renew" value={contract.autoRenew ? 'Yes' : 'No'} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Contract tier</CardTitle>
          <EditTierDialog amcContractId={contract.id} currentTier={contract.tier ?? undefined} />
        </CardHeader>
        <CardContent>
          {contract.tier ? (
            <Badge variant={TIER_VARIANT[contract.tier] ?? 'outline'}>{contract.tier}</Badge>
          ) : (
            <p className="text-sm text-muted-foreground">No tier set — use &quot;Edit tier&quot; to assign one.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Service schedule</CardTitle>
          <GenerateScheduleDialog amcContractId={contract.id} servicesPerYear={contract.numberOfServicesPerYear} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {schedules?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No schedule generated yet — use &quot;Generate schedule&quot; above.</p>
          )}
          {schedules?.items.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border px-3 py-2.5 text-sm">
              <span>
                {new Date(schedule.scheduledDate).toLocaleDateString()} · {schedule.serviceType.name}
              </span>
              <StatusBadge status={schedule.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Visits</CardTitle>
          <AddVisitDialog amcContractId={contract.id} liftId={contract.lift.id} />
        </CardHeader>
        <CardContent className="p-0">
          {visits?.items.length === 0 && <p className="px-3 pb-4 text-sm text-muted-foreground">No visits logged yet.</p>}
          {visits?.items.map((visit) => (
            <VisitRow key={visit.id} visit={visit} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
