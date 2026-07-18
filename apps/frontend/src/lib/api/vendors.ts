import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { VendorDto, CreateVendorInput, VendorPurchaseOrderDto, CreateVendorPOInput, GrnInput } from '@lift-saas/shared-types';

export interface ListVendorsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function listVendors(params?: ListVendorsParams) {
  const res = await apiClient.get<never>('/vendors', { params });
  return unwrapList<VendorDto>(res);
}

export async function getVendor(id: number) {
  const res = await apiClient.get<never>(`/vendors/${id}`);
  return unwrap<VendorDto>(res);
}

export async function createVendor(input: CreateVendorInput) {
  const res = await apiClient.post<never>('/vendors', input);
  return unwrap<VendorDto>(res);
}

export async function updateVendor(id: number, input: Partial<CreateVendorInput>) {
  const res = await apiClient.patch<never>(`/vendors/${id}`, input);
  return unwrap<VendorDto>(res);
}

export async function deactivateVendor(id: number) {
  const res = await apiClient.post<never>(`/vendors/${id}/deactivate`, {});
  return unwrap<VendorDto>(res);
}

export interface ListVendorPOsParams {
  vendorId?: number;
  statusId?: number;
  page?: number;
  limit?: number;
}

export async function listVendorPOs(params?: ListVendorPOsParams) {
  const res = await apiClient.get<never>('/vendor-purchase-orders', { params });
  return unwrapList<VendorPurchaseOrderDto>(res);
}

export async function getVendorPO(id: number) {
  const res = await apiClient.get<never>(`/vendor-purchase-orders/${id}`);
  return unwrap<VendorPurchaseOrderDto>(res);
}

export async function createVendorPO(input: CreateVendorPOInput) {
  const res = await apiClient.post<never>('/vendor-purchase-orders', input);
  return unwrap<VendorPurchaseOrderDto>(res);
}

export async function sendVendorPO(id: number) {
  const res = await apiClient.post<never>(`/vendor-purchase-orders/${id}/send`, {});
  return unwrap<VendorPurchaseOrderDto>(res);
}

export async function receiveGRN(id: number, input: GrnInput) {
  const res = await apiClient.post<never>(`/vendor-purchase-orders/${id}/grn`, input);
  return unwrap<VendorPurchaseOrderDto>(res);
}
