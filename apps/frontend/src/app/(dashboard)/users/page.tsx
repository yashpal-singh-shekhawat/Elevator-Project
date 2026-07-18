'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Shield, Pencil } from 'lucide-react';
import type { TenantUserDto } from '@lift-saas/shared-types';
import { useUsers, useDeleteUser } from '@/hooks/queries/use-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { UserFormDialog } from './user-form-dialog';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useUsers({ page, limit: 20, search: search || undefined });
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TenantUserDto | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(user: TenantUserDto) {
    setEditing(user);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage your team’s logins and role assignments</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/roles">
              <Shield className="h-4 w-4" /> Roles &amp; Permissions
            </Link>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name or email…"
          className="pl-8"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  No users yet. Add your first team member.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role?.name ?? '—'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'success' : 'destructive'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Remove ${user.firstName} ${user.lastName}?`)) deleteUser.mutate(user.id);
                      }}
                      disabled={deleteUser.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} />
    </div>
  );
}
