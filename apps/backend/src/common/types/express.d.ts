import type { TenantContext, AuthenticatedUser, AuthenticatedPlatformUser } from './tenant-context';
import type { AuditLogger } from '@common/middlewares/audit.middleware';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantContext: TenantContext;
      user?: AuthenticatedUser; // set by auth.middleware (tenant scope)
      platformUser?: AuthenticatedPlatformUser; // set by platform-auth.middleware (super admin)
      urlCompanyCode?: string; // tenant code from the URL/header, set by tenant-resolver
      audit: AuditLogger; // set by audit.middleware
    }
  }
}

export {};
