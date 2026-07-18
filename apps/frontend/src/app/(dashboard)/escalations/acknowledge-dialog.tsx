'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardCheck } from 'lucide-react';
import { useAcknowledgeEscalation } from '@/hooks/queries/use-breakdown-escalations';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  resolution: z.enum(['RESOLVED_IN_AMC', 'ROUTED_TO_MODERNIZATION'], { required_error: 'Select a resolution' }),
  notes: z.string().trim().min(1, 'Notes are required')
});

type FormValues = z.infer<typeof schema>;

export function AcknowledgeDialog({ escalationId }: { escalationId: number }) {
  const [open, setOpen] = useState(false);
  const acknowledge = useAcknowledgeEscalation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await acknowledge.mutateAsync({ id: escalationId, input: values });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardCheck className="h-3.5 w-3.5" /> Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review escalation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Resolution</Label>
            <Controller
              control={control}
              name="resolution"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESOLVED_IN_AMC">Resolve within AMC</SelectItem>
                    <SelectItem value="ROUTED_TO_MODERNIZATION">Route to modernization</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.resolution && <p className="text-xs text-destructive">{errors.resolution.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save decision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
