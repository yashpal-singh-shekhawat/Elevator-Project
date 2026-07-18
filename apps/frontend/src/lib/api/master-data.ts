import { apiClient } from '@/lib/api-client';
import { unwrapList } from './unwrap';
import type { CustomerDto, LiftDto, LiftTypeDto, SafeUser, ServiceTypeDto, SiteDto, StatusDto } from '@lift-saas/shared-types';

// Simple read-only lookups for populating dropdowns. Pagination limit is set
// generously high since these are admin-configured, low-cardinality lists
// (statuses/lift-types) or filtered lookups (sites by customer) — a "load
// more" pattern isn't needed here.
// Backend's shared listQuerySchema caps `limit` at 100 (common/utils/pagination.ts) —
// this MUST stay <= 100 or every one of these requests 400s on validation and
// every dropdown silently comes back empty.
const LOOKUP_LIMIT = 100;

export async function listCustomers(search?: string) {
  const res = await apiClient.get<never>('/customers', { params: { limit: LOOKUP_LIMIT, search } });
  return unwrapList<CustomerDto>(res).items;
}

export async function listSites(customerId?: number) {
  const res = await apiClient.get<never>('/sites', { params: { limit: LOOKUP_LIMIT, customerId } });
  return unwrapList<SiteDto>(res).items;
}

export async function listLifts(siteId?: number) {
  const res = await apiClient.get<never>('/lifts', { params: { limit: LOOKUP_LIMIT, siteId } });
  return unwrapList<LiftDto>(res).items;
}

export async function listLiftTypes() {
  const res = await apiClient.get<never>('/master-data/lift-types', { params: { limit: LOOKUP_LIMIT } });
  return unwrapList<LiftTypeDto>(res).items;
}

export async function listServiceTypes() {
  const res = await apiClient.get<never>('/master-data/service-types', { params: { limit: LOOKUP_LIMIT } });
  return unwrapList<ServiceTypeDto>(res).items;
}

export async function listStatuses(entityType: string) {
  const res = await apiClient.get<never>('/master-data/statuses', { params: { limit: LOOKUP_LIMIT, entityType } });
  return unwrapList<StatusDto>(res).items;
}

export async function listUsers(roleId?: number) {
  const res = await apiClient.get<never>('/users', { params: { limit: LOOKUP_LIMIT, roleId } });
  return unwrapList<SafeUser>(res).items;
}
