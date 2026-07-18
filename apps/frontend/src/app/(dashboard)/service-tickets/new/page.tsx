'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateServiceTicket } from '@/hooks/queries/use-service-tickets';
import { useAmcContracts } from '@/hooks/queries/use-amc-contracts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  amcContractId: z.coerce.number().int().positive({ message: 'Select an AMC contract' }),
  source: z.enum(['AUTO_PM', 'CLIENT_PORTAL', 'WHATSAPP', 'PHONE', 'MANUAL']),
  categoryTag: z.enum(['PM', 'MECHANICAL', 'ELECTRICAL', 'DOOR', 'SAFETY_CIRCUIT']).optional(),
  priorityFlag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
  passengerEntrapped: z.boolean(),
  findings: z.string().trim().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function NewServiceTicketPage() {
  const router = useRouter();
  const createTicket = useCreateServiceTicket();

  const { data: contracts } = useAmcContracts({ limit: 100 });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { source: 'MANUAL', priorityFlag: 'NORMAL', passengerEntrapped: false }
  });

  const amcContractId = watch('amcContractId');
  const selectedContract = contracts?.items.find((c) => c.id === amcContractId);

  async function onSubmit(values: FormValues) {
    if (!selectedContract) return;
    const ticket = await createTicket.mutateAsync({
      amcContractId: values.amcContractId,
      liftId: selectedContract.lift.id,
      source: values.source,
      categoryTag: values.categoryTag,
      priorityFlag: values.priorityFlag,
      passengerEntrapped: values.passengerEntrapped,
      findings: values.findings || undefined
    });
    router.push(`/service-tickets/${ticket.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/service-tickets" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New Service Ticket</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Ticket details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label>AMC Contract</Label>
              <Controller
                control={control}
                name="amcContractId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts?.items.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.contractNumber} · {c.customer.name} · Lift {c.lift.serialNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.amcContractId && <p className="text-xs text-destructive">{errors.amcContractId.message}</p>}
              {selectedContract && (
                <p className="text-xs text-muted-foreground">Lift: {selectedContract.lift.serialNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Source</Label>
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO_PM">Auto (Preventive Maintenance)</SelectItem>
                        <SelectItem value="CLIENT_PORTAL">Client Portal</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <Controller
                  control={control}
                  name="priorityFlag"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Category (optional)</Label>
                <Controller
                  control={control}
                  name="categoryTag"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Uncategorized" />
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
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('passengerEntrapped')} />
                  Passenger entrapped
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="findings">Findings (optional)</Label>
              <Textarea id="findings" {...register('findings')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create ticket'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
