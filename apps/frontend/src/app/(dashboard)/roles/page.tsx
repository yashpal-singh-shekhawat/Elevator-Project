'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Shield, Trash2, Save, Lock } from 'lucide-react';
import type { RoleDto } from '@lift-saas/shared-types';
import { useRoles, usePermissionCatalog, useSetRolePermissions, useDeleteRole } from '@/hooks/queries/use-roles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CreateRoleDialog } from './create-role-dialog';

// Turn a permission module key ("master-data") into a readable section title.
function formatModule(module: string) {
  return module
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function RolesPage() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: catalog, isLoading: catalogLoading } = usePermissionCatalog();
  const setPermissions = useSetRolePermissions();
  const deleteRole = useDeleteRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Working copy of the selected role's permission codes (edited via checkboxes).
  const [draft, setDraft] = useState<Set<string>>(new Set());

  const selectedRole: RoleDto | undefined = useMemo(
    () => roles?.find((r) => r.id === selectedId),
    [roles, selectedId]
  );

  // Default the selection to the first role once data arrives.
  useEffect(() => {
    if (selectedId === null && roles && roles.length > 0) {
      setSelectedId(roles[0].id);
    }
  }, [roles, selectedId]);

  // Reset the draft whenever the selected role (or its saved permissions) changes.
  useEffect(() => {
    if (selectedRole) setDraft(new Set(selectedRole.permissionCodes));
  }, [selectedRole]);

  const locked = !selectedRole || selectedRole.isSystem;

  // Dirty check: draft differs from the role's saved set.
  const isDirty = useMemo(() => {
    if (!selectedRole) return false;
    const saved = new Set(selectedRole.permissionCodes);
    if (saved.size !== draft.size) return true;
    for (const c of draft) if (!saved.has(c)) return true;
    return false;
  }, [selectedRole, draft]);

  // Warn before leaving with unsaved matrix edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  function toggle(code: string) {
    if (locked) return;
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleModule(codes: string[], allSelected: boolean) {
    if (locked) return;
    setDraft((prev) => {
      const next = new Set(prev);
      for (const c of codes) {
        if (allSelected) next.delete(c);
        else next.add(c);
      }
      return next;
    });
  }

  function selectRole(id: number) {
    if (isDirty && !confirm('Discard unsaved permission changes?')) return;
    setSelectedId(id);
  }

  function onSave() {
    if (!selectedRole) return;
    setPermissions.mutate({ id: selectedRole.id, permissionCodes: Array.from(draft) });
  }

  function onDelete() {
    if (!selectedRole) return;
    if (!confirm(`Delete the "${selectedRole.name}" role? This cannot be undone.`)) return;
    deleteRole.mutate(selectedRole.id, {
      onSuccess: () => setSelectedId(null)
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" /> Users
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Roles &amp; Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Decide what each role can do. Changes apply the next time a user signs in.
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Role
        </Button>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Left: role list */}
        <div className="flex flex-col gap-1.5">
          {rolesLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}

          {roles?.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => selectRole(role.id)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-[var(--radius)] border px-3 py-2 text-left transition-colors',
                role.id === selectedId
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:bg-secondary/60'
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{role.name}</span>
                {role.isSystem && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </div>
              <span className="text-xs text-muted-foreground">
                {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
              </span>
            </button>
          ))}
        </div>

        {/* Right: permission matrix */}
        <div className="flex flex-col gap-4">
          {!selectedRole && !rolesLoading && (
            <div className="flex h-40 items-center justify-center rounded-[var(--radius)] border border-dashed border-border text-sm text-muted-foreground">
              Select a role to view its permissions.
            </div>
          )}

          {selectedRole && (
            <>
              <div className="flex items-start justify-between gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedRole.name}</span>
                    <Badge variant="outline" className="font-mono">
                      {selectedRole.code}
                    </Badge>
                    {selectedRole.isSystem && <Badge variant="secondary">System</Badge>}
                  </div>
                  {selectedRole.description && (
                    <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                  )}
                  {selectedRole.isSystem && (
                    <p className="text-xs text-muted-foreground">
                      The Admin role always has every permission and cannot be edited or deleted.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {!selectedRole.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={onDelete}
                      disabled={deleteRole.isPending}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                  <Button size="sm" onClick={onSave} disabled={locked || !isDirty || setPermissions.isPending}>
                    <Save className="h-4 w-4" /> {setPermissions.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </div>

              {catalogLoading &&
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

              {catalog?.map((group) => {
                const codes = group.permissions.map((p) => p.code);
                // For the ADMIN (system) role, show everything as granted.
                const isChecked = (code: string) => (selectedRole.isSystem ? true : draft.has(code));
                const allSelected = codes.every((c) => isChecked(c));
                const someSelected = codes.some((c) => isChecked(c));

                return (
                  <div key={group.module} className="rounded-[var(--radius)] border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{formatModule(group.module)}</h3>
                        <span className="text-xs text-muted-foreground">
                          {codes.filter(isChecked).length}/{codes.length}
                        </span>
                      </div>
                      <label
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          locked ? 'text-muted-foreground' : 'cursor-pointer'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-border"
                          disabled={locked}
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = !allSelected && someSelected;
                          }}
                          onChange={() => toggleModule(codes, allSelected)}
                        />
                        Select all
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-4 sm:grid-cols-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.code}
                          className={cn(
                            'flex items-start gap-2.5 rounded-sm px-2 py-1.5 text-sm',
                            locked ? 'text-muted-foreground' : 'cursor-pointer hover:bg-secondary/50'
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-border"
                            disabled={locked}
                            checked={isChecked(perm.code)}
                            onChange={() => toggle(perm.code)}
                          />
                          <span className="flex flex-col">
                            <span className="font-mono text-xs">{perm.code}</span>
                            {perm.description && (
                              <span className="text-xs text-muted-foreground">{perm.description}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => setSelectedId(id)} />
    </div>
  );
}
