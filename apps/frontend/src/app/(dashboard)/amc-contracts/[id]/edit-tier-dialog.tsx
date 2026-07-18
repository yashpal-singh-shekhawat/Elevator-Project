'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { useUpdateAmcContract } from '@/hooks/queries/use-amc-contracts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM'], { required_error: 'Select a tier' })
});

type FormValues = z.infer<typeof schema>;

export function EditTierDialog({ amcContractId, currentTier }: { amcContractId: number; currentTier?: string }) {
  const [open, setOpen] = useState(false);
  const updateContract = useUpdateAmcContract(amcContractId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tier: currentTier as FormValues['tier'] | undefined }
  });

  async function onSubmit(values: FormValues) {
    await updateContract.mutateAsync({ tier: values.tier });
    reset(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Edit tier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set contract tier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
            {errors.tier && <p className="text-xs text-destructive">{errors.tier.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save tier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
