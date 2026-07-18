// Phase 1 (legacy): values were always { tenantId: 1, organizationId: 1 },
// injected by tenant.middleware.ts from static config.
// Phase 2 (current): the same shape is now populated by decoding JWT tenant
// claims — see auth.middleware.ts. Because every repository method takes this
// as an explicit parameter (not a global/singleton), swapping the source
// required no change below the middleware.
export interface TenantContext {
  tenantId: number;
  organizationId: number;
  companyCode?: string; // Tenant.slug — the code that appears in every URL
}

// Populated by auth.middleware from a verified TENANT access token.
export interface AuthenticatedUser {
  id: number;
  tenantId: number;
  organizationId: number;
  companyCode: string;
  roleId: number;
  roleCode: string;
  email: string;
  permissions: string[];
}

// Populated by platform-auth.middleware from a verified PLATFORM access token.
// Deliberately has NO tenant fields — a super admin never carries tenant context.
export interface AuthenticatedPlatformUser {
  id: number;
  scope: 'PLATFORM';
  email: string;
}
