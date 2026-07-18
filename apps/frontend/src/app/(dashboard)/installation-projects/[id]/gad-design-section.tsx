'use client';

import { useState } from 'react';
import { Check, FileEdit, Plus, RotateCcw, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateGadDesign,
  useGadDesigns,
  useApproveGadDesign,
  useRequestGadDesignChanges,
  useSubmitGadDesign
} from '@/hooks/queries/use-gad-designs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';

const createSchema = z.object({ fileUrl: z.string().trim().optional(), notes: z.string().trim().optional() });
type CreateFormValues = z.infer<typeof createSchema>;

export function GadDesignSection({ installationProjectId }: { installationProjectId: number }) {
  const { data: designs } = useGadDesigns({ installationProjectId, limit: 20 });
  const createDesign = useCreateGadDesign();
  const submitDesign = useSubmitGadDesign();
  const approveDesign = useApproveGadDesign();
  const requestChanges = useRequestGadDesignChanges();

  const [open, setOpen] = useState(false);
  const [requestingChangesFor, setRequestingChangesFor] = useState<number | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  async function onCreate(values: CreateFormValues) {
    await createDesign.mutateAsync({ ...values, installationProjectId });
    reset();
    setOpen(false);
  }

  const sorted = [...(designs?.items ?? [])].sort((a, b) => b.version - a.version);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>GAD Design</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" /> New version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New design version</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fileUrl">CAD file URL</Label>
                <Input id="fileUrl" placeholder="S3 file key / URL" {...register('fileUrl')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create version'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No design submitted yet.</p>}
        {sorted.map((design) => (
          <div key={design.id} className="flex flex-col gap-2 rounded-[var(--radius)] border border-border px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Version {design.version}</p>
              <StatusBadge status={design.status} />
            </div>
            {design.notes && <p className="text-xs text-muted-foreground">{design.notes}</p>}
            {design.revisionNotes && <p className="text-xs text-destructive">Revision requested: {design.revisionNotes}</p>}

            {design.status.code === 'DRAFT' && (
              <Button size="sm" variant="outline" className="w-fit" onClick={() => submitDesign.mutate(design.id)}>
                <Send className="h-3.5 w-3.5" /> Submit for review
              </Button>
            )}

            {design.status.code === 'REVIEW_PENDING' && requestingChangesFor !== design.id && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => approveDesign.mutate(design.id)}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRequestingChangesFor(design.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Request changes
                </Button>
              </div>
            )}

            {requestingChangesFor === design.id && (
              <div className="flex gap-2">
                <Input
                  placeholder="What needs to change…"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  disabled={!revisionNotes.trim()}
                  onClick={() => {
                    requestChanges.mutate({ id: design.id, revisionNotes });
                    setRevisionNotes('');
                    setRequestingChangesFor(null);
                  }}
                >
                  <FileEdit className="h-3.5 w-3.5" /> Send
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
