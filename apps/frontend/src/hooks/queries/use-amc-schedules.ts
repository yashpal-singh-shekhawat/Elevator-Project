'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/amc-schedules';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

const scheduleKeys = {
  list: (params: api.ListAmcSchedulesParams) => ['amc-schedules', 'list', params] as const
};

export function useAmcSchedules(params: api.ListAmcSchedulesParams) {
  return useQuery({ queryKey: scheduleKeys.list(params), queryFn: () => api.listAmcSchedules(params) });
}

export function useGenerateAmcSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.generateAmcSchedules,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['amc-schedules'] });
      toast({ title: `${result.generatedCount} schedules generated`, variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to generate schedules', description: getErrorMessage(err), variant: 'destructive' })
  });
}
