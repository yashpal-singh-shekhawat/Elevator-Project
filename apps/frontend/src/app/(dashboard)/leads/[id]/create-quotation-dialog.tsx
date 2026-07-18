'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateQuotation } from '@/hooks/queries/use-quotations';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  validUntil: z.string().optional(),
  totalAmount: z.coerce.number().positive().optional(),
  notes: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateQuotationDialog({ leadId }: { leadId: number }) {
  const [open, setOpen] = useState(false);
  const { data: statuses } = useStatuses('QUOTATION');
  const createQuotation = useCreateQuotation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createQuotation.mutateAsync({ ...values, leadId });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> New quotation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New quotation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Tier</Label>
              <Controller
                control={control}
                name="tier"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="statusId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.statusId && <p className="text-xs text-destructive">{errors.statusId.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalAmount">Total amount</Label>
              <Input id="totalAmount" type="number" step="0.01" {...register('totalAmount')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="validUntil">Valid until</Label>
              <Input id="validUntil" type="date" {...register('validUntil')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
