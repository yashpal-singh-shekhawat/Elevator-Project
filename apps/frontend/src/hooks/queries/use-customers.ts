'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/customers';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const customerKeys = {
  all: ['customers'] as const,
  list: (params?: api.ListCustomersParams) => [...customerKeys.all, 'list', params] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
};

export function useCustomers(params?: api.ListCustomersParams) {
  return useQuery({ queryKey: customerKeys.list(params), queryFn: () => api.listCustomers(params) });
}

export function useCustomer(id: number) {
  return useQuery({ queryKey: customerKeys.detail(id), queryFn: () => api.getCustomer(id), enabled: Number.isFinite(id) });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateCustomerInput) => api.createCustomer(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: customerKeys.all }); toast({ title: 'Customer created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create customer', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<api.CreateCustomerInput>) => api.updateCustomer(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: customerKeys.all }); toast({ title: 'Customer updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update customer', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteCustomer(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: customerKeys.all }); toast({ title: 'Customer deleted', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to delete customer', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
