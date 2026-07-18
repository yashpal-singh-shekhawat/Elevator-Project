'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag } from 'lucide-react';
import { useCategorizeTicket } from '@/hooks/queries/use-service-tickets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  categoryTag: z.enum(['PM', 'MECHANICAL', 'ELECTRICAL', 'DOOR', 'SAFETY_CIRCUIT'], { required_error: 'Select a category' }),
  priorityFlag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional()
});

type FormValues = z.infer<typeof schema>;

export function CategorizeDialog({ ticketId }: { ticketId: number }) {
  const [open, setOpen] = useState(false);
  const categorize = useCategorizeTicket();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await categorize.mutateAsync({ id: ticketId, categoryTag: values.categoryTag, priorityFlag: values.priorityFlag });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-3.5 w-3.5" /> Categorize
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categorize ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryTag"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PM">Preventive Maintenance</SelectItem>
                    <SelectItem value="MECHANICAL">Mechanical</SelectItem>
                    <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                    <SelectItem value="DOOR">Door</SelectItem>
                    <SelectItem value="SAFETY_CIRCUIT">Safety Circuit</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryTag && <p className="text-xs text-destructive">{errors.categoryTag.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Priority override (optional)</Label>
            <Controller
              control={control}
              name="priorityFlag"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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
