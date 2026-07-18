'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { useUpdateSite } from '@/hooks/queries/use-sites-list';
import type { SiteListItem } from '@/lib/api/sites';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// customerId is intentionally omitted — the backend's updateSiteSchema forbids
// re-parenting a site to another customer, so we keep the customer fixed here.
const schema = z.object({
  name: z.string().trim().min(1, 'Site name is required'),
  addressLine1: z.string().trim().min(1, 'Address is required'),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export function EditSiteDialog({ site }: { site: SiteListItem }) {
  const [open, setOpen] = useState(false);
  const updateSite = useUpdateSite(site.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: site.name,
      addressLine1: site.addressLine1,
      addressLine2: site.addressLine2 ?? '',
      city: site.city ?? '',
      state: site.state ?? '',
      pincode: site.pincode ?? ''
    }
  });

  async function onSubmit(values: FormValues) {
    await updateSite.mutateAsync(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {site.customer && (
            <p className="text-sm text-muted-foreground">
              Customer: <span className="font-medium text-foreground">{site.customer.name}</span>
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-site-name">Site name</Label>
            <Input id="edit-site-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-site-addr1">Address line 1</Label>
            <Input id="edit-site-addr1" {...register('addressLine1')} />
            {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-site-addr2">Address line 2 (optional)</Label>
            <Input id="edit-site-addr2" {...register('addressLine2')} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-site-city">City</Label>
              <Input id="edit-site-city" {...register('city')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-site-state">State</Label>
              <Input id="edit-site-state" {...register('state')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-site-pincode">Pincode</Label>
              <Input id="edit-site-pincode" {...register('pincode')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
