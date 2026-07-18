import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { AmcContractDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListAmcContractsParams extends ListQueryParams {
  customerId?: number;
  liftId?: number;
  statusId?: number;
}

export async function listAmcContracts(params: ListAmcContractsParams) {
  const res = await apiClient.get<never>('/amc-contracts', { params });
  return unwrapList<AmcContractDto>(res);
}

export async function getAmcContract(id: number) {
  const res = await apiClient.get<never>(`/amc-contracts/${id}`);
  return unwrap<AmcContractDto>(res);
}

export interface CreateAmcContractInput {
  contractNumber: string;
  customerId: number;
  liftId: number;
  statusId: number;
  serviceTypeId: number;
  startDate: string;
  endDate: string;
  contractValue?: number;
  numberOfServicesPerYear?: number;
  tier?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  autoRenew?: boolean;
}

export async function createAmcContract(input: CreateAmcContractInput) {
  const res = await apiClient.post<never>('/amc-contracts', input);
  return unwrap<AmcContractDto>(res);
}

export interface UpdateAmcContractInput {
  statusId?: number;
  serviceTypeId?: number;
  startDate?: string;
  endDate?: string;
  contractValue?: number;
  numberOfServicesPerYear?: number;
  tier?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  autoRenew?: boolean;
}

export async function updateAmcContract(id: number, input: UpdateAmcContractInput) {
  const res = await apiClient.patch<never>(`/amc-contracts/${id}`, input);
  return unwrap<AmcContractDto>(res);
}
