'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateLead } from '@/hooks/queries/use-leads';
import { useCustomers, useStatuses, useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  vertical: z.enum(['INSTALLATION', 'AMC']),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  customerId: z.coerce.number().int().positive().optional(),
  assignedToId: z.coerce.number().int().positive().optional(),
  source: z.enum(['REFERRAL', 'DIRECT', 'CHANNEL_PARTNER', 'WARRANTY_EXPIRY', 'RENEWAL_DUE']).optional(),
  contactName: z.string().trim().min(1, 'Required'),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  notes: z.string().trim().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function NewLeadPage() {
  const router = useRouter();
  const createLead = useCreateLead();

  const { data: statuses } = useStatuses('LEAD');
  const { data: customers } = useCustomers();
  const { data: users } = useUsers();
  // Sales pipeline owners: any SALES_* role (Sales Manager / Executive) plus
  // ADMIN. Falls back to all users if none match so the dropdown is never empty.
  const salesReps = users?.filter((u) => u.roleCode?.startsWith('SALES') || u.roleCode === 'ADMIN');
  const assignableUsers = salesReps && salesReps.length > 0 ? salesReps : users;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { vertical: 'INSTALLATION' } });

  async function onSubmit(values: FormValues) {
    const lead = await createLead.mutateAsync({ ...values, contactEmail: values.contactEmail || undefined });
    router.push(`/leads/${lead.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/leads" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New Lead</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Vertical</Label>
                <Controller
                  control={control}
                  name="vertical"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSTALLATION">Installation</SelectItem>
                        <SelectItem value="AMC">AMC</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactName">Contact name</Label>
                <Input id="contactName" {...register('contactName')} />
                {errors.contactName && <p className="text-xs text-destructive">{errors.contactName.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input id="contactPhone" {...register('contactPhone')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input id="contactEmail" type="email" {...register('contactEmail')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Source</Label>
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="DIRECT">Direct</SelectItem>
                        <SelectItem value="CHANNEL_PARTNER">Channel Partner</SelectItem>
                        <SelectItem value="WARRANTY_EXPIRY">Warranty Expiry</SelectItem>
                        <SelectItem value="RENEWAL_DUE">Renewal Due</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Existing customer (optional)</Label>
                <Controller
                  control={control}
                  name="customerId"
                  render={({ field }) => (
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="New / unlinked" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Assign to (optional)</Label>
                <Controller
                  control={control}
                  name="assignedToId"
                  render={({ field }) => (
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers?.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
