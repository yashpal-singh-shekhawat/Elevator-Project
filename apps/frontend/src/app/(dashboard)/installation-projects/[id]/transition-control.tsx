'use client';

import { useState } from 'react';
import { ArrowRightCircle } from 'lucide-react';
import { useTransitionInstallationProject } from '@/hooks/queries/use-installation-projects';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// The 17-state pipeline lives entirely on InstallationProject.statusId
// (entityType "INSTALLATION_PROJECT" in Status master data). The backend
// doesn't enforce a strict linear sequence on /transition — any status code
// is accepted — so this control lets you pick any target state rather than
// hard-coding a state machine the backend doesn't actually enforce.
export function TransitionControl({ installationProjectId, currentStatusCode }: { installationProjectId: number; currentStatusCode: string }) {
  const [open, setOpen] = useState(false);
  const [toStatusCode, setToStatusCode] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const { data: statuses } = useStatuses('INSTALLATION_PROJECT');
  const transition = useTransitionInstallationProject(installationProjectId);

  const sorted = [...(statuses ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleTransition() {
    if (!toStatusCode) return;
    await transition.mutateAsync({ toStatusCode, remarks: remarks || undefined });
    setRemarks('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ArrowRightCircle className="h-3.5 w-3.5" /> Advance stage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update project stage</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>New stage</Label>
          <Select value={toStatusCode} onValueChange={setToStatusCode}>
            <SelectTrigger>
              <SelectValue placeholder={`Current: ${currentStatusCode}`} />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((s) => (
                <SelectItem key={s.id} value={s.code}>
                  {s.sortOrder}. {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transition-remarks">Remarks (optional)</Label>
          <Textarea id="transition-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleTransition} disabled={!toStatusCode || transition.isPending}>
            {transition.isPending ? 'Updating…' : 'Update stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
