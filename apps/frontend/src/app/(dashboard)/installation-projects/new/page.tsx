'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateInstallationProject } from '@/hooks/queries/use-installation-projects';
import { useCustomers, useLiftTypes, useSites, useStatuses, useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  projectCode: z.string().trim().min(1, 'Required'),
  customerId: z.coerce.number().int().positive({ message: 'Select a customer' }),
  siteId: z.coerce.number().int().positive({ message: 'Select a site' }),
  liftTypeId: z.coerce.number().int().positive({ message: 'Select a lift type' }),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  assignedEngineerId: z.coerce.number().int().positive().optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInstallationProjectPage() {
  const router = useRouter();
  const createProject = useCreateInstallationProject();

  const { data: customers } = useCustomers();
  const { data: liftTypes } = useLiftTypes();
  const { data: statuses } = useStatuses('INSTALLATION_PROJECT');
  const { data: users } = useUsers();
  // Role codes are DEPARTMENT_ROLE (e.g. INSTALLATION_ENGINEER), so match the
  // engineering departments by prefix and fall back to all users if none
  // qualify. Kept in sync with the detail page's assign-engineer dialog.
  const preferred = users?.filter(
    (u) =>
      u.roleCode?.startsWith('INSTALLATION') ||
      u.roleCode?.startsWith('DESIGN') ||
      u.roleCode?.startsWith('QA') ||
      u.roleCode === 'ADMIN'
  );
  const engineers = preferred && preferred.length > 0 ? preferred : users;

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const selectedCustomerId = watch('customerId');
  const { data: sites } = useSites(selectedCustomerId);

  useEffect(() => {
    setValue('siteId', undefined as unknown as number);
  }, [selectedCustomerId, setValue]);

  async function onSubmit(values: FormValues) {
    const project = await createProject.mutateAsync(values);
    router.push(`/installation-projects/${project.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/installation-projects" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New Installation Project</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="projectCode">Project code</Label>
                <Input id="projectCode" placeholder="INST-2026-001" {...register('projectCode')} />
                {errors.projectCode && <p className="text-xs text-destructive">{errors.projectCode.message}</p>}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Lift type</Label>
                <Controller
                  control={control}
                  name="liftTypeId"
                  render={({ field }) => (
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lift type" />
                      </SelectTrigger>
                      <SelectContent>
                        {liftTypes?.map((lt) => (
                          <SelectItem key={lt.id} value={String(lt.id)}>
                            {lt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.liftTypeId && <p className="text-xs text-destructive">{errors.liftTypeId.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Assigned engineer (optional)</Label>
                <Controller
                  control={control}
                  name="assignedEngineerId"
                  render={({ field }) => (
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {engineers?.map((u) => (
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plannedStartDate">Planned start</Label>
                <Input id="plannedStartDate" type="date" {...register('plannedStartDate')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plannedEndDate">Planned end</Label>
                <Input id="plannedEndDate" type="date" {...register('plannedEndDate')} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
