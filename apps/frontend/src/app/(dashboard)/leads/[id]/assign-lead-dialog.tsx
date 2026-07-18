'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAssignLead } from '@/hooks/queries/use-leads';
import { useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AssignLeadDialog({ leadId }: { leadId: number }) {
  const [open, setOpen] = useState(false);
  const [assignedToId, setAssignedToId] = useState<number | undefined>(undefined);
  const { data: users } = useUsers();
  // Prefer sales-oriented roles (any SALES* code) plus ADMIN, but fall back to
  // all users if none match — role codes vary per tenant, so an exact 'SALES'
  // check would leave the dropdown empty.
  const preferred = users?.filter((u) => u.roleCode?.startsWith('SALES') || u.roleCode === 'ADMIN');
  const salesReps = preferred && preferred.length > 0 ? preferred : users;
  const assignLead = useAssignLead();

  async function handleAssign() {
    if (!assignedToId) return;
    await assignLead.mutateAsync({ id: leadId, assignedToId });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3.5 w-3.5" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign lead</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Sales rep</Label>
          <Select value={assignedToId ? String(assignedToId) : undefined} onValueChange={(v) => setAssignedToId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select sales rep" />
            </SelectTrigger>
            <SelectContent>
              {salesReps?.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={!assignedToId || assignLead.isPending}>
            {assignLead.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
