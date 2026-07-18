'use client';

import { useState } from 'react';
import { ArrowRightCircle } from 'lucide-react';
import type { LeadDto } from '@lift-saas/shared-types';
import { useTransitionLead } from '@/hooks/queries/use-leads';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function TransitionLeadDialog({ lead }: { lead: LeadDto }) {
  const [open, setOpen] = useState(false);
  const [statusId, setStatusId] = useState<number | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const { data: statuses } = useStatuses('LEAD');
  const transitionLead = useTransitionLead();

  async function handleTransition() {
    if (!statusId) return;
    await transitionLead.mutateAsync({ id: lead.id, statusId, remarks: remarks || undefined });
    setRemarks('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ArrowRightCircle className="h-3.5 w-3.5" /> Change status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update lead status</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>New status</Label>
          <Select value={statusId ? String(statusId) : undefined} onValueChange={(v) => setStatusId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder={`Current: ${lead.status.label}`} />
            </SelectTrigger>
            <SelectContent>
              {statuses?.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="remarks">Remarks (optional)</Label>
          <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleTransition} disabled={!statusId || transitionLead.isPending}>
            {transitionLead.isPending ? 'Updating…' : 'Update status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
