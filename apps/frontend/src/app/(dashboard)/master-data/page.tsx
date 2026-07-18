'use client';

import { useState } from 'react';
import { useStatusesAdmin, useLiftTypesAdmin, useServiceTypesAdmin } from '@/hooks/queries/use-master-data-admin';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import { CreateStatusDialog } from './create-status-dialog';
import { CreateTypeDialog } from './create-type-dialog';

const TABS = [
  { key: 'statuses', label: 'Statuses' },
  { key: 'lift-types', label: 'Lift Types' },
  { key: 'service-types', label: 'Service Types' }
] as const;

type TabKey = (typeof TABS)[number]['key'];

const ENTITY_TYPES = [
  'LEAD',
  'QUOTATION',
  'INSTALLATION_PROJECT',
  'INSTALLATION_TASK',
  'AMC_CONTRACT',
  'AMC_SCHEDULE',
  'AMC_VISIT',
  'LIFT'
];

export default function MasterDataPage() {
  const [tab, setTab] = useState<TabKey>('statuses');
  const { can } = usePermissions();
  const canManage = can('masterdata.manage');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Master Data</h1>
        <p className="text-sm text-muted-foreground">Configure statuses, lift types and service types for this tenant</p>
      </div>

      <div className="flex gap-1 rounded-[var(--radius)] border border-border p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'statuses' && <StatusesPanel canManage={canManage} />}
      {tab === 'lift-types' && <LiftTypesPanel canManage={canManage} />}
      {tab === 'service-types' && <ServiceTypesPanel canManage={canManage} />}
    </div>
  );
}

function StatusesPanel({ canManage }: { canManage: boolean }) {
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const { data, isLoading } = useStatusesAdmin({ entityType, limit: 100 });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Select value={entityType ?? 'ALL'} onValueChange={(v) => setEntityType(v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All entity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All entity types</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && <CreateStatusDialog defaultEntityType={entityType} />}
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No statuses found.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{s.entityType}</TableCell>
                <TableCell className="font-mono text-xs">{s.code}</TableCell>
                <TableCell>
                  <StatusBadge status={s} />
                </TableCell>
                <TableCell className="text-muted-foreground">{s.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={s.isActive ? 'success' : 'destructive'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LiftTypesPanel({ canManage }: { canManage: boolean }) {
  const { data, isLoading } = useLiftTypesAdmin({ limit: 100 });
  return <TypesTable canManage={canManage} kind="lift" items={data?.items} isLoading={isLoading} />;
}

function ServiceTypesPanel({ canManage }: { canManage: boolean }) {
  const { data, isLoading } = useServiceTypesAdmin({ limit: 100 });
  return <TypesTable canManage={canManage} kind="service" items={data?.items} isLoading={isLoading} />;
}

function TypesTable({
  canManage,
  kind,
  items,
  isLoading
}: {
  canManage: boolean;
  kind: 'lift' | 'service';
  items?: { id: number; code: string; name: string; isActive: boolean }[];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <CreateTypeDialog kind={kind} />
        </div>
      )}
      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && items?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No {kind === 'lift' ? 'lift' : 'service'} types yet.
                </TableCell>
              </TableRow>
            )}
            {items?.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.code}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  <Badge variant={t.isActive ? 'success' : 'destructive'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
