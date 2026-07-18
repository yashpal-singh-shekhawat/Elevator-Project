import { v4 as uuidv4 } from 'uuid';
import { PlatformAdminRepository, ListTenantsParams } from './platform-admin.repository';
import { comparePassword, hashPassword } from '@common/utils/hash';
import { sha256 } from '@common/utils/token-hash';
import { addDuration } from '@common/utils/duration';
import { signPlatformAccessToken, signRefreshToken, verifyRefreshToken } from '@common/utils/jwt';
import { UnauthorizedError, ConflictError, NotFoundError } from '@common/errors';
import { saveTenantLogo } from '@common/utils/tenant-logo-storage';
import { env } from '@config/env';

export interface PlatformLoginResult {
  accessToken: string;
  refreshToken: string;
  user: SafePlatformUser;
}

export interface SafePlatformUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  scope: 'PLATFORM';
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

// Generate a readable but strong temp password for a new tenant admin, e.g.
// "Lift-7d3f9a2b". Shown once at creation; only the bcrypt hash is persisted.
function generateTempPassword(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `Lift-${rand}`;
}

// Derive first/last name for the bootstrap admin from the contact person (if
// provided) else the company name, so the User row has sensible non-empty names.
function splitName(contactName: string | undefined, companyName: string): [string, string] {
  const source = (contactName && contactName.length > 0 ? contactName : companyName).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ['Tenant', 'Admin'];
  if (parts.length === 1) return [parts[0], 'Admin'];
  return [parts[0], parts.slice(1).join(' ')];
}

// API contract for the super-admin console (mirrors shared-types TenantDto):
// company_name / company_unique_code / status rather than the raw db columns.
export interface TenantView {
  id: number;
  companyName: string;
  companyUniqueCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  organizationCount?: number;
  createdAt?: string;
}

// Returned ONLY by createTenant so the super admin can hand the new tenant its
// first-login details. The temp password is shown once and never stored in plain.
export interface CreatedTenantView extends TenantView {
  adminCredentials?: {
    loginUrl: string;
    email: string;
    tempPassword: string;
  };
}

interface TenantRow {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  createdAt?: Date;
  _count?: { organizations: number };
}

function toTenantView(t: TenantRow): TenantView {
  return {
    id: t.id,
    companyName: t.name,
    companyUniqueCode: t.slug,
    status: t.isActive ? 'ACTIVE' : 'INACTIVE',
    contactPerson: t.contactPerson ?? null,
    email: t.email ?? null,
    phone: t.phone ?? null,
    address: t.address ?? null,
    logoUrl: t.logoUrl ?? null,
    organizationCount: t._count?.organizations,
    createdAt: t.createdAt ? t.createdAt.toISOString() : undefined
  };
}

export interface CreateTenantData {
  name: string;
  companyCode: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoBase64?: string;
}

export interface UpdateTenantData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoBase64?: string;
}

