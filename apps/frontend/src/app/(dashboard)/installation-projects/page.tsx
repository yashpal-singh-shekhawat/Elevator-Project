'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useInstallationProjects } from '@/hooks/queries/use-installation-projects';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';

export default function InstallationProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>(undefined);

  const { data: statuses } = useStatuses('INSTALLATION_PROJECT');
  const { data, isLoading } = useInstallationProjects({ page, limit: 20, search: search || undefined, statusId });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Installation Projects</h1>
          <p className="text-sm text-muted-foreground">Survey to sign-off tracking for lift installations</p>
        </div>
        <Button asChild>
          <Link href="/installation-projects/new">
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search project code…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={statusId ? String(statusId) : 'all'}
          onValueChange={(value) => {
            setStatusId(value === 'all' ? undefined : Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses?.map((status) => (
              <SelectItem key={status.id} value={String(status.id)}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Lift Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Planned Start</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No installation projects yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((project) => (
              <TableRow key={project.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs">
                  <Link href={`/installation-projects/${project.id}`} className="text-foreground hover:text-primary">
                    {project.projectCode}
                  </Link>
                </TableCell>
                <TableCell>{project.customer.name}</TableCell>
                <TableCell>{project.site.name}</TableCell>
                <TableCell>{project.liftType.name}</TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {project.plannedStartDate ? new Date(project.plannedStartDate).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
