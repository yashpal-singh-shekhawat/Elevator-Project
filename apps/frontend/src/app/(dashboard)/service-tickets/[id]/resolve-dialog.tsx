'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { useResolveTicket } from '@/hooks/queries/use-service-tickets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  findings: z.string().trim().min(1, 'Findings are required'),
  recommendations: z.string().trim().optional(),
  nextServiceDate: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function ResolveDialog({ ticketId }: { ticketId: number }) {
  const [open, setOpen] = useState(false);
  const resolve = useResolveTicket();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await resolve.mutateAsync({
      id: ticketId,
      findings: values.findings,
      recommendations: values.recommendations || undefined,
      nextServiceDate: values.nextServiceDate || undefined
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="findings">Findings</Label>
            <Textarea id="findings" {...register('findings')} />
            {errors.findings && <p className="text-xs text-destructive">{errors.findings.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recommendations">Recommendations (optional)</Label>
            <Textarea id="recommendations" {...register('recommendations')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nextServiceDate">Next service date (optional)</Label>
            <Input id="nextServiceDate" type="date" {...register('nextServiceDate')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Mark resolved'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