export interface PaginatedTenants {
  data: TenantView[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DashboardStats {
  totals: {
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    totalUsers: number;
    activeUsers: number;
  };
  recentTenants: TenantView[];
  recentUsers: Array<{
    id: number;
    fullName: string;
    email: string;
    roleName: string | null;
    tenantName: string | null;
    createdAt?: string;
  }>;
  usersByTenant: Array<{ tenantName: string; count: number }>;
}

export class PlatformAdminService {
  constructor(private readonly repo: PlatformAdminRepository) {}

  async login(email: string, password: string, meta: RequestMeta): Promise<PlatformLoginResult> {
    const user = await this.repo.findActivePlatformUserByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid email or password');

    const accessToken = signPlatformAccessToken({ sub: user.id, scope: 'PLATFORM', email: user.email });
    const refreshToken = await this.issueRefreshToken(user.id, meta);
    await this.repo.touchLastLogin(user.id);

    return { accessToken, refreshToken, user: this.toSafe(user) };
  }

  async refresh(presentedToken: string, meta: RequestMeta): Promise<PlatformLoginResult> {
    let platformUserId: number;
    let scope: string | undefined;
    try {
      const payload = verifyRefreshToken(presentedToken);
      platformUserId = payload.sub;
      scope = payload.scope;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // A tenant refresh token (no PLATFORM scope) must never mint a platform session.
    if (scope !== 'PLATFORM') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenHash = sha256(presentedToken);
    const stored = await this.repo.findValidRefreshTokenByHash(tokenHash);
    if (!stored || stored.platformUserId !== platformUserId) {
      throw new UnauthorizedError('Refresh token is invalid, expired, or has already been used');
    }

    const user = await this.repo.findActivePlatformUserById(platformUserId);
    if (!user) throw new UnauthorizedError('User is no longer active');

    await this.repo.revokeRefreshTokenById(stored.id);
    const accessToken = signPlatformAccessToken({ sub: user.id, scope: 'PLATFORM', email: user.email });
    const refreshToken = await this.issueRefreshToken(user.id, meta);

    return { accessToken, refreshToken, user: this.toSafe(user) };
  }

  async logout(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) return;
    await this.repo.revokeRefreshTokenByHash(sha256(presentedToken));
  }

  async getCurrentUser(id: number): Promise<SafePlatformUser> {
    const user = await this.repo.findActivePlatformUserById(id);
    if (!user) throw new UnauthorizedError('User is no longer active');
    return this.toSafe(user);
  }

  // --- Tenant management ---------------------------------------------------

  async listTenants(params: ListTenantsParams): Promise<PaginatedTenants> {
    const { rows, total } = await this.repo.listTenants(params);
    return {
      data: rows.map(toTenantView),
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit))
      }
    };
  }

  async getTenant(id: number): Promise<TenantView> {
    const tenant = await this.repo.findTenantById(id);
    if (!tenant) throw new NotFoundError('Tenant');
    return toTenantView(tenant);
  }

  async createTenant(input: CreateTenantData): Promise<CreatedTenantView> {
    const slug = input.companyCode.toLowerCase();

    const existingSlug = await this.repo.findTenantBySlug(slug);
    if (existingSlug) throw new ConflictError('A company with this code already exists');

    const email = input.email?.trim().toLowerCase() || undefined;
    if (email) {
      const existingEmail = await this.repo.findTenantByEmail(email);
      if (existingEmail) throw new ConflictError('A company with this email already exists');
    }

    // Persist the logo (if any) before the row exists — the slug gives us a
    // stable, human-readable filename. saveTenantLogo validates + size-limits.
    const logoUrl = await saveTenantLogo(input.logoBase64, slug);

    // Bootstrap admin login for the new tenant. Admin email defaults to the
    // company contact email if given, else admin@<slug>.local. Temp password is
    // generated, shown once in the response, and stored only as a bcrypt hash.
    const adminEmail = email ?? `admin@${slug}.local`;
    const tempPassword = generateTempPassword();
    const adminPasswordHash = await hashPassword(tempPassword);
    const contactName = input.contactPerson?.trim();
    const [adminFirstName, adminLastName] = splitName(contactName, input.name);

    const created = await this.repo.createTenantWithAdmin({
      name: input.name,
      slug,
      contactPerson: input.contactPerson?.trim() || undefined,
      email,
      phone: input.phone?.trim() || undefined,
      address: input.address?.trim() || undefined,
      logoUrl,
      adminEmail,
      adminFirstName,
      adminLastName,
      adminPasswordHash
    });

    return {
      ...toTenantView(created),
      adminCredentials: {
        loginUrl: `/${slug}/login`,
        email: adminEmail,
        tempPassword
      }
    };
  }

  async updateTenant(id: number, input: UpdateTenantData): Promise<TenantView> {
    const existing = await this.repo.findTenantById(id);
    if (!existing) throw new NotFoundError('Tenant');

    const email = input.email?.trim().toLowerCase();
    if (email && email !== (existing.email ?? '').toLowerCase()) {
      const clash = await this.repo.findTenantByEmail(email);
      if (clash && clash.id !== id) throw new ConflictError('A company with this email already exists');
    }

    const logoUrl = await saveTenantLogo(input.logoBase64, existing.slug);

    const updated = await this.repo.updateTenant(id, {
      name: input.name?.trim() || undefined,
      contactPerson: input.contactPerson !== undefined ? input.contactPerson.trim() || null : undefined,
      email: input.email !== undefined ? email || null : undefined,
      phone: input.phone !== undefined ? input.phone.trim() || null : undefined,
      address: input.address !== undefined ? input.address.trim() || null : undefined,
      logoUrl // undefined when no new logo → column left untouched
    });
    return toTenantView(updated);
  }

  async setTenantStatus(id: number, isActive: boolean): Promise<TenantView> {
    const existing = await this.repo.findTenantById(id);
    if (!existing) throw new NotFoundError('Tenant');
    const updated = await this.repo.setTenantStatus(id, isActive);
    return toTenantView(updated);
  }

  // --- Dashboard -----------------------------------------------------------

  async getDashboardStats(): Promise<DashboardStats> {
    const counts = await this.repo.dashboardCounts();
    const recentTenantRows = await this.repo.recentTenants(5);
    const recentUserRows = await this.repo.recentUsers(5);
    const grouped = await this.repo.usersGroupedByTenant();

    // Resolve tenant names for the recent-users list and the chart in a single
    // lookup (User has no tenant relation by schema design).
    const tenantIds = new Set<number>();
    recentUserRows.forEach((u) => tenantIds.add(u.tenantId));
    grouped.forEach((g) => tenantIds.add(g.tenantId));
    const nameRows = await this.repo.tenantNameMap([...tenantIds]);
    const nameById = new Map(nameRows.map((t) => [t.id, t.name]));

    const usersByTenant = grouped
      .map((g) => ({ tenantName: nameById.get(g.tenantId) ?? `Tenant #${g.tenantId}`, count: g._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totals: {
        totalTenants: counts.totalTenants,
        activeTenants: counts.activeTenants,
        inactiveTenants: counts.totalTenants - counts.activeTenants,
        totalUsers: counts.totalUsers,
        activeUsers: counts.activeUsers
      },
      recentTenants: recentTenantRows.map(toTenantView),
      recentUsers: recentUserRows.map((u) => ({
        id: u.id,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        roleName: u.role?.name ?? null,
        tenantName: nameById.get(u.tenantId) ?? null,
        createdAt: u.createdAt ? u.createdAt.toISOString() : undefined
      })),
      usersByTenant
    };
  }

  private toSafe(user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  }): SafePlatformUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      scope: 'PLATFORM'
    };
  }

  private async issueRefreshToken(platformUserId: number, meta: RequestMeta): Promise<string> {
    const jti = uuidv4();
    const token = signRefreshToken({ sub: platformUserId, jti, scope: 'PLATFORM' });
    const tokenHash = sha256(token);
    const expiresAt = addDuration(new Date(), env.JWT_REFRESH_EXPIRES_IN);
    await this.repo.createRefreshToken({
      platformUserId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress
    });
    return token;
  }
}
