'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/site-surveys';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export function useSiteSurveys(params: api.ListSiteSurveysParams) {
  return useQuery({ queryKey: ['site-surveys', 'list', params], queryFn: () => api.listSiteSurveys(params) });
}

export function useCreateSiteSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSiteSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-surveys'] });
      toast({ title: 'Survey saved', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to save survey', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateSiteSurvey(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.updateSiteSurvey>[1]) => api.updateSiteSurvey(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-surveys'] });
      toast({ title: 'Survey updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update survey', description: getErrorMessage(err), variant: 'destructive' })
  });
}
