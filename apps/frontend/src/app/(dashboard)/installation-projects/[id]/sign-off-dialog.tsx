'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileSignature } from 'lucide-react';
import { useSignOffInstallationProject } from '@/hooks/queries/use-installation-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  signedByName: z.string().trim().min(1, 'Client name is required to close this project'),
  remarks: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

// Phase 1 digital sign-off: a typed client-name acknowledgment. Recorded in
// WorkflowTransition.remarks (see backend fix — InstallationProject has no
// generic 'notes' column, so this is the source of truth for the record).
// Real e-signature capture is a future enhancement.
export function SignOffDialog({ installationProjectId }: { installationProjectId: number }) {
  const [open, setOpen] = useState(false);
  const signOff = useSignOffInstallationProject(installationProjectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await signOff.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileSignature className="h-4 w-4" /> Client sign-off
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client handover sign-off</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirms final client acceptance and closes the project. Make sure any punch-list items are resolved first.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="signedByName">Client representative name</Label>
            <Input id="signedByName" {...register('signedByName')} />
            {errors.signedByName && <p className="text-xs text-destructive">{errors.signedByName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Textarea id="remarks" {...register('remarks')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording…' : 'Confirm sign-off'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
