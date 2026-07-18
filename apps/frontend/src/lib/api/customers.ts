import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { CustomerDto } from '@lift-saas/shared-types';

export interface ListCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  billingAddress?: string;
}

export async function listCustomers(params?: ListCustomersParams) {
  const res = await apiClient.get<never>('/customers', { params });
  return unwrapList<CustomerDto>(res);
}

export async function getCustomer(id: number) {
  const res = await apiClient.get<never>(`/customers/${id}`);
  return unwrap<CustomerDto>(res);
}

export async function createCustomer(input: CreateCustomerInput) {
  const res = await apiClient.post<never>('/customers', input);
  return unwrap<CustomerDto>(res);
}

export async function updateCustomer(id: number, input: Partial<CreateCustomerInput>) {
  const res = await apiClient.patch<never>(`/customers/${id}`, input);
  return unwrap<CustomerDto>(res);
}

export async function deleteCustomer(id: number) {
  await apiClient.delete(`/customers/${id}`);
}
