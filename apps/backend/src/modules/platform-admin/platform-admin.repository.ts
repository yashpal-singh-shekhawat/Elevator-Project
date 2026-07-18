import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_TENANT_ROLES } from '@common/rbac/default-roles';
import {
  DEFAULT_STATUSES,
  DEFAULT_LIFT_TYPES,
  DEFAULT_SERVICE_TYPES
} from '@common/rbac/default-master-data';

// Shared column projection so the API never leaks internal-only fields and
// every tenant read returns the same shape the super-admin console expects.
const TENANT_SELECT = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  logoUrl: true,
  createdAt: true
} satisfies Prisma.TenantSelect;

export interface ListTenantsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export class PlatformAdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --- Platform (super admin) users ---------------------------------------

  findActivePlatformUserByEmail(email: string) {
    return this.prisma.platformUser.findFirst({
      where: { email, isActive: true, deletedAt: null }
    });
  }

  findActivePlatformUserById(id: number) {
    return this.prisma.platformUser.findFirst({
      where: { id, isActive: true, deletedAt: null }
    });
  }

  touchLastLogin(id: number) {
    return this.prisma.platformUser.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  }

  // --- Platform refresh tokens (own table, isolated from tenant tokens) ----

  createRefreshToken(data: {
    platformUserId: number;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.platformRefreshToken.create({ data });
  }

  findValidRefreshTokenByHash(tokenHash: string) {
    return this.prisma.platformRefreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
    });
  }

  revokeRefreshTokenById(id: number) {
    return this.prisma.platformRefreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  revokeRefreshTokenByHash(tokenHash: string) {
    return this.prisma.platformRefreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  // --- Tenant management ---------------------------------------------------

  private buildTenantWhere(params: ListTenantsParams): Prisma.TenantWhereInput {
    const where: Prisma.TenantWhereInput = {};
    if (params.status) where.isActive = params.status === 'ACTIVE';
    const q = params.search?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }
    return where;
  }

  async listTenants(params: ListTenantsParams) {
    const where = this.buildTenantWhere(params);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: { ...TENANT_SELECT, _count: { select: { organizations: true } } }
      }),
      this.prisma.tenant.count({ where })
    ]);
    return { rows, total };
  }

  findTenantById(id: number) {
    return this.prisma.tenant.findUnique({ where: { id }, select: TENANT_SELECT });
  }

  findTenantBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  findTenantByEmail(email: string) {
    return this.prisma.tenant.findUnique({ where: { email } });
  }

  // Creates the tenant, its default organization, an ADMIN role (with the full
  // permission set — roles are per-tenant), and a bootstrap admin user, all in
  // one transaction so a new tenant can immediately log in at /{slug}/login.
  async createTenantWithAdmin(data: {
    name: string;
    slug: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
    adminPasswordHash: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          address: data.address,
          logoUrl: data.logoUrl,
          organizations: { create: { name: `${data.name} (Default)` } }
        },
        select: {
          ...TENANT_SELECT,
          organizations: { select: { id: true }, orderBy: { id: 'asc' }, take: 1 }
        }
      });

      const organizationId = tenant.organizations[0]?.id;

      const adminRole = await tx.role.create({
        data: { tenantId: tenant.id, code: 'ADMIN', name: 'Admin' }
      });

      // Grant the ADMIN role every permission (mirrors the seed's ADMIN matrix).
      const permissions = await tx.permission.findMany({ select: { id: true, code: true } });
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
          skipDuplicates: true
        });
      }

      const permissionIdByCode = new Map(permissions.map((p) => [p.code, p.id]));

      // Pre-seed the full ForceLift role catalogue so the tenant admin starts
      // with editable roles instead of a blank slate. Done in bulk (two queries
      // instead of ~40) to keep the whole transaction well under Neon's timeout:
      //   1) create all roles at once, returning their generated ids
      //   2) create every role-permission row in a single createMany
      const createdRoles = await tx.role.createManyAndReturn({
        data: DEFAULT_TENANT_ROLES.map((roleDef) => ({
          tenantId: tenant.id,
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description
        })),
        select: { id: true, code: true }
      });

      const roleIdByCode = new Map(createdRoles.map((r) => [r.code, r.id]));
      const catalogueRows = DEFAULT_TENANT_ROLES.flatMap((roleDef) => {
        const roleId = roleIdByCode.get(roleDef.code);
        if (!roleId) return [];
        return roleDef.permissionCodes
          .map((code) => permissionIdByCode.get(code))
          .filter((id): id is number => typeof id === 'number')
          .map((permissionId) => ({ roleId, permissionId }));
      });
      if (catalogueRows.length > 0) {
        await tx.rolePermission.createMany({ data: catalogueRows, skipDuplicates: true });
      }

      // Seed default master data (statuses incl. LEAD, lift types, service
      // types) so the new tenant's dropdowns are usable immediately instead of
      // starting empty. Each is a single bulk insert to stay within the timeout.
      await tx.status.createMany({
        data: DEFAULT_STATUSES.map((s) => ({ tenantId: tenant.id, ...s })),
        skipDuplicates: true
      });
      await tx.liftType.createMany({
        data: DEFAULT_LIFT_TYPES.map((lt) => ({ tenantId: tenant.id, ...lt })),
        skipDuplicates: true
      });
      await tx.serviceType.createMany({
        data: DEFAULT_SERVICE_TYPES.map((st) => ({ tenantId: tenant.id, ...st })),
        skipDuplicates: true
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          organizationId,
          roleId: adminRole.id,
          email: data.adminEmail,
          passwordHash: data.adminPasswordHash,
          firstName: data.adminFirstName,
          lastName: data.adminLastName
        }
      });

      // Return the plain tenant shape (drop the helper `organizations` selection).
      const { organizations: _organizations, ...rest } = tenant;
      return rest;
    }, {
      // Neon serverless can be slow on cold connections; give the whole bootstrap
      // (tenant + org + roles + permissions + admin user) comfortable headroom
      // over Prisma's 5s interactive-transaction default so it never hits P2028.
      maxWait: 10000,
      timeout: 30000
    });
  }

  updateTenant(
    id: number,
    data: {
      name?: string;
      contactPerson?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      logoUrl?: string;
    }
  ) {
    return this.prisma.tenant.update({ where: { id }, data, select: TENANT_SELECT });
  }

  setTenantStatus(id: number, isActive: boolean) {
    return this.prisma.tenant.update({ where: { id }, data: { isActive }, select: TENANT_SELECT });
  }

  // --- Dashboard aggregates ------------------------------------------------

  async dashboardCounts() {
    const [totalTenants, activeTenants, totalUsers, activeUsers] = await this.prisma.$transaction([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } })
    ]);
    return { totalTenants, activeTenants, totalUsers, activeUsers };
  }

  recentTenants(take: number) {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: TENANT_SELECT
    });
  }

  // User has no `tenant` relation (tenantId is a plain scalar column by design),
  // so the caller resolves tenant names from a separate lookup.
  recentUsers(take: number) {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tenantId: true,
        createdAt: true,
        role: { select: { name: true } }
      }
    });
  }

  tenantNameMap(ids: number[]) {
    return this.prisma.tenant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true }
    });
  }

  // Per-tenant user counts (chart data — top tenants by user count).
  usersGroupedByTenant() {
    return this.prisma.user.groupBy({
      by: ['tenantId'],
      where: { deletedAt: null },
      _count: { _all: true }
    });
  }
}
