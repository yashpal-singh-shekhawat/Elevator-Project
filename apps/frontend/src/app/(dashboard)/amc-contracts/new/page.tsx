'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateAmcContract } from '@/hooks/queries/use-amc-contracts';
import { useCustomers, useLifts, useServiceTypes, useSites, useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z
  .object({
    contractNumber: z.string().trim().min(1, 'Required'),
    customerId: z.coerce.number().int().positive({ message: 'Select a customer' }),
    siteId: z.coerce.number().int().positive({ message: 'Select a site' }),
    liftId: z.coerce.number().int().positive({ message: 'Select a lift' }),
    statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
    serviceTypeId: z.coerce.number().int().positive({ message: 'Select a service type' }),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
    contractValue: z.coerce.number().positive().optional(),
    numberOfServicesPerYear: z.coerce.number().int().positive().default(4),
    tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
    autoRenew: z.boolean().default(false)
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate']
  });

type FormValues = z.infer<typeof formSchema>;

export default function NewAmcContractPage() {
  const router = useRouter();
  const createContract = useCreateAmcContract();

  const { data: customers } = useCustomers();
  const { data: statuses } = useStatuses('AMC_CONTRACT');
  const { data: serviceTypes } = useServiceTypes();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { numberOfServicesPerYear: 4, autoRenew: false } });

  const selectedCustomerId = watch('customerId');
  const selectedSiteId = watch('siteId');
  const { data: sites } = useSites(selectedCustomerId);
  const { data: lifts } = useLifts(selectedSiteId);

  useEffect(() => {
    setValue('siteId', undefined as unknown as number);
    setValue('liftId', undefined as unknown as number);
  }, [selectedCustomerId, setValue]);

  useEffect(() => {
    setValue('liftId', undefined as unknown as number);
  }, [selectedSiteId, setValue]);

  async function onSubmit(values: FormValues) {
    const contract = await createContract.mutateAsync(values);
    router.push(`/amc-contracts/${contract.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/amc-contracts" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to contracts
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New AMC Contract</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Contract details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contractNumber">Contract number</Label>
                <Input id="contractNumber" placeholder="AMC-2026-001" {...register('contractNumber')} />
                {errors.contractNumber && <p className="text-xs text-destructive">{errors.contractNumber.message}</p>}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Customer</Label>
                <Controller
                  control={control}
                  name="customerId"
                  render={({ field }) => (
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
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
                {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Site</Label>
                <Controller
                  control={control}
                  name="siteId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={!selectedCustomerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCustomerId ? 'Select site' : 'Pick a customer first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {sites?.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.siteId && <p className="text-xs text-destructive">{errors.siteId.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Lift</Label>
                <Controller
                  control={control}
                  name="liftId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={!selectedSiteId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSiteId ? 'Select lift' : 'Pick a site first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {lifts?.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.serialNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.liftId && <p className="text-xs text-destructive">{errors.liftId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Service type</Label>
                <Controller
                  control={control}
                  name="serviceTypeId"
                  render={({ field }) => (
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes?.map((st) => (
                          <SelectItem key={st.id} value={String(st.id)}>
                            {st.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.serviceTypeId && <p className="text-xs text-destructive">{errors.serviceTypeId.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="numberOfServicesPerYear">Services per year</Label>
                <Input id="numberOfServicesPerYear" type="number" {...register('numberOfServicesPerYear')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Tier (optional)</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endDate">End date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contractValue">Contract value (optional)</Label>
              <Input id="contractValue" type="number" step="0.01" {...register('contractValue')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create contract'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
