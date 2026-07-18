import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';

// The list/detail endpoints hydrate each site with its parent customer
// (see site.repository include), so we describe that richer shape here.
export interface SiteListItem {
  id: number;
  customerId: number;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  customer?: { id: number; name: string };
}

export interface ListSitesParams {
  search?: string;
  customerId?: number;
  page?: number;
  limit?: number;
}

export interface CreateSiteInput {
  customerId: number;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export async function listSites(params?: ListSitesParams) {
  const res = await apiClient.get<never>('/sites', { params });
  return unwrapList<SiteListItem>(res);
}

export async function getSite(id: number) {
  const res = await apiClient.get<never>(`/sites/${id}`);
  return unwrap<SiteListItem>(res);
}

export async function createSite(input: CreateSiteInput) {
  const res = await apiClient.post<never>('/sites', input);
  return unwrap<SiteListItem>(res);
}

export async function updateSite(id: number, input: Partial<Omit<CreateSiteInput, 'customerId'>>) {
  const res = await apiClient.patch<never>(`/sites/${id}`, input);
  return unwrap<SiteListItem>(res);
}

export async function deleteSite(id: number) {
  await apiClient.delete(`/sites/${id}`);
}
