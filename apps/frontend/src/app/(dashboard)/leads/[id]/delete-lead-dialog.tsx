'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useDeleteLead } from '@/hooks/queries/use-leads';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Permanently removes a lead. Gated by `lead.manage` at the call site, so this
// only renders for users who hold that permission (matching the backend route).
export function DeleteLeadDialog({ leadId, leadLabel }: { leadId: number; leadLabel: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteLead = useDeleteLead();

  async function handleDelete() {
    await deleteLead.mutateAsync(leadId);
    setOpen(false);
    // The lead no longer exists — send the user back to the list.
    router.push('/leads');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete lead</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-medium text-foreground">{leadLabel}</span>? This action
          cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteLead.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLead.isPending}>
            {deleteLead.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
