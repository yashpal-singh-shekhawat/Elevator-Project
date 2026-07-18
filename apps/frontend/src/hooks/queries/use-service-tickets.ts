'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/service-tickets';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const ticketKeys = {
  all: ['service-tickets'] as const,
  list: (params: api.ListServiceTicketsParams) => [...ticketKeys.all, 'list', params] as const,
  detail: (id: number) => [...ticketKeys.all, 'detail', id] as const
};

export function useServiceTickets(params: api.ListServiceTicketsParams) {
  return useQuery({ queryKey: ticketKeys.list(params), queryFn: () => api.listServiceTickets(params) });
}

export function useServiceTicket(id: number) {
  return useQuery({ queryKey: ticketKeys.detail(id), queryFn: () => api.getServiceTicket(id), enabled: Number.isFinite(id) });
}

export function useCreateServiceTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createServiceTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast({ title: 'Ticket created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create ticket', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useCategorizeTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, categoryTag, priorityFlag }: { id: number; categoryTag: api.TicketCategoryTag; priorityFlag?: api.TicketPriority }) =>
      api.categorizeTicket(id, categoryTag, priorityFlag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast({ title: 'Ticket categorized', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to categorize', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, technicianId }: { id: number; technicianId: number }) => api.assignTicket(id, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast({ title: 'Technician assigned', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to assign', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useStartTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.startTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast({ title: 'Visit started', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to start visit', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useResolveTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, findings, recommendations, nextServiceDate }: { id: number; findings: string; recommendations?: string; nextServiceDate?: string }) =>
      api.resolveTicket(id, findings, recommendations, nextServiceDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast({ title: 'Ticket resolved', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to resolve', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.closeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      toast({ title: 'Ticket closed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to close ticket', description: getErrorMessage(err), variant: 'destructive' })
  });
}
