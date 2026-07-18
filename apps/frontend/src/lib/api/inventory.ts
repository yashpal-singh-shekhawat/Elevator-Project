import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { InventoryStockDto, CreateInventoryStockInput, AdjustStockInput } from '@lift-saas/shared-types';

export interface ListInventoryParams {
  search?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export async function listInventory(params?: ListInventoryParams) {
  const res = await apiClient.get<never>('/inventory', { params });
  return unwrapList<InventoryStockDto>(res);
}

export async function getInventoryStock(id: number) {
  const res = await apiClient.get<never>(`/inventory/${id}`);
  return unwrap<InventoryStockDto>(res);
}

export async function createInventoryStock(input: CreateInventoryStockInput) {
  const res = await apiClient.post<never>('/inventory', input);
  return unwrap<InventoryStockDto>(res);
}

export async function updateInventoryStock(id: number, input: Partial<CreateInventoryStockInput>) {
  const res = await apiClient.patch<never>(`/inventory/${id}`, input);
  return unwrap<InventoryStockDto>(res);
}

export async function adjustStock(id: number, input: AdjustStockInput) {
  const res = await apiClient.post<never>(`/inventory/${id}/adjust`, input);
  return unwrap<InventoryStockDto>(res);
}
