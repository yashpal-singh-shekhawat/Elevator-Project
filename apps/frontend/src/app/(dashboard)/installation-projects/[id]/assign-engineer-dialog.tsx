'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAssignInstallationEngineer } from '@/hooks/queries/use-installation-projects';
import { useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AssignEngineerDialog({ installationProjectId }: { installationProjectId: number }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const { data: users } = useUsers();
  // Role codes vary per tenant, so match engineer-type roles by prefix and fall
  // back to all users if none qualify — otherwise the dropdown is empty.
  const preferred = users?.filter(
    (u) =>
      u.roleCode?.startsWith('INSTALLATION') ||
      u.roleCode?.startsWith('ENGINEER') ||
      u.roleCode?.startsWith('DESIGN') ||
      u.roleCode?.startsWith('QA') ||
      u.roleCode === 'ADMIN'
  );
  const engineers = preferred && preferred.length > 0 ? preferred : users;
  const assignEngineer = useAssignInstallationEngineer(installationProjectId);

  async function handleAssign() {
    if (!userId) return;
    await assignEngineer.mutateAsync(userId);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3.5 w-3.5" /> Assign engineer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign engineer</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Engineer / QA / Design lead</Label>
          <Select value={userId ? String(userId) : undefined} onValueChange={(v) => setUserId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {engineers?.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.firstName} {u.lastName} ({u.roleName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={!userId || assignEngineer.isPending}>
            {assignEngineer.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
