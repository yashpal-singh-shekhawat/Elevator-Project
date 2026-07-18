'use client';

import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { useGenerateAmcSchedules } from '@/hooks/queries/use-amc-schedules';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function GenerateScheduleDialog({ amcContractId, servicesPerYear }: { amcContractId: number; servicesPerYear: number }) {
  const [open, setOpen] = useState(false);
  const generate = useGenerateAmcSchedules();

  async function handleGenerate() {
    await generate.mutateAsync({ amcContractId });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="h-3.5 w-3.5" /> Generate schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate service schedule</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Creates {servicesPerYear} evenly spaced planned service visits across this contract&apos;s start and end
          dates, using the contract&apos;s default service type.
        </p>
        <DialogFooter>
          <Button onClick={handleGenerate} disabled={generate.isPending}>
            {generate.isPending ? 'Generating…' : `Generate ${servicesPerYear} schedules`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
