import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { ListQueryParams, ServiceTicketDto } from '@lift-saas/shared-types';

export type TicketCategoryTag = 'PM' | 'MECHANICAL' | 'ELECTRICAL' | 'DOOR' | 'SAFETY_CIRCUIT';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type TicketSource = 'AUTO_PM' | 'CLIENT_PORTAL' | 'WHATSAPP' | 'PHONE' | 'MANUAL';

export interface ListServiceTicketsParams extends ListQueryParams {
  amcContractId?: number;
  statusId?: number;
  assignedToId?: number;
  priorityFlag?: TicketPriority;
  liftId?: number;
}

export async function listServiceTickets(params: ListServiceTicketsParams) {
  const res = await apiClient.get<never>('/service-tickets', { params });
  return unwrapList<ServiceTicketDto>(res);
}

export async function getServiceTicket(id: number) {
  const res = await apiClient.get<never>(`/service-tickets/${id}`);
  return unwrap<ServiceTicketDto>(res);
}

export interface CreateServiceTicketInput {
  amcContractId: number;
  liftId: number;
  source: TicketSource;
  categoryTag?: TicketCategoryTag;
  priorityFlag?: TicketPriority;
  passengerEntrapped?: boolean;
  amcScheduleId?: number;
  findings?: string;
  recommendations?: string;
}

export async function createServiceTicket(input: CreateServiceTicketInput) {
  const res = await apiClient.post<never>('/service-tickets', input);
  return unwrap<ServiceTicketDto>(res);
}

export async function updateServiceTicket(id: number, input: { findings?: string; recommendations?: string; nextServiceDate?: string }) {
  const res = await apiClient.patch<never>(`/service-tickets/${id}`, input);
  return unwrap<ServiceTicketDto>(res);
}

export async function categorizeTicket(id: number, categoryTag: TicketCategoryTag, priorityFlag?: TicketPriority) {
  const res = await apiClient.post<never>(`/service-tickets/${id}/categorize`, { categoryTag, priorityFlag });
  return unwrap<ServiceTicketDto>(res);
}

export async function assignTicket(id: number, technicianId: number) {
  const res = await apiClient.post<never>(`/service-tickets/${id}/assign`, { technicianId });
  return unwrap<ServiceTicketDto>(res);
}

export async function startTicket(id: number) {
  const res = await apiClient.post<never>(`/service-tickets/${id}/start`, {});
  return unwrap<ServiceTicketDto>(res);
}

export async function resolveTicket(id: number, findings: string, recommendations?: string, nextServiceDate?: string) {
  const res = await apiClient.post<never>(`/service-tickets/${id}/resolve`, { findings, recommendations, nextServiceDate });
  return unwrap<ServiceTicketDto>(res);
}

export async function closeTicket(id: number) {
  const res = await apiClient.post<never>(`/service-tickets/${id}/close`, {});
  return unwrap<ServiceTicketDto>(res);
}
