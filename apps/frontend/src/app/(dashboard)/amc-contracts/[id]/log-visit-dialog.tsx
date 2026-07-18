'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardEdit } from 'lucide-react';
import type { AmcVisitDto } from '@lift-saas/shared-types';
import { useUpdateAmcVisit } from '@/hooks/queries/use-amc-visits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  findings: z.string().trim().optional(),
  actionsTaken: z.string().trim().optional(),
  nextServiceDate: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function LogVisitDialog({ visit }: { visit: AmcVisitDto }) {
  const [open, setOpen] = useState(false);
  const updateVisit = useUpdateAmcVisit();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      findings: visit.findings ?? '',
      actionsTaken: visit.actionsTaken ?? '',
      nextServiceDate: visit.nextServiceDate?.slice(0, 10) ?? ''
    }
  });

  async function onSubmit(values: FormValues) {
    await updateVisit.mutateAsync({ id: visit.id, input: values });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardEdit className="h-3.5 w-3.5" /> Log findings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log visit findings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="findings">Findings</Label>
            <Textarea id="findings" placeholder="Condition observed, issues found…" {...register('findings')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actionsTaken">Actions taken</Label>
            <Textarea id="actionsTaken" placeholder="Repairs, replacements, adjustments made…" {...register('actionsTaken')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nextServiceDate">Next service date (optional)</Label>
            <Input id="nextServiceDate" type="date" {...register('nextServiceDate')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
