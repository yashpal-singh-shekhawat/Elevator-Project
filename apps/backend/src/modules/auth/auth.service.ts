import { v4 as uuidv4 } from 'uuid';
import { AuthRepository, UserWithRole } from './auth.repository';
import { comparePassword } from '@common/utils/hash';
import { sha256 } from '@common/utils/token-hash';
import { addDuration } from '@common/utils/duration';
import { signAccessToken, signRefreshToken, verifyRefreshToken, AccessTokenPayload } from '@common/utils/jwt';
import { UnauthorizedError } from '@common/errors';
import { TenantContext } from '@common/types/tenant-context';
import { env } from '@config/env';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface SafeUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  companyCode: string;
  permissions: string[];
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

function toSafeUser(user: UserWithRole, companyCode: string): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    roleCode: user.role.code,
    roleName: user.role.name,
    companyCode,
    permissions: user.role.rolePermissions.map((rp) => rp.permission.code)
  };
}

function toAccessTokenPayload(tenant: ResolvedTenant, user: UserWithRole): AccessTokenPayload {
  return {
    sub: user.id,
    tenantId: tenant.id,
    organizationId: tenant.organizationId,
    companyCode: tenant.companyCode,
    roleId: user.roleId,
    roleCode: user.role.code,
    email: user.email,
    permissions: user.role.rolePermissions.map((rp) => rp.permission.code)
  };
}

interface ResolvedTenant {
  id: number;
  organizationId: number;
  companyCode: string;
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * URL-based tenant login. The tenant is resolved from `companyCode`
   * (Tenant.slug) taken from the /:companyCode/login URL — NOT from anything
   * the client sends in the token/body. We then search users ONLY within that
   * tenant, so a user from another company can never authenticate on this
   * company's URL (they simply won't be found → generic 401).
   */
  // Public (unauthenticated) tenant branding for the login screen: given a
  // company slug, return just the display name + logo so the login page can
  // show the company's identity before the user has signed in. Returns null
  // for unknown/inactive tenants so the caller can fall back to default branding.
  async getPublicBranding(companyCode: string): Promise<{ name: string; logoUrl: string | null } | null> {
    const slug = companyCode.trim().toLowerCase();
    if (!slug) return null;
    const tenant = await this.authRepository.findTenantBySlug(slug);
    if (!tenant || !tenant.isActive) return null;
    return { name: tenant.name, logoUrl: tenant.logoUrl ?? null };
  }

  async login(companyCode: string, email: string, password: string, meta: RequestMeta): Promise<LoginResult> {
    const tenant = await this.resolveActiveTenant(companyCode);

    const user = await this.authRepository.findActiveUserByEmail(tenant.id, email);

    // Deliberately generic message — do not reveal whether the email exists,
    // nor whether it exists in a DIFFERENT tenant.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = signAccessToken(toAccessTokenPayload(tenant, user));
    const refreshToken = await this.issueRefreshToken(user.id, meta);

    await this.authRepository.touchLastLogin(user.id);

    return { accessToken, refreshToken, user: toSafeUser(user, tenant.companyCode) };
  }

  /**
   * Verifies + rotates a refresh token: the presented token is revoked and a
   * brand new one is issued, so a stolen-but-unused token can only ever be
   * used once before its reuse is detectable (the old hash is gone).
   *
   * The tenant is re-derived from the user's own record (not from the client),
   * so the refreshed access token always carries the correct companyCode.
   */
  async refresh(presentedToken: string, meta: RequestMeta): Promise<LoginResult> {
    let userId: number;
    try {
      ({ sub: userId } = verifyRefreshToken(presentedToken));
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = sha256(presentedToken);
    const storedToken = await this.authRepository.findValidRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.userId !== userId) {
      throw new UnauthorizedError('Refresh token is invalid, expired, or has already been used');
    }

    const user = await this.authRepository.findActiveUserByIdAnyTenant(userId);
    if (!user) {
      throw new UnauthorizedError('User is no longer active');
    }

    const tenant = await this.resolveTenantById(user.tenantId);

    // Rotate: revoke the presented token, issue a new one.
    await this.authRepository.revokeRefreshTokenById(storedToken.id);
    const accessToken = signAccessToken(toAccessTokenPayload(tenant, user));
    const refreshToken = await this.issueRefreshToken(user.id, meta);

    return { accessToken, refreshToken, user: toSafeUser(user, tenant.companyCode) };
  }

  async logout(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) return;
    const tokenHash = sha256(presentedToken);
    await this.authRepository.revokeRefreshTokenByHash(tokenHash);
  }

  async getCurrentUser(tenant: TenantContext, userId: number): Promise<SafeUser> {
    const user = await this.authRepository.findActiveUserById(tenant.tenantId, userId);
    if (!user) {
      throw new UnauthorizedError('User is no longer active');
    }
    const companyCode = tenant.companyCode ?? (await this.resolveTenantById(tenant.tenantId)).companyCode;
    return toSafeUser(user, companyCode);
  }

  private async resolveActiveTenant(companyCode: string): Promise<ResolvedTenant> {
    // Slugs are stored lowercase; normalize so /ACME/login resolves too.
    const tenant = await this.authRepository.findTenantBySlug(companyCode.trim().toLowerCase());
    // Unknown or inactive tenant → same generic error as a bad credential, so
    // the login URL doesn't become a tenant-enumeration oracle.
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const organizationId = await this.authRepository.findDefaultOrganizationId(tenant.id);
    return { id: tenant.id, organizationId, companyCode: tenant.slug };
  }

  private async resolveTenantById(tenantId: number): Promise<ResolvedTenant> {
    const tenant = await this.authRepository.findTenantById(tenantId);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedError('Tenant is no longer active');
    }
    const organizationId = await this.authRepository.findDefaultOrganizationId(tenant.id);
    return { id: tenant.id, organizationId, companyCode: tenant.slug };
  }

  private async issueRefreshToken(userId: number, meta: RequestMeta): Promise<string> {
    const jti = uuidv4();
    const token = signRefreshToken({ sub: userId, jti });
    const tokenHash = sha256(token);
    const expiresAt = addDuration(new Date(), env.JWT_REFRESH_EXPIRES_IN);

    await this.authRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress
    });

    return token;
  }
}
