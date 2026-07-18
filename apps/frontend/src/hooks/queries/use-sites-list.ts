'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/sites';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const siteKeys = {
  all: ['sites'] as const,
  list: (params?: api.ListSitesParams) => [...siteKeys.all, 'list', params] as const,
  detail: (id: number) => [...siteKeys.all, 'detail', id] as const,
};

export function useSitesList(params?: api.ListSitesParams) {
  return useQuery({ queryKey: siteKeys.list(params), queryFn: () => api.listSites(params) });
}

export function useSiteDetail(id: number) {
  return useQuery({ queryKey: siteKeys.detail(id), queryFn: () => api.getSite(id), enabled: Number.isFinite(id) });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateSiteInput) => api.createSite(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteKeys.all });
      qc.invalidateQueries({ queryKey: ['sites-lookup'] });
      toast({ title: 'Site created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create site', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateSite(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Omit<api.CreateSiteInput, 'customerId'>>) => api.updateSite(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: siteKeys.all }); toast({ title: 'Site updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update site', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSite(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: siteKeys.all }); toast({ title: 'Site deleted', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to delete site', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
