'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSiteSurveys, useCreateSiteSurvey } from '@/hooks/queries/use-site-surveys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  pitDepthMm: z.coerce.number().positive().optional(),
  shaftWidthMm: z.coerce.number().positive().optional(),
  shaftDepthMm: z.coerce.number().positive().optional(),
  overheadClearanceMm: z.coerce.number().positive().optional(),
  powerAvailability: z.enum(['SINGLE_PHASE', 'THREE_PHASE', 'NOT_AVAILABLE']).optional(),
  powerVoltage: z.coerce.number().positive().optional(),
  machineRoomAvailable: z.boolean().optional(),
  floorCount: z.coerce.number().int().positive().optional(),
  buildingType: z.string().trim().optional(),
  accessibilityNotes: z.string().trim().optional(),
  observations: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export function SiteSurveySection({ installationProjectId }: { installationProjectId: number }) {
  const [open, setOpen] = useState(false);
  const { data: surveys } = useSiteSurveys({ installationProjectId, limit: 20 });
  const createSurvey = useCreateSiteSurvey();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createSurvey.mutateAsync({ ...values, installationProjectId });
    reset();
    setOpen(false);
  }

  const latest = surveys?.items[0];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Site Survey</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" /> {latest ? 'New survey' : 'Record survey'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Site survey details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pitDepthMm">Pit depth (mm)</Label>
                  <Input id="pitDepthMm" type="number" {...register('pitDepthMm')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="overheadClearanceMm">Overhead clearance (mm)</Label>
                  <Input id="overheadClearanceMm" type="number" {...register('overheadClearanceMm')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shaftWidthMm">Shaft width (mm)</Label>
                  <Input id="shaftWidthMm" type="number" {...register('shaftWidthMm')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shaftDepthMm">Shaft depth (mm)</Label>
                  <Input id="shaftDepthMm" type="number" {...register('shaftDepthMm')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Power availability</Label>
                  <Controller
                    control={control}
                    name="powerAvailability"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_PHASE">Single Phase</SelectItem>
                          <SelectItem value="THREE_PHASE">Three Phase</SelectItem>
                          <SelectItem value="NOT_AVAILABLE">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="powerVoltage">Voltage (V)</Label>
                  <Input id="powerVoltage" type="number" {...register('powerVoltage')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="floorCount">Floor count</Label>
                  <Input id="floorCount" type="number" {...register('floorCount')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="buildingType">Building type</Label>
                  <Input id="buildingType" {...register('buildingType')} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="observations">Observations</Label>
                <Textarea id="observations" {...register('observations')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save survey'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!latest && <p className="text-sm text-muted-foreground">No survey recorded yet.</p>}
        {latest && (
          <div className="grid grid-cols-4 gap-3 text-sm">
            <Field label="Pit depth" value={latest.pitDepthMm ? `${latest.pitDepthMm}mm` : '—'} />
            <Field label="Overhead clearance" value={latest.overheadClearanceMm ? `${latest.overheadClearanceMm}mm` : '—'} />
            <Field label="Shaft width" value={latest.shaftWidthMm ? `${latest.shaftWidthMm}mm` : '—'} />
            <Field label="Power" value={latest.powerAvailability ?? '—'} />
            {latest.observations && (
              <div className="col-span-4">
                <p className="text-xs text-muted-foreground">{latest.observations}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
